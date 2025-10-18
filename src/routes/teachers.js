const express = require("express");
const router = express.Router();

// Controllers
const {
  getTeachers,
  createTeacher,
  updateTeacher,
  getTeacherById,
  updateTeacherPermissions,
} = require("../controllers/teachers.controller");

// Middlewares
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth");

/**
 * GET /teachers
 * Description: Retrieve all teachers
 * Access: Supervisor, Admin, Owner
 */
router.get("/", auth, roleCheck(["supervisor", "admin", "owner"]), getTeachers);

/**
 * GET /teachers/:id
 * Description: Retrieve a specific teacher by ID
 * Access: Supervisor, Admin, Owner
 */
router.get(
  "/:id",
  auth,
  roleCheck(["supervisor", "admin", "owner"]),
  validateId("id"),
  getTeacherById
);

/**
 * POST /teachers
 * Description: Create a new teacher account
 * Access: Supervisor
 */
router.post("/", auth, roleCheck(["supervisor"]), createTeacher);

/**
 * PUT /teachers/:id
 * Description: Update teacher information
 * Access: Supervisor
 */
router.put(
  "/:id",
  auth,
  roleCheck(["supervisor"]),
  validateId("id"),
  updateTeacher
);

/**
 * PUT /teachers/:id/permissions
 * Description: Update teacher permissions
 * Access: Supervisor
 */
router.put(
  "/:id/permissions",
  auth,
  roleCheck(["supervisor"]),
  validateId("id"),
  updateTeacherPermissions
);

module.exports = router;
