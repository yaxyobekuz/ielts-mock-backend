const express = require("express");
const router = express.Router();

// Middlewares
const { auth } = require("../middlewares/auth");

// Multer
const { upload } = require("../utils/multer.js");

// Controllers
const {
  uploadImage,
  uploadImages,
} = require("../controllers/upload.controller.js");

router.post("/image", auth, upload.single("image"), uploadImage);
router.post("/images", auth, upload.array("images", 20), uploadImages);

module.exports = router;
