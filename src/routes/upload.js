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

/**
 * POST /upload/image
 * Description: Upload a single image file
 * Access: Authenticated users
 */
router.post("/image", auth, upload.single("image"), uploadImage);

/**
 * POST /upload/images
 * Description: Upload multiple image files (max 20)
 * Access: Authenticated users
 */
router.post("/images", auth, upload.array("images", 20), uploadImages);

module.exports = router;
