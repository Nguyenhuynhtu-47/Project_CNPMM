const cloudinary = require('cloudinary').v2;

// Configure using CLOUDINARY_URL or individual env vars
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

const uploadDataUri = async (dataUri, options = {}) => {
  return cloudinary.uploader.upload(dataUri, { resource_type: 'auto', ...options });
};

module.exports = {
  uploadDataUri,
  cloudinary
};
