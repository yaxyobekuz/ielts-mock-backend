const express = require("express");
const router = express.Router();

// Controllers
const {
  getTests,
  createTest,
  updateTest,
  deleteTest,
  getTestById,
  updateModule,
  getLatestTests,
} = require("../controllers/tests.controller");

// Middlewares
const { auth } = require("../middlewares/auth");

router.get("/", auth, getTests);
router.post("/", auth, createTest);
router.put("/:id", auth, updateTest);
router.delete("/:id", auth, deleteTest);
router.get("/latest", auth, getLatestTests);
router.put("/:id/:module", auth, updateModule);
router.get("/:id", auth, getTestById);

module.exports = router;
