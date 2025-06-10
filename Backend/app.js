import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import ImageKit from 'imagekit'
dotenv.config()

import { toConnectDB } from './src/db/db.js'
import cookieParser from 'cookie-parser'
import routes from './src/Routes/user.routes.js'
import messageModel from './src/Models/chat.models.js'
import userModel from './src/Models/users.models.js'

const app = express()
const server = createServer(app)

// Fixed CORS origins - removed trailing slash and updated URL
const allowedOrigins = [
  'http://localhost:5173',
  'https://chatzone-frontend-1ozbvzi6a-ayush-dubeys-projects-2629d683.vercel.app/'
]

// Initialize Socket.IO with proper configuration for production
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Important for production deployment
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
})

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGE_KIT_URL_END_POINT,
})

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image and video files are allowed'), false)
    }
  }
})

// CORS setup - fixed origins
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

// Home route
app.get("/", (req, res) => {
  res.json({ 
    message: "ChatZone Backend Server is running!",
    status: "healthy",
    timestamp: new Date().toISOString()
  })
})

// Health check route for deployment
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// File upload endpoint
app.post("/user/upload-file", upload.single('file'), async (req, res) => {
  try {
    console.log('File upload request received')
    console.log('File:', req.file ? req.file.originalname : 'No file')
    console.log('Body:', req.body)

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { senderId, receiverId } = req.body
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'senderId and receiverId are required' })
    }

    console.log('Uploading to ImageKit...')
    
    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${Date.now()}_${req.file.originalname}`,
      folder: '/chat-files',
      useUniqueFileName: true,
    })

    console.log('ImageKit upload successful:', uploadResponse.url)

    // Save file message to database
    const fileMessage = new messageModel({
      senderId,
      receiverId,
      message: uploadResponse.url,
      messageType: 'file',
      fileInfo: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        imageKitFileId: uploadResponse.fileId
      },
      timeStamp: new Date(),
      isRead: false
    })

    await fileMessage.save()
    console.log('File message saved to database')

    // Create message data for socket emission
    const messageData = {
      fromUser: senderId,
      toUser: receiverId,
      message: uploadResponse.url,
      messageType: 'file',
      fileInfo: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      timestamp: fileMessage.timeStamp
    }

    // Emit to specific users
    const allSockets = Array.from(io.sockets.sockets.values())
    let emittedCount = 0
    allSockets.forEach(s => {
      if (s.username === senderId || s.username === receiverId) {
        s.emit("private-message", messageData)
        emittedCount++
      }
    })

    console.log(`File message emitted to ${emittedCount} sockets`)

    res.json({
      success: true,
      fileUrl: uploadResponse.url,
      message: messageData
    })

  } catch (error) {
    console.error('File upload error:', error)
    console.error('Error stack:', error.stack)
    
    // More specific error handling
    if (error.message && error.message.includes('ImageKit')) {
      res.status(500).json({ error: 'Failed to upload to ImageKit', details: error.message })
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Database validation error', details: error.message })
    } else {
      res.status(500).json({ error: 'Failed to upload file', details: error.message })
    }
  }
})

// Get all registered users
app.get("/user/all-users", async (req, res) => {
  try {
    const allUsers = await userModel.find({}, { name: 1, email: 1, _id: 0 })
    const userList = allUsers.map(user => user.name)
    res.json(userList)
  } catch (error) {
    console.error('Error fetching all users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Chat history endpoint
app.get("/user/messages", async (req, res) => {
  try {
    const { senderId, receiverId } = req.query
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "senderId and receiverId are required" })
    }

    const messages = await messageModel.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ timeStamp: 1 })

    // Format messages to match frontend expectations
    const formattedMessages = messages.map(msg => ({
      fromUser: msg.senderId,
      toUser: msg.receiverId,
      message: msg.message,
      messageType: msg.messageType || 'text',
      fileInfo: msg.fileInfo || null,
      timestamp: msg.timeStamp
    }))

    res.json(formattedMessages)
  } catch (err) {
    console.error('Error fetching messages:', err)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Get unread messages endpoint
app.get("/user/unread-messages", async (req, res) => {
  try {
    const { username } = req.query
    
    if (!username) {
      return res.status(400).json({ error: "Username is required" })
    }

    // Get all messages where user is receiver and message is unread
    const unreadMessages = await messageModel.aggregate([
      {
        $match: {
          receiverId: username,
          isRead: { $ne: true }
        }
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
          lastMessage: {
            $last: {
              message: "$message",
              timestamp: "$timeStamp",
              messageType: "$messageType",
              fileInfo: "$fileInfo"
            }
          }
        }
      }
    ])

    // Also get last messages for all conversations
    const lastMessages = await messageModel.aggregate([
      {
        $match: {
          $or: [
            { senderId: username },
            { receiverId: username }
          ]
        }
      },
      {
        $sort: { timeStamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", username] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: {
            $first: {
              message: "$message",
              timestamp: "$timeStamp",
              messageType: "$messageType",
              fileInfo: "$fileInfo",
              senderId: "$senderId"
            }
          }
        }
      }
    ])

    // Format unread counts
    const unreadCounts = {}
    unreadMessages.forEach(item => {
      unreadCounts[item._id] = item.count
    })

    // Format last messages
    const lastMessagesFormatted = {}
    lastMessages.forEach(item => {
      lastMessagesFormatted[item._id] = {
        message: item.lastMessage.message,
        timestamp: item.lastMessage.timestamp,
        isFile: item.lastMessage.messageType === 'file'
      }
    })

    res.json({
      success: true,
      unreadCounts,
      lastMessages: lastMessagesFormatted
    })

  } catch (error) {
    console.error('Error fetching unread messages:', error)
    res.status(500).json({ error: 'Failed to fetch unread messages' })
  }
})

// Mark messages as read endpoint
app.post("/user/mark-read", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "senderId and receiverId are required" })
    }

    // Mark all messages from senderId to receiverId as read
    await messageModel.updateMany(
      {
        senderId: senderId,
        receiverId: receiverId,
        isRead: { $ne: true }
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    )

    res.json({ success: true })

  } catch (error) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Failed to mark messages as read' })
  }
})

const onlineUsers = new Map()

// Function to get all users with their online status
const getAllUsersWithStatus = async () => {
  try {
    const allUsers = await userModel.find({}, { name: 1, _id: 0 })
    const allUserNames = allUsers.map(user => user.name)
    const onlineUserNames = Array.from(onlineUsers.values())
    
    const usersWithStatus = allUserNames.map(username => ({
      username,
      isOnline: onlineUserNames.includes(username),
      lastSeen: onlineUserNames.includes(username) ? new Date() : null
    }))
    
    return usersWithStatus
  } catch (error) {
    console.error('Error getting users with status:', error)
    return []
  }
}

// Socket.IO connection handling with better error handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("register-user", async (username) => {
    try {
      onlineUsers.set(socket.id, username)
      socket.username = username 

      const usersWithStatus = await getAllUsersWithStatus()
      io.emit("update-users", usersWithStatus)
      
      console.log(`${username} came online. Total users:`, usersWithStatus.length)
    } catch (error) {
      console.error('Error in register-user:', error)
      socket.emit("error", { message: "Failed to register user" })
    }
  })

  socket.on("private-message", async ({ fromUser, toUser, message }) => {
    try {
      const timestamp = new Date()
      
      const newMessage = new messageModel({
        senderId: fromUser,
        receiverId: toUser,
        message,
        messageType: 'text',
        timeStamp: timestamp,
        isRead: false
      })

      await newMessage.save()

      const messageData = {
        fromUser,
        toUser,
        message,
        messageType: 'text',
        timestamp: timestamp
      }

      const allSockets = Array.from(io.sockets.sockets.values())
      allSockets.forEach(s => {
        if (s.username === fromUser || s.username === toUser) {
          s.emit("private-message", messageData)
        }
      })

      console.log(`Private message from ${fromUser} to ${toUser} at ${timestamp.toLocaleTimeString()}: ${message}`)
    } catch (error) {
      console.error('Error handling private message:', error)
      socket.emit("message-error", { 
        error: "Failed to send message",
        originalMessage: { fromUser, toUser, message }
      })
    }
  })

  socket.on("disconnect", async (reason) => {
    try {
      const username = onlineUsers.get(socket.id)
      onlineUsers.delete(socket.id)
      
      const usersWithStatus = await getAllUsersWithStatus()
      io.emit("update-users", usersWithStatus)
      
      if (username) {
        console.log(`${username} went offline (${reason}). Remaining online:`, Array.from(onlineUsers.values()))
      }
    } catch (error) {
      console.error('Error handling disconnect:', error)
    }
  })

  socket.on("error", (error) => {
    console.error("Socket error:", error)
  })

  // Handle socket connection errors
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error)
  })
})

// Routes
app.use("/user", routes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  })
})

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  })
})

// Use environment variable for port
const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  toConnectDB()
  console.log(`Server is running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
