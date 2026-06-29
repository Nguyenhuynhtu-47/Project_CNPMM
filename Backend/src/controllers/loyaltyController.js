const loyaltyService = require('../service/loyaltyService');

const getMyLoyalty = async (req, res) => {
  try {
    const loyalty = await loyaltyService.getMyLoyalty(req.user._id);
    return res.status(200).json(loyalty);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Cannot load loyalty points' });
  }
};

module.exports = {
  getMyLoyalty
};
