// Models
const User = require("../models/User");

// Helpers
const { pickAllowedFields } = require("../utils/helpers");

// Services
const { uploadFile } = require("../services/uploadService");

// Get users
const getUsers = async (req, res, next) => {
  // Pagination
  const role = req.query.role;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  if (["owner", "admin", "teacher", "supervisor", "student"].includes(role)) {
    filter.role = role;
  }

  try {
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("avatar")
        .select("-__v -password -balance -chatId -permissions -supervisor")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      users,
      code: "usersFetched",
      message: "Foydalanuvchilar olindi",
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get user
const getUserById = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId)
      .select("-password -chatId -permissions")
      .populate("avatar");

    if (!user) {
      return res.status(404).json({
        code: "userNotFound",
        message: "Foydalanuvchi topilmadi",
      });
    }

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

// Update user for admin
const updateUserForAdmin = async (req, res, next) => {
  const userId = req.params.id;
  const updatedFields = pickAllowedFields(req.body, ["isActive", "role"]);

  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, role: { $ne: "owner" } },
      updatedFields,
      { new: true }
    )
      .select("-password -chatId -permissions")
      .populate("avatar");

    if (!user) {
      return res.status(404).json({
        code: "userNotFound",
        message: "Foydalanuvchi topilmadi",
      });
    }

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
  getUsers,
  updateUser,
  getUserById,
  updateUserAvatar,
  updateUserForAdmin,
};
