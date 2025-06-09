// multer.js
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const multerUpload = upload.single('file');

export default multerUpload;
