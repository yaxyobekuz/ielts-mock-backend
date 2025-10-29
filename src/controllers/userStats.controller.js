const UserStats = require("../models/UserStats");

/**
 * Get authenticated user's statistics
 * @route GET /api/user-stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const userStats = await UserStats.findOne({ userId: req.user._id })
      .select("-__v")
      .lean();

    if (!userStats) {
      return res.status(404).json({
        code: "userStatsNotFound",
        message: "Foydalanuvchi statistikasi topilmadi",
      });
    }

    return res.json({
      userStats,
      code: "userStatsFetched",
      message: "Foydalanuvchi statistikasi yuklandi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserStats,
};
