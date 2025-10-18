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
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth.js");

/**
 * GET /users/:id
 * Description: Retrieve a specific user by ID
 * Access: Admin, Owner
 */
router.get(
  "/:id",
  auth,
  roleCheck(["admin", "owner"]),
  validateId("id"),
  getUserById
);

/**
 * PUT /users/me
 * Description: Update current user's profile
 * Access: Authenticated users
 */
router.put("/me", auth, updateUser);

/**
 * PUT /users/me/avatar
 * Description: Update current user's avatar
 * Access: Authenticated users
 */
router.put("/me/avatar", auth, upload.single("avatar"), updateUserAvatar);

module.exports = router;
