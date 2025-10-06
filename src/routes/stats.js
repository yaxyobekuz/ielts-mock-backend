const express = require("express");
const router = express.Router();

// Middlewares
const { auth, roleCheck } = require("../middlewares/auth");

// Controllers
const { getStats } = require("../controllers/stats.controller");

router.get(
  "/",
  auth,
  roleCheck(["owner", "admin", "teacher", "supervisor"]),
  getStats
);

module.exports = router;
