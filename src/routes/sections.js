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
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const notStudent = roleCheck(["teacher", "supervisor", "admin", "owner"]);

/**
 * GET /sections
 * Description: Retrieve all sections
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.get("/", auth, notStudent, getSections);

/**
 * GET /sections/:id
 * Description: Retrieve a specific section by ID
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.get("/:id", auth, notStudent, validateId("id"), getSectionById);

/**
 * POST /sections
 * Description: Create a new section
 * Access: Teacher (with canEditTest permission)
 */
router.post(
  "/",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  createSection
);

/**
 * PUT /sections/:id
 * Description: Update an existing section
 * Access: Teacher (with canEditTest permission)
 */
router.put(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canEditTest"),
  updateSection
);

/**
 * DELETE /sections/:id
 * Description: Delete a section
 * Access: Teacher (with canEditTest permission)
 */
router.delete(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canEditTest"),
  deleteSection
);

module.exports = router;
