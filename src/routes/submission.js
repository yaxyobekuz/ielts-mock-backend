// Express
const express = require("express");
const router = express.Router();

// Middlewares
const { auth } = require("../middlewares/auth");

// Controllers
const {
  getSubmissions,
  updateSubmission,
  deleteSubmission,
  createSubmission,
  getSubmissionById,
} = require("../controllers/submission.controller");

router.get("/", auth, getSubmissions);
router.post("/", auth, createSubmission);
router.put("/:id", auth, updateSubmission);
router.get("/:id", auth, getSubmissionById);
router.delete("/:id", auth, deleteSubmission);

module.exports = router;
