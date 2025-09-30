const express = require("express");
const router = express.Router();

// Controllers
const {
  getTeachers,
  createTeacher,
  updateTeacher,
  getTeacherById,
} = require("../controllers/teachers.controller");

// Middlewares
const { auth, roleCheck } = require("../middlewares/auth");

router.post("/", auth, roleCheck(["supervisor"]), createTeacher);
router.put("/:id", auth, roleCheck(["supervisor"]), updateTeacher);
router.get("/", auth, roleCheck(["supervisor", "admin", "owner"]), getTeachers);
router.get("/:id", auth, roleCheck(["supervisor", "admin", "owner"]), getTeacherById);

module.exports = router;
