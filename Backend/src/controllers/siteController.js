const Banner = require('../models/Banner');
const Setting = require('../models/Setting');

const listBanners = async (req, res) => {
  try {
    const query = req.query.all === 'true' ? {} : { active: true };
    const banners = await Banner.find(query).sort({ position: 1, createdAt: -1 });
    return res.status(200).json({ banners });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load banners' });
  }
};

const saveBanner = async (req, res) => {
  try {
    const banner = req.params.id
      ? await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true })
      : await Banner.create(req.body);
    return res.status(req.params.id ? 200 : 201).json({ message: 'Banner saved', banner });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot save banner' });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    return res.status(200).json({ message: 'Banner deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot delete banner' });
  }
};

const reorderBanners = async (req, res) => {
  try {
    const items = req.body.items || [];
    await Promise.all(items.map((item) => Banner.findByIdAndUpdate(item.id, { position: item.position })));
    const banners = await Banner.find().sort({ position: 1, createdAt: -1 });
    return res.status(200).json({ message: 'Banners reordered', banners });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot reorder banners' });
  }
};

const listSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort({ key: 1 });
    return res.status(200).json({ settings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load settings' });
  }
};

const listPublicSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ key: { $regex: '^public\\.' } }).sort({ key: 1 });
    return res.status(200).json({ settings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load public settings' });
  }
};

const upsertSetting = async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.body.key },
      { key: req.body.key, value: req.body.value, description: req.body.description },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ message: 'Setting saved', setting });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot save setting' });
  }
};

const deleteSetting = async (req, res) => {
  try {
    const setting = await Setting.findOneAndDelete({ key: req.params.key });
    if (!setting) return res.status(404).json({ message: 'Setting not found' });
    return res.status(200).json({ message: 'Setting deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot delete setting' });
  }
};

module.exports = {
  listBanners,
  saveBanner,
  deleteBanner,
  reorderBanners,
  listSettings,
  listPublicSettings,
  upsertSetting,
  deleteSetting
};
