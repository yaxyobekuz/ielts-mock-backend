// Express
const express = require("express");
const router = express.Router();

// Controllers
const {
  getResults,
  updateResult,
  deleteResult,
  createResult,
  getResultById,
} = require("../controllers/result.controller");

// Middlewares
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const notStudent = roleCheck(["teacher", "supervisor", "owner", "admin"]);

router.get("/", auth, getResults);
router.get("/:id", auth, getResultById);

// Create new result
router.post(
  "/",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canCreateResult"),
  createResult
);

// Delete result
router.delete(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canDeleteResult"),
  deleteResult
);

// Update result
router.put(
  "/:id",
  auth,
  notStudent,
  roleCheck(["teacher"]),
  checkPermission("canEditResult"),
  updateResult
);

module.exports = router;
