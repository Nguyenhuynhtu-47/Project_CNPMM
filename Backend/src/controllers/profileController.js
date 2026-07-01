const { validationResult } =
    require("express-validator");

const profileService =
    require("../service/profileService");

const { uploadDataUri } =
    require("../utils/cloudinary");

const updateProfile = async (
    req,
    res
) => {

    try {

        const errors =
            validationResult(req);

        if (!errors.isEmpty()) {

            return res.status(400).json({
                errors: errors.array()
            });
        }

        const profileData = {
            ...req.body
        };

        if (req.file) {
            const dataUri =
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            const uploadResult =
                await uploadDataUri(dataUri, {
                    folder: 'elms/users/avatars'
                });

            profileData.avatar =
                uploadResult.secure_url;
        }

        const updatedUser =
            await profileService.updateProfile(
                req.user._id,
                profileData
            );

        return res.status(200).json({
            message: "Profile updated successfully.",
            data: updatedUser
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    updateProfile
};

