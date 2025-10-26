const express = require("express");
const router = express.Router();
const { auth, roleCheck } = require("../middlewares/auth");
const {
  getDashboardStats,
  getDetailedStats,
} = require("../controllers/stats.controller");

// Get dashboard stats (last 7 days) 
router.get(
  "/dashboard",
  auth,
  roleCheck(["teacher", "supervisor", "admin", "owner"]),
  getDashboardStats
);

// Get detailed stats with date range 
router.get(
  "/detailed",
  auth,
  roleCheck(["teacher", "supervisor", "admin", "owner"]),
  getDetailedStats
);

module.exports = router;
