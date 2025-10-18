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

/**
 * POST /auth/login
 * Description: Login with phone and password
 * Access: Public
 */
router.post("/login", login);

/**
 * POST /auth/register
 * Description: Register a new user account
 * Access: Public
 */
router.post("/register", register);

/**
 * POST /auth/verify
 * Description: Verify phone number with code
 * Access: Public
 */
router.post("/verify", verify);

/**
 * POST /auth/send-code-to-phone
 * Description: Send verification code to phone number
 * Access: Public
 */
router.post("/send-code-to-phone", sendCodeToPhone);

/**
 * POST /auth/login-with-code
 * Description: Login using verification code
 * Access: Public
 */
router.post("/login-with-code", loginWithCode);

/**
 * POST /auth/resend-code
 * Description: Resend verification code
 * Access: Public
 */
router.post("/resend-code", resendCode);

/**
 * GET /auth/profile
 * Description: Get current user's profile
 * Access: Authenticated users
 */
router.get("/profile", auth, profile);

module.exports = router;
