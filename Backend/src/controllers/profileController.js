const { validationResult } =
    require("express-validator");

const profileService =
    require("../service/profileService");

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

        const updatedUser =
            await profileService.updateProfile(
                req.user._id,
                req.body
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