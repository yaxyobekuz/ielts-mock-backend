const express = require("express");
const router = express.Router();

// Middlewares
const { auth } = require("../middlewares/auth");

// Controllers
const { getUserStats } = require("../controllers/userStats.controller");

// Get current user's general statistics
router.get("/", auth, getUserStats);

module.exports = router;
