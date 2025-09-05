const express = require("express");
const router = express.Router();

// Middlewares
const { auth } = require("../middlewares/auth");

// Controllers
const {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSectionById,
} = require("../controllers/section.controller");



router.get("/", auth, getSections);
router.post("/", auth, createSection);
router.put("/:id", auth, updateSection);
router.get("/:id", auth, getSectionById);
router.delete("/:id", auth, deleteSection);

module.exports = router;
