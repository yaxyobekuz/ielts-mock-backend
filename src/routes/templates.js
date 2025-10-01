const express = require("express");
const router = express.Router();

// Controllers
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
} = require("../controllers/templates.controller");

// Middlewares
const { auth, roleCheck } = require("../middlewares/auth");

router.get(
  "/",
  auth,
  roleCheck(["supervisor", "teacher", "admin", "owner"]),
  getTemplates
);
router.get(
  "/:id",
  auth,
  roleCheck(["supervisor", "teacher", "admin", "owner"]),
  getTemplateById
);
router.post("/", auth, roleCheck(["admin", "owner"]), createTemplate);
router.put("/:id", auth, roleCheck(["admin", "owner"]), updateTemplate);
router.delete("/:id", auth, roleCheck(["admin", "owner"]), deleteTemplate);

module.exports = router;
