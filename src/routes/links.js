// Express
const express = require("express");
const router = express.Router();

// Controllers
const {
  getLink,
  addUsage,
  getLinks,
  createLink,
  getLinkPreview,
} = require("../controllers/link.controller");

// Middlewares
const { auth } = require("../middlewares/auth");

router.get("/", auth, getLinks);
router.get("/:id", auth, getLink);
router.post("/", auth, createLink);
router.post("/:id/usage", addUsage);
router.get("/:id/preview", getLinkPreview);

module.exports = router;
