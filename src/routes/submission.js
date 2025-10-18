// Express
const express = require("express");
const router = express.Router();

// Controllers
const {
  getSubmissions,
  updateSubmission,
  deleteSubmission,
  createSubmission,
  getSubmissionById,
} = require("../controllers/submission.controller");

// Middlewares
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth");
const notStudent = roleCheck(["teacher", "supervisor", "owner", "admin"]);

/**
 * GET /submissions
 * Description: Retrieve all submissions
 * Access: All authenticated users
 */
router.get("/", auth, getSubmissions);

/**
 * GET /submissions/:id
 * Description: Retrieve a specific submission by ID
 * Access: All authenticated users
 */
router.get("/:id", auth, validateId("id"), getSubmissionById);

/**
 * POST /submissions
 * Description: Create a new submission
 * Access: All authenticated users
 */
router.post("/", auth, createSubmission);

/**
 * PUT /submissions/:id
 * Description: Update an existing submission
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.put("/:id", auth, notStudent, validateId("id"), updateSubmission);

/**
 * DELETE /submissions/:id
 * Description: Delete a submission
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.delete("/:id", auth, notStudent, validateId("id"), deleteSubmission);

module.exports = router;
