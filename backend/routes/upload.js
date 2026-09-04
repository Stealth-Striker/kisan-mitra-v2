const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      if (file.mimetype.includes('webm')) ext = '.webm';
      else if (file.mimetype.includes('ogg')) ext = '.ogg';
      else if (file.mimetype.includes('mp4') || file.mimetype.includes('m4a')) ext = '.m4a';
      else if (file.mimetype.includes('wav')) ext = '.wav';
      else ext = '.jpg';
    }
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/x-m4a'
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP images and audio files are allowed'));
    }
  },
});

// POST /api/upload
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return a URL that the Vite dev proxy will forward to the backend's /uploads static route
  const file_url = `/uploads/${req.file.filename}`;
  res.json({ file_url });
});

// Error handler for multer
router.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message });
});

module.exports = router;
