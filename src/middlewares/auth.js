const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Check token
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      code: "tokenMissing",
      message: "Token mavjud emas",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        code: "userNotFound",
        message: "Foydalanuvchi topilmadi",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      code: "invalidToken",
      message: "Yaroqsiz token kiritildi",
    });
  }
};

// Check role
const roleCheck = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: "forbidden",
        message: "Ruxsat berilmadi",
      });
    }

    next();
  };
};

module.exports = { auth, roleCheck };
