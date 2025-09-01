// Express
const express = require("express");
const router = express.Router();

// Controllers
const {
  login,
  verify,
  profile,
  register,
} = require("../controllers/auth.controller");

// Middlewares
const { auth } = require("../middlewares/auth");

router.post("/login", login);
router.post("/verify", verify);
router.post("/register", register);
router.post("/profile", auth, profile);

module.exports = router;
