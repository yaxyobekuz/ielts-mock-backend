const express = require("express");
const router = express.Router();

// Multer
const { upload } = require("../utils/multer.js");

// Controllers
const {
  updateUser,
  getUserById,
  updateUserAvatar,
} = require("../controllers/users.controller.js");

// Middlewares
const { auth, roleCheck } = require("../middlewares/auth.js");

router.put("/me", auth, updateUser);
router.get("/:id", auth, roleCheck(["admin", "owner"]), getUserById);
router.put("/me/avatar", auth, upload.single("avatar"), updateUserAvatar);

module.exports = router;
