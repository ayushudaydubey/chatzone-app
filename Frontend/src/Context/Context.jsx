import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axiosInstance, { fileUploadInstance } from '../utils/axios';

export const chatContext = createContext(null);

const socket = io("https://chatzone-1.onrender.com");

const Context = (props) => {
  const [username, setUsername] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [senderId, setSenderId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [users, setUsers] = useState([]);
  const [toUser, setToUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  
  // AI Bot related state
  const [isAiTyping, setIsAiTyping] = useState(false);
  const AI_BOT_NAME = "Elva Ai";
  const messagesEndRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to safely check if value is array
  const safeArrayCheck = (arr) => {
    return Array.isArray(arr) ? arr : [];
  };

  // Get AI chat history for context
  const getAiChatHistory = () => {
    return messages
      .filter(msg => 
        (msg.fromUser === username && msg.toUser === AI_BOT_NAME) ||
        (msg.fromUser === AI_BOT_NAME && msg.toUser === username)
      )
      .slice(-10) // Keep last 10 messages for context
      .map(msg => ({
        role: msg.fromUser === AI_BOT_NAME ? 'assistant' : 'user',
        content: msg.message
      }));
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to save AI message to database
  const saveAiMessage = useCallback(async (messageData) => {
    try {
      const response = await axiosInstance.post('/user/save-ai-message', messageData);
      if (response.data.success) {
        console.log('AI message saved successfully');
        return response.data;
      }
    } catch (error) {
      console.error("Error saving AI message:", error);
    }
  }, []);

  // Function to fetch unread messages and last messages from database
  const fetchUnreadAndLastMessages = useCallback(async () => {
    if (!username) return;
    
    try {
      console.log('Fetching unread messages for:', username);
      
      const response = await axiosInstance.get('/user/unread-messages', {
        params: { username } 
      });
      
      if (response.data.success) {
        const newUnreadMessages = response.data.unreadCounts || {};
        const newLastMessages = response.data.lastMessages || {};
        
        setUnreadMessages(newUnreadMessages);
        setLastMessages(newLastMessages);
        
        console.log('Updated unread messages state:', newUnreadMessages);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  }, [username]);

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async (selectedUser) => {
    if (!selectedUser || !username) return;
    
    try {
      console.log(`Marking messages as read from: ${selectedUser}`);
      
      // API call to mark messages as read
      await axiosInstance.post('/user/mark-read', {
        senderId: selectedUser,
        receiverId: username
      });
      
      // Immediately update local state to remove unread count for this user
      setUnreadMessages(prev => {
        const updated = { ...prev };
        delete updated[selectedUser];
        console.log(`Removed unread count for: ${selectedUser}`, updated);
        return updated;
      });
      
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [username]);

  // Function to load all registered users
  const loadAllUsers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/user/all-users');
      if (response.data) {
        const allUsersWithStatus = response.data
          .filter(userName => userName !== username && userName.trim() !== '')
          .map(userName => ({
            username: userName,
            isOnline: false,
            lastSeen: null
          }));
        
        // Add AI Friend at the top of the list
        const usersWithAI = [
          { username: AI_BOT_NAME, isOnline: true, isAiBot: true },
          ...allUsersWithStatus
        ];
        setUsers(usersWithAI);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, [username, AI_BOT_NAME]);

  // Main initialization effect
useEffect(() => {
  const initializeApp = async () => {
    try {
      // Change this line - remove 'auth' from the path
      const response = await axiosInstance.get("/user/auth/me");
      if (response.data && response.data.name) {
        setUsername(response.data.name);
        setIsRegistered(true);
        socket.emit("register-user", response.data.name);
        
        // Load users first
        await loadAllUsers();
        
        // Fetch unread messages after a short delay to ensure everything is loaded
        setTimeout(async () => {
          await fetchUnreadAndLastMessages();
          setIsInitialized(true);
        }, 500);
        
      } else {
        setUsername("");
        setIsRegistered(false);
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setUsername("");
      setIsRegistered(false);
      setIsInitialized(true);
    }
  };

  initializeApp();
}, [loadAllUsers, fetchUnreadAndLastMessages]);

  // Add AI bot to users list when username is available
  useEffect(() => {
    if (username) {
      setUsers(prev => {
        const hasAiBot = prev.some(user =>
          (typeof user === 'object' ? user.username : user) === AI_BOT_NAME
        );
        if (!hasAiBot) {
          return [
            { username: AI_BOT_NAME, isOnline: true, isAiBot: true },
            ...prev
          ];
        }
        return prev;
      });
    }
  }, [username, AI_BOT_NAME]);

  // Mark messages as read when user selects a chat
  useEffect(() => {
    if (toUser && username && isInitialized) {
      const timer = setTimeout(() => {
        console.log(`Marking messages as read for selected user: ${toUser}`);
        markMessagesAsRead(toUser);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [toUser, username, isInitialized, markMessagesAsRead]);

  // Helper functions for unread messages and last messages
  const getUnreadCount = (fromUser) => {
    return unreadMessages[fromUser] || 0;
  };

  const getLastMessage = (fromUser) => {
    return lastMessages[fromUser] || null;
  };

  const getOnlineUsers = () => {
    return users.filter(user => {
      const userObj = typeof user === 'object' ? user : { username: user, isOnline: true };
      return userObj.isOnline;
    });
  };

  const getTotalUnreadCount = () => {
    return Object.values(unreadMessages).reduce((total, count) => total + count, 0);
  };

  // Socket event listeners
  useEffect(() => {
    const handlePrivateMessage = (messageData) => {
      console.log('Received private message:', messageData);
      
      // Add message to state if it doesn't already exist
      setMessages(prev => {
        const exists = prev.some(msg =>
          msg.fromUser === messageData.fromUser &&
          msg.toUser === messageData.toUser &&
          msg.message === messageData.message &&
          Math.abs(new Date(msg.timestamp) - new Date(messageData.timestamp)) < 1000
        );
        if (!exists) {
          return [...prev, messageData];
        }
        return prev;
      });

      // Update unread messages count - ONLY for incoming messages from OTHER users
      // and ONLY if the sender is not the currently selected user
      if (messageData.fromUser !== username && 
          messageData.toUser === username && 
          messageData.fromUser !== toUser && 
          messageData.fromUser !== AI_BOT_NAME &&
          isInitialized) {
        
        console.log(`Incrementing unread count for ${messageData.fromUser}`);
        
        setUnreadMessages(prev => {
          const newCount = (prev[messageData.fromUser] || 0) + 1;
          console.log(`New unread count for ${messageData.fromUser}:`, newCount);
          return {
            ...prev,
            [messageData.fromUser]: newCount
          };
        });
        
        // Show notification only for unread messages
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${messageData.fromUser}`, {
            body: messageData.isFile || messageData.messageType === 'file' ? '📎 Sent a file' : messageData.message,
            icon: '/favicon.ico'
          });
        }
      }

      // Update last messages for all conversations
      if (messageData.fromUser !== username && messageData.toUser === username) {
        setLastMessages(prev => ({
          ...prev,
          [messageData.fromUser]: {
            message: messageData.message,
            timestamp: messageData.timestamp,
            isFile: messageData.isFile || messageData.messageType === 'file'
          }
        }));
      }
      if (messageData.fromUser === username && messageData.toUser !== username) {
        setLastMessages(prev => ({
          ...prev,
          [messageData.toUser]: {
            message: messageData.message,
            timestamp: messageData.timestamp,
            isFile: messageData.isFile || messageData.messageType === 'file'
          }
        }));
      }
    };

    const handleUpdateUsers = (usersWithStatus) => {
      if (Array.isArray(usersWithStatus)) {
        const filteredUsers = usersWithStatus
          .filter(user => {
            const userName = typeof user === 'object' ? user.username : user;
            return userName !== username && userName && userName.trim() !== '';
          })
          .map(user => {
            if (typeof user === 'object') {
              return {
                ...user,
                isOnline: user.isOnline !== undefined ? user.isOnline : true
              };
            } else {
              return {
                username: user,
                isOnline: true,
                lastSeen: new Date()
              };
            }
          });
        
        // Add AI Friend to the filtered users list
        const usersWithAI = [
          { username: AI_BOT_NAME, isOnline: true, isAiBot: true },
          ...filteredUsers
        ];
        setUsers(usersWithAI);
      }
    };

    const handleUserDisconnected = (disconnectedUser) => {
      setUsers(prev => prev.map(user => {
        const userName = typeof user === 'object' ? user.username : user;
        if (userName === disconnectedUser) {
          return typeof user === 'object' ?
            { ...user, isOnline: false, lastSeen: new Date() } :
            { username: user, isOnline: false, lastSeen: new Date() };
        }
        return user;
      }));
    };

    const handleUserConnected = (connectedUser) => {
      setUsers(prev => {
        const existingUserIndex = prev.findIndex(user => {
          const userName = typeof user === 'object' ? user.username : user;
          return userName === connectedUser;
        });
        
        if (existingUserIndex !== -1) {
          const updatedUsers = [...prev];
          updatedUsers[existingUserIndex] = typeof prev[existingUserIndex] === 'object' ?
            { ...prev[existingUserIndex], isOnline: true, lastSeen: new Date() } :
            { username: prev[existingUserIndex], isOnline: true, lastSeen: new Date() };
          return updatedUsers;
        } else {
          if (connectedUser !== username) {
            return [...prev, { username: connectedUser, isOnline: true, lastSeen: new Date() }];
          }
        }
        return prev;
      });
    };

    // Add socket listeners
    socket.on("private-message", handlePrivateMessage);
    socket.on("update-users", handleUpdateUsers);
    socket.on("user-disconnected", handleUserDisconnected);
    socket.on("user-connected", handleUserConnected);

    return () => {
      socket.off("private-message", handlePrivateMessage);
      socket.off("update-users", handleUpdateUsers);
      socket.off("user-disconnected", handleUserDisconnected);
      socket.off("user-connected", handleUserConnected);
    };
  }, [username, toUser, isInitialized, AI_BOT_NAME]);

  // Load chat history function - Updated to handle AI messages
  const loadChatHistory = useCallback(async () => {
    if (!username || !toUser) return;
    
    try {
      let response;
      
      // Check if it's AI chat
      if (toUser === AI_BOT_NAME) {
        // Load AI chat history
        response = await axiosInstance.get(`/user/ai-messages?userId=${username}`);
      } else {
        // Load regular chat history
        response = await axiosInstance.get(`/user/messages?senderId=${username}&receiverId=${toUser}`);
      }
      
      if (response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, [username, toUser, AI_BOT_NAME]);

  // Load chat history when username or toUser changes
  useEffect(() => {
    if (username && toUser) {
      loadChatHistory();
    }
  }, [username, toUser, loadChatHistory]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Function to send message to AI - Updated to save messages
  const sendToAI = useCallback(async (userMessage) => {
    try {
      setIsAiTyping(true);
      
      const userMessageData = {
        fromUser: username,
        toUser: AI_BOT_NAME,
        message: userMessage,
        timestamp: new Date().toISOString(),
        isAiBot: false
      };
      
      // Add user message to state immediately
      setMessages(prev => [...safeArrayCheck(prev), userMessageData]);

      // Save user message to database
      await saveAiMessage(userMessageData);

      // Send to AI endpoint
      const response = await axiosInstance.post('/user/askSomething', {
        message: userMessage,
        chatHistory: getAiChatHistory(),
        senderId: username,
      });

      if (response.data.success) {
        const aiMessage = {
          fromUser: AI_BOT_NAME,
          toUser: username,
          message: response.data.response,
          timestamp: new Date().toISOString(),
          isAiBot: true,
        };
        
        // Add AI response to state
        setMessages(prev => [...safeArrayCheck(prev), aiMessage]);
        
        // Save AI message to database
        await saveAiMessage(aiMessage);
        
        // Update last message for AI chat
        setLastMessages(prev => ({
          ...prev,
          [AI_BOT_NAME]: {
            message: response.data.response,
            timestamp: new Date().toISOString(),
            isFile: false
          }
        }));
      }
    } catch (error) {
      console.error("Error sending message to AI:", error);
      // Add error message to chat
      const errorMessage = {
        fromUser: AI_BOT_NAME,
        toUser: username,
        message: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date().toISOString(),
        isAiBot: true,
        isError: true
      };
      setMessages(prev => [...safeArrayCheck(prev), errorMessage]);
      
      // Save error message to database
      await saveAiMessage(errorMessage);
    } finally {
      setIsAiTyping(false);
    }
  }, [username, getAiChatHistory, AI_BOT_NAME, saveAiMessage]);

  // Handle send function
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !toUser) return;
    
    const messageData = {
      fromUser: username,
      toUser: toUser,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    try {
      if (toUser === AI_BOT_NAME) {
        // For AI, use the sendToAI function and clear message immediately
        const messageToSend = message.trim();
        setMessage(""); // Clear message immediately to prevent double send
        await sendToAI(messageToSend);
      } else {
        // For regular users, add to state and emit
        setMessages(prev => [...prev, messageData]);
        socket.emit("private-message", messageData);
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // File upload function
  const handleFileUpload = async (file, onProgress) => {
    if (!toUser) {
      throw new Error('No recipient selected');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File size must be less than 50MB');
    }
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      throw new Error('Only image and video files are allowed');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', username);
    formData.append('receiverId', toUser);
    
    try {
      const response = await fileUploadInstance.post('/user/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
        timeout: 300000,
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error('Upload failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout: The file upload took too long. Please try with a smaller file.');
      } else if (error.response?.status === 413) {
        throw new Error('File too large: The file exceeds the maximum allowed size.');
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Failed to upload file: ' + error.message);
      }
    }
  };

  // Registration function
  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/user/register', userData);
      if (response.status === 201 && response.data.user) {
        setUsername(response.data.user.name);
        setIsRegistered(true);
        return {
          success: true,
          user: response.data.user
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await axiosInstance.post('/user/login', credentials);
      if (response.status === 200 && response.data.user) {
        setUsername(response.data.user.name);
        setIsRegistered(true);
        return {
          success: true,
          user: response.data.user
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post('/user/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUsername('');
      setIsRegistered(false);
      setIsLoading(false);
      setUnreadMessages({});
      setLastMessages({});
      setIsInitialized(false);
    }
  };

  // Session validation function
  const validateSession = async () => {
    try {
      const response = await axiosInstance.get('/user/me');
      if (response.status === 200 && response.data) {
        setUsername(response.data.name);
        setIsRegistered(true);
        return { success: true, user: response.data };
      } else {
        setUsername('');
        setIsRegistered(false);
        return { success: false, error: 'Session invalid' };
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      setUsername('');
      setIsRegistered(false);
      return {
        success: false,
        error: error.response?.data?.error || 'Session expired'
      };
    }
  };

  const contextValue = { 
    username, setUsername, isRegistered, setIsRegistered, validateSession, senderId, setSenderId,
    receiverId, setReceiverId, message, setMessage, messages, setMessages, users, toUser, setToUser, 
    register, login, handleSend, handleFileUpload, logout, socket, messagesEndRef, loadChatHistory, 
    loadAllUsers, getOnlineUsers, unreadMessages, lastMessages, markMessagesAsRead, 
    fetchUnreadAndLastMessages, getUnreadCount, getLastMessage, getTotalUnreadCount, 
    AI_BOT_NAME, isAiTyping, sendToAI, isInitialized, isLoading, saveAiMessage
  };

  return (
    <chatContext.Provider value={contextValue}>
      {props.children}
    </chatContext.Provider>
  );
};

export default Context;