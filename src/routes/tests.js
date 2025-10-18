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
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission.js");
const notStudent = roleCheck(["teacher", "supervisor", "admin", "owner"]);

/**
 * GET /tests
 * Description: Retrieve all tests
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.get("/", auth, notStudent, getTests);

/**
 * GET /tests/latest
 * Description: Retrieve latest tests
 * Access: Teacher, Supervisor
 */
router.get(
  "/latest",
  auth,
  roleCheck(["supervisor", "teacher"]),
  getLatestTests
);

/**
 * GET /tests/:id
 * Description: Retrieve a specific test by ID
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.get("/:id", auth, notStudent, validateId("id"), getTestById);

/**
 * POST /tests
 * Description: Create a new test
 * Access: Teacher (with canCreateTest permission)
 */
router.post(
  "/",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canCreateTest"),
  createTest
);

/**
 * PUT /tests/:id
 * Description: Update an existing test
 * Access: Teacher (with canEditTest permission)
 */
router.put(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canEditTest"),
  updateTest
);

/**
 * DELETE /tests/:id
 * Description: Delete a test
 * Access: Teacher, Supervisor, Admin, Owner (with canDeleteTest permission)
 */
router.delete(
  "/:id",
  auth,
  notStudent,
  validateId("id"),
  checkPermission("canDeleteTest", "canDeleteTemplate"),
  deleteTest
);

/**
 * PUT /tests/:id/:module/duration
 * Description: Update the duration of a specific module
 * Access: Teacher (with canEditTest permission)
 */
router.put(
  "/:id/:module/duration",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canEditTest"),
  updateModuleDuration
);

/**
 * POST /tests/:id/:module/audios
 * Description: Add audio file to a specific module
 * Access: Teacher (with canEditTest permission)
 */
router.post(
  "/:id/:module/audios",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canEditTest"),
  upload.single("file"),
  addAudioToModule
);

/**
 * DELETE /tests/:id/:module/audios/:audioId
 * Description: Delete audio file from a specific module
 * Access: Teacher (with canEditTest permission)
 */
router.delete(
  "/:id/:module/audios/:audioId",
  auth,
  roleCheck(["teacher"]),
  validateId(["id", "audioId"]),
  checkPermission("canEditTest"),
  deleteAudioFromModule
);

module.exports = router;
