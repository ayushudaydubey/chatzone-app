// Routes/user.routes.js
import express from 'express';
import multer from 'multer';
import imagekit from '../utils/image-kit.js';
// Import your existing controllers
// import { registerUser, loginUser, getAllUsers, getMessages, createMessage } from '../Controllers/user.controller.js';

const router = express.Router();

// Simple multer setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// File upload controller
export async function sendFileController(req, res) {
  try {
    if (!req.file) {
      return res.json({ success: false, error: "No file" });
    }

    // Upload to ImageKit
    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname
    });

    res.json({
      success: true,
      url: result.url,
      fileName: req.file.originalname
    });

  } catch (error) {
  
    res.json({ success: false, error: "Upload failed" });
  }
}

// File upload route
router.post('/upload-file', upload.single('file'), sendFileController);

// Your existing routes - uncomment and implement these
// router.post('/register', registerUser);
// router.post('/login', loginUser);
// router.get('/all-users', getAllUsers);
// router.get('/messages', getMessages);
// router.post('/messages', createMessage);

export default router;