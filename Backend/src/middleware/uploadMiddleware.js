const multer = require('multer');

const storage = multer.memoryStorage();
const maxFileSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 200);

const fileFilter = (req, file, cb) => {
  // Accept common lesson types
  const allowed = [
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/mp3',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png'
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: maxFileSizeMb * 1024 * 1024 } });

module.exports = upload;
