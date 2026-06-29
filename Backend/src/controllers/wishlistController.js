const Wishlist = require('../models/Wishlist');

const listWishlist = async (req, res) => {
  try {
    const wishlists = await Wishlist.find({ user: req.user._id }).populate('course', 'title price imageUrl');
    return res.status(200).json({ wishlists });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load wishlist' });
  }
};

const addWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id, course: req.body.course },
      { user: req.user._id, course: req.body.course },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('course', 'title price imageUrl');
    return res.status(200).json({ message: 'Added to wishlist', wishlist });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot add wishlist' });
  }
};

const removeWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user._id, course: req.params.courseId });
    return res.status(200).json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot remove wishlist' });
  }
};

module.exports = {
  listWishlist,
  addWishlist,
  removeWishlist
};
