const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');

const certificateStorageDir = path.join(__dirname, '..', '..', 'uploads', 'certificates');

const createCertificatePdf = ({ certificate, studentName, courseTitle, qrDataUrl }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 64 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(28).text('English Learning Management System', { align: 'center' });
    doc.moveDown(1.2);
    doc.fontSize(22).text('Certificate of Completion', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).text('This certificate is proudly presented to', { align: 'center' });
    doc.moveDown(0.7);
    doc.fontSize(26).text(studentName || 'Student', { align: 'center' });
    doc.moveDown(0.7);
    doc.fontSize(14).text('for successfully completing the course', { align: 'center' });
    doc.moveDown(0.7);
    doc.fontSize(22).text(courseTitle || 'Course', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).text(`Final score: ${certificate.finalScore}`, { align: 'center' });
    doc.text(`Certificate code: ${certificate.certificateCode}`, { align: 'center' });
    doc.text(`Issued at: ${new Date(certificate.issuedAt).toLocaleDateString('vi-VN')}`, { align: 'center' });

    if (qrDataUrl) {
      doc.moveDown(1);
      doc.image(qrDataUrl, doc.page.width / 2 - 55, doc.y, { width: 110 });
      doc.moveDown(6);
      doc.fontSize(10).text('Scan QR code to verify this certificate.', { align: 'center' });
    }

    doc.end();
  });
};

const issueCertificate = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.body.enrollment).populate('course', 'title');
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.status !== 'COMPLETED') return res.status(400).json({ message: 'Course must be approved as completed by teacher' });
    if (Number(req.body.finalScore) < 70) return res.status(400).json({ message: 'Final score must be at least 70' });

    const existingCertificate = await Certificate.findOne({ enrollment: enrollment._id });
    if (existingCertificate) {
      return res.status(409).json({ message: 'Certificate already issued for this enrollment', certificate: existingCertificate });
    }

    const certificateCode = `ELMS-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    const baseUrl = process.env.PUBLIC_API_URL || process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
    const verifyUrl = `${baseUrl}/api/certificates/verify/${certificateCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);

    const certificate = await Certificate.create({
      user: enrollment.user,
      course: enrollment.course,
      enrollment: enrollment._id,
      finalScore: req.body.finalScore,
      certificateCode,
      verifyUrl,
      pdfUrl: ''
    });

    await certificate.populate('user', 'fullName email');
    await certificate.populate('course', 'title');

    const pdfBuffer = await createCertificatePdf({
      certificate,
      studentName: certificate.user?.fullName,
      courseTitle: certificate.course?.title,
      qrDataUrl
    });
    await fs.mkdir(certificateStorageDir, { recursive: true });
    const pdfFileName = `${certificate.certificateCode}.pdf`;
    const pdfPath = path.join(certificateStorageDir, pdfFileName);
    await fs.writeFile(pdfPath, pdfBuffer);

    certificate.pdfUrl = `/uploads/certificates/${pdfFileName}`;
    await certificate.save();

    return res.status(201).json({ message: 'Certificate issued', certificate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot issue certificate' });
  }
};

const listMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id }).populate('course', 'title');
    return res.status(200).json({ certificates });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load certificates' });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateCode: req.params.code })
      .populate('user', 'fullName email')
      .populate('course', 'title');
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });
    return res.status(200).json({ valid: true, certificate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot verify certificate' });
  }
};

const revokeCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndDelete(req.params.id);
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' });
    return res.status(200).json({ message: 'Certificate revoked' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot revoke certificate' });
  }
};

const downloadCertificatePdf = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateCode: req.params.code });
    if (!certificate || !certificate.pdfUrl) return res.status(404).json({ message: 'Certificate PDF not found' });

    let buffer;
    if (certificate.pdfUrl.startsWith('data:application/pdf;base64,')) {
      const base64 = certificate.pdfUrl.replace(/^data:application\/pdf;base64,/, '');
      buffer = Buffer.from(base64, 'base64');
    } else {
      const fileName = path.basename(certificate.pdfUrl);
      buffer = await fs.readFile(path.join(certificateStorageDir, fileName));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${certificate.certificateCode}.pdf"`);
    return res.send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot download certificate PDF' });
  }
};

module.exports = {
  issueCertificate,
  listMyCertificates,
  verifyCertificate,
  downloadCertificatePdf,
  revokeCertificate
};
