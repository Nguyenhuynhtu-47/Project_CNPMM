const Lesson = require('../models/Lesson');
const fs = require('fs/promises');
const path = require('path');
const { uploadBuffer } = require('../utils/cloudinary');
const { canManageClass } = require('../utils/classAccess');

const lessonUploadRoot = path.join(__dirname, '..', '..', 'uploads', 'lessons');

const allowedTypesToContentType = (mimetype) => {
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.startsWith('audio/')) return 'AUDIO';
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.includes('word') || mimetype.includes('officedocument')) return 'DOCX';
  if (mimetype.includes('presentation')) return 'PPT';
  return 'ARTICLE';
};

const resourceTypeForMime = (mimetype) => {
  if (mimetype === 'application/pdf') return 'image';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) return 'video';
  return 'raw';
};

const isDocumentMime = (mimetype) => {
  return [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ].includes(mimetype);
};

const safePublicId = (originalName = 'lesson-material', keepExtension = false) => {
  const extension = path.extname(originalName).toLowerCase();
  const basename = path
    .basename(originalName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'lesson-material';

  return `${Date.now()}-${basename}${keepExtension ? extension : ''}`;
};

const safeFileName = (originalName = 'lesson-material') => {
  const extension = path.extname(originalName).toLowerCase();
  const basename = path
    .basename(originalName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'lesson-material';

  return `${Date.now()}-${basename}${extension}`;
};

const getRequestBaseUrl = (req) => {
  return process.env.PUBLIC_API_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
};

const getLocalUploadPathFromUrl = (contentUrl = '') => {
  const uploadMarker = '/uploads/lessons/';
  const markerIndex = contentUrl.indexOf(uploadMarker);
  if (markerIndex === -1) return null;

  const relativeUploadPath = contentUrl.slice(markerIndex + '/uploads/'.length).replace(/[?#].*$/, '');
  const resolvedPath = path.resolve(path.join(__dirname, '..', '..', 'uploads', relativeUploadPath));
  const uploadsRoot = path.resolve(path.join(__dirname, '..', '..', 'uploads'));

  if (!resolvedPath.startsWith(uploadsRoot)) return null;
  return resolvedPath;
};

const removeLocalFileIfExists = async (contentUrl) => {
  const localPath = getLocalUploadPathFromUrl(contentUrl);
  if (!localPath) return;
  await fs.unlink(localPath).catch(() => {});
};

const saveDocumentToLocalStorage = async ({ req, lesson, file }) => {
  const lessonId = lesson._id.toString();
  const lessonDir = path.join(lessonUploadRoot, lessonId);
  await fs.mkdir(lessonDir, { recursive: true });

  await removeLocalFileIfExists(lesson.contentUrl);

  const fileName = safeFileName(file.originalname);
  const filePath = path.join(lessonDir, fileName);
  await fs.writeFile(filePath, file.buffer);

  return `${getRequestBaseUrl(req)}/uploads/lessons/${lessonId}/${encodeURIComponent(fileName)}`;
};

exports.uploadLessonMedia = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const lesson = await Lesson.findById(lessonId).populate({ path: 'chapter', select: 'class' });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    const allowed = await canManageClass(req.user, lesson.chapter?.class);
    if (!allowed) return res.status(403).json({ message: 'You do not manage this class' });

    let contentUrl;
    let resource = 'local';

    if (isDocumentMime(file.mimetype)) {
      contentUrl = await saveDocumentToLocalStorage({ req, lesson, file });
    } else {
      const resourceType = resourceTypeForMime(file.mimetype);
      const uploadResult = await uploadBuffer(file.buffer, {
        folder: `elms/classes/${lesson.chapter?._id || lesson.chapter}`,
        resource_type: resourceType,
        public_id: safePublicId(file.originalname, resourceType === 'raw'),
        use_filename: true,
        unique_filename: true,
        filename_override: file.originalname
      });
      contentUrl = uploadResult.secure_url;
      resource = uploadResult.resource_type;
    }

    lesson.contentUrl = contentUrl;
    lesson.contentType = allowedTypesToContentType(file.mimetype);
    await lesson.save();

    return res.status(200).json({
      message: 'Uploaded',
      url: contentUrl,
      resource,
      lesson
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

exports.deleteLessonMedia = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({ path: 'chapter', select: 'class' });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    const allowed = await canManageClass(req.user, lesson.chapter?.class);
    if (!allowed) return res.status(403).json({ message: 'You do not manage this class' });

    await removeLocalFileIfExists(lesson.contentUrl);
    lesson.contentUrl = '';
    lesson.contentType = 'ARTICLE';
    await lesson.save();

    return res.status(200).json({ message: 'Lesson material removed', lesson });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot remove lesson material', error: error.message });
  }
};
