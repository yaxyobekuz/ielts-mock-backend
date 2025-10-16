// Data
const texts = require("../data/texts");

// Bot service
const { sendMessage } = require("../services/bot");

// Utils
const { generateToken } = require("../utils/jwt");
const { getRandomNumber } = require("../utils/helpers");

// Models
const User = require("../models/User");
const TgUser = require("../models/TgUser");
const VerificationCode = require("../models/VerificationCode");

// Send verification code via telegram bot
const sentVerificationCode = async (chatId, code, phone) => {
  if (!chatId) {
    const tgUser = await TgUser.findOne({ phone });

    if (tgUser) {
      chatId = tgUser.chatId;
      await User.findOneAndUpdate({ phone }, { chatId });
    } else return false;
  }

  return await sendMessage(chatId, texts.verificationCodeSent(code));
};

// Register
const register = async (req, res, next) => {
  const phone = Number(req.body.phone);
  const { firstName, lastName, password } = req.body;
  const role = req?.query?.role?.toLowerCase() || "student";

  const allowedRoles = ["student", "supervisor"];

  if (isNaN(phone) || String(phone)?.length !== 12) {
    return res.status(400).json({
      code: "invalidPhone",
      message: "Telefon raqam noto'g'ri",
    });
  }

  if (String(password)?.length < 6) {
    return res.status(400).json({
      code: "invalidPassword",
      message: "Parol juda ham qisqa",
    });
  }

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
      const isSent = await sentVerificationCode(user.chatId, code, phone);
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
    const isSent = await sentVerificationCode(user.chatId, code, phone);
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
  const password = req.body.password;
  const code = Number(req.body.code);
  const phone = Number(req.body.phone);

  if (isNaN(phone) || String(phone)?.length !== 12) {
    return res.status(400).json({
      code: "invalidPhone",
      message: "Telefon raqam noto'g'ri",
    });
  }

  if (String(password)?.length < 6) {
    return res.status(400).json({
      code: "invalidPassword",
      message: "Parol juda ham qisqa",
    });
  }

  if (String(code)?.length !== 4) {
    return res.status(400).json({
      code: "invalidCode",
      message: "Kod noto'g'ri",
    });
  }

  try {
    // Get latest sent code
    const verificationCode = await VerificationCode.findOne({ phone, code });
    if (!verificationCode) {
      return res.status(400).json({
        code: "codeInvalid",
        message: "Kod noto'g'ri",
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
  const password = req.body.password;
  const phone = Number(req.body.phone);

  if (isNaN(phone) || String(phone)?.length !== 12) {
    return res.status(400).json({
      code: "invalidPhone",
      message: "Telefon raqam noto'g'ri",
    });
  }

  if (String(password)?.length < 6) {
    return res.status(400).json({
      code: "invalidPassword",
      message: "Parol juda ham qisqa",
    });
  }

  try {
    const user = await User.findOne({ phone });

    // Invalid credentials
    if (!user) {
      return res.status(400).json({
        code: "invalidCredentials",
        message: "Telefon raqam yoki parol noto'g'ri",
      });
    }

    // Is not verified
    if (!user.isVerified) {
      const code = getRandomNumber(1000, 9999);
      const isSent = await sentVerificationCode(user.chatId, code, phone);
      const verificationCode = await VerificationCode.create({
        code,
        phone,
        isSent,
      });

      return res.status(400).json({
        code: "accountNotVerified",
        createdAt: verificationCode.createdAt,
        expiresAt: verificationCode.expiresAt,
        message: "Hisob tasdiqlanmagan, kod qayta yuborildi",
      });
    }

    // Wrong password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        code: "invalidCredentials",
        message: "Telefon raqam yoki parol noto'g'ri",
      });
    }

    // Sakses 🗿
    const token = generateToken(user);
    res.json({
      user,
      token,
      code: "loginSuccess",
      message: "Hisobingizga kirdingiz",
    });
  } catch (err) {
    next(err);
  }
};

// Resend verification code
const resendCode = async (req, res, next) => {
  const phone = Number(req.body.phone);
  const loginWithCode = req.query.loginWithCode;

  if (isNaN(phone) || String(phone)?.length !== 12) {
    return res.status(400).json({
      code: "invalidPhone",
      message: "Telefon raqam noto'g'ri",
    });
  }

  try {
    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        code: "userNotFound",
        message: "Foydalanuvchi topilmadi",
      });
    }

    // If user is already verified
    if (user.isVerified && !loginWithCode) {
      return res.status(400).json({
        code: "alreadyVerified",
        message: "Hisob allaqachon tasdiqlangan",
      });
    }

    // Check if code was sent recently (60 seconds cooldown)
    const lastCode = await VerificationCode.findOne({ phone }).sort({
      createdAt: -1,
    });

    if (lastCode) {
      const diff = (Date.now() - lastCode.createdAt.getTime()) / 1000;

      if (diff < 60) {
        return res.status(400).json({
          code: "codeAlreadySent",
          createdAt: lastCode.createdAt,
          expiresAt: lastCode.expiresAt,
          message: "Kod allaqachon yuborilgan",
        });
      }
    }

    // Generate and send new code
    const code = getRandomNumber(1000, 9999);
    const isSent = await sentVerificationCode(user.chatId, code, phone);
    const verificationCode = await VerificationCode.create({
      code,
      phone,
      isSent,
    });

    res.json({
      code: "codeResent",
      message: "Kod qayta yuborildi",
      createdAt: verificationCode.createdAt,
      expiresAt: verificationCode.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

// Send code to phone (for login without password)
const sendCodeToPhone = async (req, res, next) => {
  const phone = Number(req.body.phone);

  if (isNaN(phone) || String(phone)?.length !== 12) {
    return res.status(400).json({
      code: "invalidPhone",
      message: "Telefon raqam noto'g'ri",
    });
  }

  try {
    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        code: "userNotFound",
        message: "Foydalanuvchi topilmadi",
      });
    }

    // Check if code was sent recently (60 seconds cooldown)
    const lastCode = await VerificationCode.findOne({ phone }).sort({
      createdAt: -1,
    });

    if (lastCode) {
      const diff = (Date.now() - lastCode.createdAt.getTime()) / 1000;

      if (diff < 60) {
        return res.status(400).json({
          code: "codeAlreadySent",
          createdAt: lastCode.createdAt,
          expiresAt: lastCode.expiresAt,
          message: "Kod allaqachon yuborilgan",
        });
      }
    }

    // Generate and send new code
    const code = getRandomNumber(1000, 9999);
    const isSent = await sentVerificationCode(user.chatId, code, phone);
    const verificationCode = await VerificationCode.create({
      code,
      phone,
      isSent,
    });

    res.json({
      code: "codeSent",
      message: "Kod yuborildi",
      createdAt: verificationCode.createdAt,
      expiresAt: verificationCode.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

// Login with code (without password)
const loginWithCode = async (req, res, next) => {
  const code = Number(req.body.code);
  const phone = Number(req.body.phone);

  if (isNaN(phone) || String(phone)?.length !== 12) {
    return res.status(400).json({
      code: "invalidPhone",
      message: "Telefon raqam noto'g'ri",
    });
  }

  if (String(code)?.length !== 4) {
    return res.status(400).json({
      code: "invalidCode",
      message: "Kod noto'g'ri",
    });
  }

  try {
    // Get latest sent code
    const verificationCode = await VerificationCode.findOne({ phone, code });
    if (!verificationCode) {
      return res.status(400).json({
        code: "codeInvalid",
        message: "Kod noto'g'ri",
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

    // Find user
    const user = await User.findOne({ phone }).select("-password");
    if (!user) {
      return res.status(404).json({
        code: "userNotFound",
        message: "Foydalanuvchi topilmadi",
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      user,
      token,
      code: "loginSuccess",
      message: "Hisobingizga kirdingiz",
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

module.exports = {
  login,
  verify,
  profile,
  register,
  resendCode,
  loginWithCode,
  sendCodeToPhone,
};
