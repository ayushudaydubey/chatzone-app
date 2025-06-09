import messageModel from "../Models/chat.models.js";
import { generateAIResponse } from "../Services/ai.service.js";

export async function messageController(req, res) {
  const { senderId, receiverId, message } = req.body;

  try {
    const newMessage = await messageModel.create({
      senderId,
      receiverId,
      message
    });

    res.status(200).json({
      message: 'success',
      newMessage
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to store message", error: error.message });
  }
}

export const getAiMessagesController = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    // Find AI conversation messages using standard MongoDB query
    // Assuming AI bot has a specific identifier like 'ai-bot' or similar
    const aiMessages = await messageModel.find({
      $or: [
        { senderId: userId, receiverId: 'ai-bot' },
        { senderId: 'ai-bot', receiverId: userId },
        { fromUser: userId, toUser: 'ai-bot' },
        { fromUser: 'ai-bot', toUser: userId },
        { messageType: 'ai-chat', $or: [{ senderId: userId }, { receiverId: userId }, { fromUser: userId }, { toUser: userId }] }
      ]
    }).sort({ createdAt: 1, timestamp: 1, timeStamp: 1 });

    // Transform messages to match frontend expectations
    const transformedMessages = aiMessages.map(msg => ({
      fromUser: msg.fromUser || msg.senderId,
      toUser: msg.toUser || msg.receiverId,
      message: msg.message,
      timestamp: msg.timestamp || msg.timeStamp || msg.createdAt,
      isAiBot: msg.isAiBot || msg.senderId === 'ai-bot' || msg.fromUser === 'ai-bot',
      isError: msg.isError || false,
      isRead: msg.isRead || false,
      _id: msg._id
    }));

    res.status(200).json(transformedMessages);

  } catch (error) {
    console.error("Error fetching AI messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch AI messages"
    });
  }
};

// Helper function to save messages
async function saveMessage(messageData) {
  return await messageModel.create(messageData);
}

// AI message save controller - Backend to save AI response
export const aiMessageSaveController = async (req, res) => {
  try {
    const { fromUser, toUser, message, timestamp, isAiBot, isError } = req.body;
    
    // Validate required fields
    if (!fromUser || !toUser || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fromUser, toUser, message"
      });
    }

    // Create AI message object using the unified schema
    const aiMessage = {
      senderId: fromUser,
      receiverId: toUser,
      fromUser: fromUser,
      toUser: toUser,
      message,
      timeStamp: timestamp ? new Date(timestamp) : new Date(),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      messageType: 'ai-chat',
      isAiBot: isAiBot || false,
      isError: isError || false,
      isRead: false // AI messages start as unread
    };

    // Save to database
    const savedMessage = await messageModel.create(aiMessage);
    
    res.status(201).json({
      success: true,
      message: "AI message saved successfully",
      data: savedMessage
    });

  } catch (error) {
    console.error("Error saving AI message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save AI message"
    });
  }
};

// Controller to get messages between two users
export const getMessagesController = async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        error: "Both senderId and receiverId are required"
      });
    }

    // Find conversation between two users using standard MongoDB query
    const messages = await messageModel.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
        { fromUser: senderId, toUser: receiverId },
        { fromUser: receiverId, toUser: senderId }
      ]
    }).sort({ createdAt: 1, timestamp: 1, timeStamp: 1 });

    // Transform messages to match frontend expectations
    const transformedMessages = messages.map(msg => ({
      fromUser: msg.fromUser || msg.senderId,
      toUser: msg.toUser || msg.receiverId,
      message: msg.message,
      timestamp: msg.timestamp || msg.timeStamp || msg.createdAt,
      messageType: msg.messageType || 'text',
      fileInfo: msg.fileInfo,
      isRead: msg.isRead || false,
      _id: msg._id
    }));

    res.status(200).json(transformedMessages);

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages"
    });
  }
};

export const getUnreadMessagesController = async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: "Username is required"
      });
    }

    // Get unread message counts
    const unreadCounts = {};
    const unreadMessages = await messageModel.find({
      $or: [
        { receiverId: username, isRead: false },
        { toUser: username, isRead: false }
      ]
    });

    // Count unread messages by sender
    unreadMessages.forEach(msg => {
      const sender = msg.senderId || msg.fromUser;
      if (sender && sender !== username) {
        unreadCounts[sender] = (unreadCounts[sender] || 0) + 1;
      }
    });

    // Get last messages for each conversation
    const lastMessages = {};
    const allConversations = await messageModel.aggregate([
      {
        $match: {
          $or: [
            { senderId: username },
            { receiverId: username },
            { fromUser: username },
            { toUser: username }
          ]
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: [{ $ifNull: ["$senderId", "$fromUser"] }, username] },
              then: { $ifNull: ["$receiverId", "$toUser"] },
              else: { $ifNull: ["$senderId", "$fromUser"] }
            }
          },
          sortTimestamp: {
            $ifNull: ["$timestamp", { $ifNull: ["$timeStamp", "$createdAt"] }]
          }
        }
      },
      {
        $sort: { sortTimestamp: -1 }
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    allConversations.forEach(item => {
      if (item._id && item._id !== username && item.lastMessage) {
        const msg = item.lastMessage;
        lastMessages[item._id] = {
          message: msg.message,
          timestamp: msg.timestamp || msg.timeStamp || msg.createdAt,
          isFile: msg.messageType === 'file'
        };
      }
    });

    res.status(200).json({
      success: true,
      unreadCounts,
      lastMessages
    });

  } catch (error) {
    console.error("Error fetching unread messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread messages"
    });
  }
};

export const markMessagesAsReadController = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        error: "Both senderId and receiverId are required"
      });
    }

    // Mark messages as read using standard MongoDB update
    const result = await messageModel.updateMany(
      {
        $or: [
          { senderId: senderId, receiverId: receiverId },
          { fromUser: senderId, toUser: receiverId }
        ],
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark messages as read"
    });
  }
};

// Controller to save regular messages (for socket.io messages)
export const saveMessageController = async (req, res) => {
  try {
    const { fromUser, toUser, message, messageType = 'text', fileInfo } = req.body;
    
    if (!fromUser || !toUser || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    const messageData = {
      senderId: fromUser,
      receiverId: toUser,
      fromUser: fromUser,
      toUser: toUser,
      message,
      messageType,
      fileInfo: fileInfo || undefined,
      timeStamp: new Date(),
      timestamp: new Date(),
      isRead: false
    };

    const savedMessage = await messageModel.create(messageData);
    
    res.status(201).json({
      success: true,
      data: savedMessage
    });

  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save message"
    });
  }
};