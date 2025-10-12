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
const notStudent = roleCheck(["teacher", "supervisor", "admin", "owner"]);

router.get("/", auth, notStudent, getSections);
router.get("/:id", auth, notStudent, getSectionById);
router.post("/", auth, roleCheck(["teacher"]), createSection);
router.put("/:id", auth, roleCheck(["teacher"]), updateSection);
router.delete("/:id", auth, roleCheck(["teacher"]), deleteSection);

module.exports = router;
