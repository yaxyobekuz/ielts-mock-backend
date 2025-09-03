const express = require("express");
const router = express.Router();

// Controllers
const {
  getTests,
  createTest,
  updateTest,
  deleteTest,
  getTestById,
} = require("../controllers/tests.controller");

// Middlewares
const { auth } = require("../middlewares/auth");

router.get("/", auth, getTests);
router.post("/", auth, createTest);
router.put("/:id", auth, updateTest);
router.get("/:id", auth, getTestById);
router.delete("/:id", auth, deleteTest);

module.exports = router;
