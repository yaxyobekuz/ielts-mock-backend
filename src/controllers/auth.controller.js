// Data
const texts = require("../data/texts");

// Bot service
const { sendMessage } = require("../services/bot");

// Utils
const { generateToken } = require("../utils/jwt");
const { getRandomNumber } = require("../utils/helpers");

// Models
const User = require("../models/User");
const VerificationCode = require("../models/VerificationCode");

// Send verification code via telegram bot
const sentVerificationCode = async (chatId, code) => {
  if (!chatId) return false;
  return await sendMessage(chatId, texts.verificationCodeSent(code));
};

// Register
const register = async (req, res, next) => {
  const phone = Number(req.body.phone);
  const { firstName, lastName, password } = req.body;
  const role = req?.query?.role?.toLowerCase() || "student";

  const allowedRoles = ["student", "supervisor"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      code: "roleNotAllowed",
      message: "Ushbu rolga ruxsat berilmaydi",
    });
  }

  try {
    let user = await User.findOne({ phone });

    // If user exists & already verified
    if (user && user.isVerified) {
      return res.status(400).json({
        code: "phoneAlreadyUsed",
        message: "Telefon raqam allaqachon ishlatilgan",
      });
    }

    // If user exists but not verified yet
    if (user && !user.isVerified) {
      // Get latest verification code
      const lastCode = await VerificationCode.findOne({ phone }).sort({
        createdAt: -1,
      });

      if (lastCode) {
        const diff = (Date.now() - lastCode.createdAt.getTime()) / 1000;

        // Prevent sending new code within 60 seconds
        if (diff < 60) {
          return res.json({
            code: "codeAlreadySent",
            createdAt: lastCode.createdAt,
            expiresAt: lastCode.expiresAt,
            message: "Kod allaqachon yuborilgan",
          });
        }
      }

      // Otherwise generate and send a new code
      const code = getRandomNumber(1000, 9999);
      const isSent = await sentVerificationCode(user.chatId, code);
      const verificationCode = await VerificationCode.create({
        code,
        phone,
        isSent,
      });

      return res.json({
        code: "codeSent",
        createdAt: verificationCode.createdAt,
        expiresAt: verificationCode.expiresAt,
        message: "Hisobni tasdiqlash kodi yuborildi",
      });
    }

    // If user does not exist, create new one
    user = await User.create({ role, phone, password, lastName, firstName });

    const code = getRandomNumber(1000, 9999);
    const isSent = await sentVerificationCode(user.chatId, code);
    const verificationCode = await VerificationCode.create({
      code,
      phone,
      isSent,
    });

    res.status(201).json({
      code: "codeSent",
      createdAt: verificationCode.createdAt,
      expiresAt: verificationCode.expiresAt,
      message: "Hisob yaratildi, kod yuborildi",
    });
  } catch (err) {
    next(err);
  }
};

// Verify
const verify = async (req, res, next) => {
  try {
    const code = Number(req.body.code);
    const phone = Number(req.body.phone);
    const { password } = req.body;

    // Get latest sent code
    const verificationCode = await VerificationCode.findOne({ phone, code });

    if (!verificationCode) {
      return res.status(400).json({
        code: "codeNotSent",
        message: "Avval kod yuborilmagan",
      });
    }

    // Check expiration (5 minutes)
    const seconds = (Date.now() - verificationCode.createdAt.getTime()) / 1000;
    if (seconds > 300) {
      return res.status(400).json({
        code: "codeExpired",
        message: "Kod muddati tugagan, qayta yuboring",
      });
    }

    // If code is invalid
    if (verificationCode.code !== code) {
      return res.status(400).json({
        code: "codeInvalid",
        message: "Kod noto'g'ri",
      });
    }

    // If valid, verify user
    const user = await User.findOneAndUpdate(
      { phone },
      { isVerified: true, password },
      { new: true }
    ).select("-password");

    const token = generateToken(user);

    res.json({
      user,
      token,
      code: "accountVerified",
      message: "Hisob tasdiqlandi",
    });
  } catch (err) {
    next(err);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const password = req.body.password;
    const phone = Number(req.body.phone);
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({
        code: "invalidCredentials",
        message: "Telefon raqam yoki parol noto'g'ri",
      });
    }

    if (!user.isVerified) {
      const code = getRandomNumber(1000, 9999);
      const isSent = await sentVerificationCode(user.chatId, code);
      await VerificationCode.create({
        code,
        phone,
        isSent,
      });

      return res.status(400).json({
        code: "accountNotVerified",
        message: "Hisob tasdiqlanmagan, kod qayta yuborildi",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        code: "invalidCredentials",
        message: "Telefon raqam yoki parol noto'g'ri",
      });
    }

    const token = generateToken(user);
    res.json({
      user,
      token,
      code: "loginSuccess",
      message: "Hisobingizga muvaffaqiyatli kirdingiz",
    });
  } catch (err) {
    next(err);
  }
};

// Get profile
const profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("avatar")
      .select("-password");

    res.json({
      user,
      code: "profileSuccess",
      message: "Profil ma'lumotlari olindi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { profile, register, login, verify };
