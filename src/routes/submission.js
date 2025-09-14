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

router.get("/", getSubmissions);
router.post("/", createSubmission);
router.put("/:id", updateSubmission);
router.get("/:id", getSubmissionById);
router.delete("/:id", deleteSubmission);

module.exports = router;
