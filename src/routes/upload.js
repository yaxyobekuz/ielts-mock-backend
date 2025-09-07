const express = require("express");
const router = express.Router();

// Middlewares
const { auth } = require("../middlewares/auth");

// Multer
const { upload } = require("../utils/multer.js");

// Controllers
const {
  uploadPhoto,
  uploadPhotos,
} = require("../controllers/upload.controller.js");

router.post("/photo", auth, upload.single("photo"), uploadPhoto);
router.post("/photos", auth, upload.array("photos", 20), uploadPhotos);

module.exports = router;
