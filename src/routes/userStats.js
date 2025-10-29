const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const {
  getUserStats,
  recalculateStats,
  initializeAllStats,
  getSupervisorTeachersStats,
} = require("../controllers/userStats.controller");

// Get current user's general statistics
router.get("/", auth, getUserStats);

// Recalculate current user's statistics
router.post("/recalculate", auth, recalculateStats);

// Get all teachers stats under supervisor
router.get("/teachers", auth, getSupervisorTeachersStats);

// Initialize stats for all users (admin/owner only)
router.post("/initialize-all", auth, initializeAllStats);

module.exports = router;
