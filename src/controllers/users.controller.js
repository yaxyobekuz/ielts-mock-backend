// Models
const User = require("../models/User");

// Helpers
const { pickAllowedFields } = require("../utils/helpers");

// Services
const { uploadFile } = require("../services/uploadService");

// Get user
const getUserById = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).select("-password");
    res.json({
      user,
      code: "userFetched",
      message: "Foydalanuvchi ma'lumotlari olindi",
    });
  } catch (err) {
    next(err);
  }
};

const updateUserAvatar = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const avatar = await uploadFile(req.file, userId);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatar._id },
      { new: true }
    ).select("-password");

    const user = { ...updatedUser._doc, avatar };

    res.json({
      user,
      avatar,
      code: "avatarUpdated",
      message: "Avatar muvaffaqiyatli yangilandi",
    });
  } catch (err) {
    next(err);
  }
};

// Update user
const updateUser = async (req, res, next) => {
  const userId = req.user._id;
  const updatedFields = pickAllowedFields(req.body, [
    "bio",
    "lastName",
    "firstName",
  ]);

  try {
    const user = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
    })
      .select("-password")
      .populate("avatar");

    res.json({
      user,
      code: "userUpdated",
      updates: updatedFields,
      message: "Foydalanuvchi ma'lumotlari yangilandi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateUser,
  getUserById,
  updateUserAvatar,
};
