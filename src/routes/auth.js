// Express
const express = require("express");
const router = express.Router();

// Controllers
const {
  login,
  verify,
  profile,
  register,
  resendCode,
  loginWithCode,
  sendCodeToPhone,
} = require("../controllers/auth.controller");

// Middlewares
const { auth } = require("../middlewares/auth");

router.post("/login", login);
router.post("/verify", verify);
router.post("/register", register);
router.get("/profile", auth, profile);
router.post("/resend-code", resendCode);
router.post("/login-with-code", loginWithCode);
router.post("/send-code-to-phone", sendCodeToPhone);

module.exports = router;
