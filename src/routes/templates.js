const express = require("express");
const router = express.Router();

// Multer
const { upload } = require("../utils/multer.js");

// Controllers
const {
  useTemplate,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
} = require("../controllers/templates.controller");

// Middlewares
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission.js");
const notStudent = roleCheck(["supervisor", "teacher", "admin", "owner"]);

/**
 * GET /templates
 * Description: Retrieve all templates
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.get("/", auth, notStudent, getTemplates);

/**
 * GET /templates/:id
 * Description: Retrieve a specific template by ID
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.get("/:id", auth, notStudent, validateId("id"), getTemplateById);

/**
 * POST /templates
 * Description: Create a new template
 * Access: Teacher, Supervisor, Admin, Owner (with canCreateTemplate permission)
 */
router.post(
  "/",
  auth,
  notStudent,
  checkPermission("canCreateTemplate"),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "banner", maxCount: 1 },
  ]),
  createTemplate
);

/**
 * PUT /templates/:id
 * Description: Update an existing template
 * Access: Teacher, Supervisor, Admin, Owner (with canEditTemplate permission)
 */
router.put(
  "/:id",
  auth,
  notStudent,
  validateId("id"),
  checkPermission("canEditTemplate"),
  updateTemplate
);

/**
 * DELETE /templates/:id
 * Description: Delete a template
 * Access: Teacher, Supervisor, Admin, Owner (with canDeleteTemplate permission)
 */
router.delete(
  "/:id",
  auth,
  notStudent,
  validateId("id"),
  checkPermission("canDeleteTemplate"),
  deleteTemplate
);

/**
 * POST /templates/:id/use
 * Description: Use a template to copy and create a new test
 * Access: Teacher (with canUseTemplate permission)
 */
router.post(
  "/:id/use",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canUseTemplate"),
  useTemplate
);

module.exports = router;
