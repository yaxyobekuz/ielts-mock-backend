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
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission.js");
const notStudent = roleCheck(["supervisor", "teacher", "admin", "owner"]);

router.get("/", auth, notStudent, getTemplates);
router.get("/:id", auth, notStudent, getTemplateById);

// Update template
router.put(
  "/:id",
  auth,
  notStudent,
  checkPermission("canEditTemplate"),
  updateTemplate
);

// Delete template
router.delete(
  "/:id",
  auth,
  notStudent,
  checkPermission("canDeleteTemplate"),
  deleteTemplate
);

// Use template to copy a test
router.post(
  "/:id/use",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canUseTemplate"),
  useTemplate
);

// Create new template
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

module.exports = router;
