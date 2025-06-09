import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'ai-chat'],
    default: 'text'
  },
  fileInfo: {
    fileName: String,
    fileSize: Number,
    mimeType: String,
    imageKitFileId: String
  },
  timeStamp: {
    type: Date,
    default: Date.now
  },
  // Read status fields
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // AI-specific fields
  isAiBot: {
    type: Boolean,
    default: false
  },
  isError: {
    type: Boolean,
    default: false
  },
  // Support for both field names (for backward compatibility)
  timestamp: {
    type: Date,
    default: Date.now
  },
  fromUser: {
    type: String
  },
  toUser: {
    type: String
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
})


const messageModel = mongoose.model('Message', messageSchema)

export default messageModel