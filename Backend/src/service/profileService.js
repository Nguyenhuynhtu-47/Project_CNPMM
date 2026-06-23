const User = require('../models/User');

const updateProfile = async (userId, profileData) => {
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            fullName: profileData.fullName,
            phone: profileData.phone,
            address: profileData.address,
            avatar: profileData.avatar
        },
        { new: true }
    ).select('-password');

    return updatedUser;
};

module.exports = { updateProfile };