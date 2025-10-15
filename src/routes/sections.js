const express = require("express");
const router = express.Router();

// Controllers
const {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSectionById,
} = require("../controllers/section.controller");

// Middlewares
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const notStudent = roleCheck(["teacher", "supervisor", "admin", "owner"]);

router.get("/", auth, notStudent, getSections);
router.get("/:id", auth, notStudent, getSectionById);

// Create new section
router.post(
  "/",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  createSection
);

// Edit section
router.put(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  updateSection
);

// Delete section
router.delete(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  deleteSection
);

module.exports = router;
