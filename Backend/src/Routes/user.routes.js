import express from 'express';

import { 
  loginUserController, 
  registerUserController, 
  logoutUserController,
  verifyTokenMiddleware,
  getAllUsersController,
  getMeController
} from '../Controllers/user.controller.js';

import { 
  aiMessageSaveController,
  getMessagesController, 
  messageController,
  getAiMessagesController,
  saveMessageController,
  markMessagesAsReadController,
  getUnreadMessagesController
} from '../Controllers/message.controller.js';

import { aiChatController } from '../Services/ai.service.js';

const routes = express.Router();

// Auth routes
routes.post("/register", registerUserController);
routes.post("/login", loginUserController);
routes.post("/logout", verifyTokenMiddleware, logoutUserController);

// Protected routes
routes.post("/chat", verifyTokenMiddleware, messageController);

// For AI chat functionality
routes.post("/askSomething", verifyTokenMiddleware, aiChatController);

// AI Message Routes
routes.post("/save-ai-message", verifyTokenMiddleware, aiMessageSaveController);
routes.get("/ai-messages", verifyTokenMiddleware, getAiMessagesController);

// User Routes
routes.get("/auth/me", verifyTokenMiddleware, getMeController);
routes.get("/all-users", verifyTokenMiddleware, getAllUsersController);

// Regular Message Routes  

routes.get("/chat/:senderId/:receiverId", verifyTokenMiddleware, getMessagesController);
routes.post("/save-message", verifyTokenMiddleware, saveMessageController);

// Message Status Routes
routes.post("/mark-read", verifyTokenMiddleware, markMessagesAsReadController);
routes.get("/unread-messages", verifyTokenMiddleware, getUnreadMessagesController);

export default routes;