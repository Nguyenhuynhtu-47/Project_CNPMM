const cloudinary = require('cloudinary').v2;
const { PassThrough } = require('stream');

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

const uploadBuffer = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });

    const bufferStream = new PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

module.exports = {
  uploadDataUri,
  uploadBuffer,
  cloudinary
};
