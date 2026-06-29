const Lesson = require('../models/Lesson');
const { uploadDataUri } = require('../utils/cloudinary');

const allowedTypesToContentType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.startsWith('audio/')) return 'AUDIO';
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.includes('word') || mimetype.includes('officedocument')) return 'DOCX';
  if (mimetype.includes('presentation')) return 'PPT';
  return 'ARTICLE';
};

exports.uploadLessonMedia = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const base64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    const uploadResult = await uploadDataUri(dataUri, { folder: `elms/courses/${lesson.chapter}` });

    lesson.contentUrl = uploadResult.secure_url;
    lesson.contentType = allowedTypesToContentType(file.mimetype);
    await lesson.save();

    return res.status(200).json({ message: 'Uploaded', url: uploadResult.secure_url, resource: uploadResult.resource_type });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

exports.deleteLessonMedia = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    lesson.contentUrl = '';
    lesson.contentType = 'ARTICLE';
    await lesson.save();

    return res.status(200).json({ message: 'Lesson material removed', lesson });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot remove lesson material', error: error.message });
  }
};
