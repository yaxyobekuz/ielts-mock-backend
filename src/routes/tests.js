const express = require("express");
const router = express.Router();

// Controllers
const {
  getTests,
  createTest,
  updateTest,
  deleteTest,
  getTestById,
  getLatestTests,
  addAudioToModule,
  updateModuleDuration,
  deleteAudioFromModule,
} = require("../controllers/tests.controller");

// Middlewares
const { auth } = require("../middlewares/auth");

// Multer
const { upload } = require("../utils/multer.js");

router.get("/", auth, getTests);
router.post("/", auth, createTest);
router.put("/:id", auth, updateTest);
router.delete("/:id", auth, deleteTest);
router.get("/latest", auth, getLatestTests);
router.put("/:id/:module/duration", auth, updateModuleDuration);
router.delete("/:id/:module/audios/:audioId", auth, deleteAudioFromModule);
router.get("/:id", auth, getTestById);

router.post(
  "/:id/:module/audios",
  auth,
  upload.single("file"),
  addAudioToModule
);

module.exports = router;
