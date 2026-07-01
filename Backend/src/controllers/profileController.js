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

            if (!req.file.mimetype.startsWith('image/')) {

                return res.status(400).json({
                    message: "Avatar phải là file ảnh."
                });
            }

            const dataUri =
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            const uploadResult =
                await uploadDataUri(
                    dataUri,
                    {
                        folder: "elms/users/avatars"
                    }
                );

            profileData.avatar =
                uploadResult.secure_url;
        }

        const updatedUser =
            await profileService.updateProfile(
                req.user._id,
                profileData
            );

        return res.status(200).json({
            message: "Cập nhật profile thành công.",
            data: updatedUser
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Lỗi Server Internal"
        });
    }
};

module.exports = {
    updateProfile
};
