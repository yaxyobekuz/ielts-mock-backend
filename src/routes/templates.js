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
const notStudent = roleCheck(["supervisor", "teacher", "admin", "owner"]);

router.get("/", auth, notStudent, getTemplates);
router.put("/:id", auth, notStudent, updateTemplate);
router.get("/:id", auth, notStudent, getTemplateById);
router.delete("/:id", auth, notStudent, deleteTemplate);
router.post("/:id/use", auth, roleCheck(["teacher"]), useTemplate);

router.post(
  "/",
  auth,
  notStudent,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "banner", maxCount: 1 },
  ]),
  createTemplate
);

module.exports = router;
