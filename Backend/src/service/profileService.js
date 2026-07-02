const User = require('../models/User');

const updateProfile = async (userId, profileData) => {
    const updateData = {
        fullName: profileData.fullName,
        phone: profileData.phone,
        address: profileData.address
    };

    if (profileData.avatar) {
        updateData.avatar = profileData.avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
    ).select('-password');

    return updatedUser;
};

module.exports = { updateProfile };
