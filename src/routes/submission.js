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
const { auth, roleCheck } = require("../middlewares/auth");
const notStudent = roleCheck(["teacher", "supervisor", "owner", "admin"]);

router.get("/", auth, getSubmissions);
router.get("/:id", auth, getSubmissionById);
router.post("/", auth, notStudent, createSubmission);
router.put("/:id", auth, notStudent, updateSubmission);
router.delete("/:id", auth, notStudent, deleteSubmission);

module.exports = router;
