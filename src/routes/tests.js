const express = require("express");
const router = express.Router();

// Controllers
const {
  getTests,
  createTest,
  updateTest,
  deleteTest,
  getTestById,
  getLatestTests,
  addAudioToModule,
  updateModuleDuration,
  deleteAudioFromModule,
} = require("../controllers/tests.controller");

// Multer
const { upload } = require("../utils/multer.js");

// Middlewares
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission.js");
const notStudent = roleCheck(["teacher", "supervisor", "admin", "owner"]);

// Get all tests
router.get("/", auth, notStudent, getTests);

// Delete test
router.delete(
  "/:id",
  auth,
  notStudent,
  checkPermission("canDeleteTest", "canDeleteTemplate"),
  deleteTest
);

// Create new test
router.post(
  "/",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canCreateTest"),
  createTest
);

// Edit test
router.put(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  updateTest
);

// Get latest tests
router.get(
  "/latest",
  auth,
  roleCheck(["supervisor", "teacher"]),
  getLatestTests
);

// Update module duration
router.put(
  "/:id/:module/duration",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  updateModuleDuration
);

// Delete module audio
router.delete(
  "/:id/:module/audios/:audioId",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  deleteAudioFromModule
);

// Get test by ID
router.get("/:id", auth, notStudent, getTestById);

// Add audio to module
router.post(
  "/:id/:module/audios",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  upload.single("file"),
  addAudioToModule
);

module.exports = router;
