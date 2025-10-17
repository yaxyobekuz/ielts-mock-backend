// Express
const express = require("express");
const router = express.Router();

// Controllers
const {
  getLink,
  addUsage,
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  getLinkPreview,
} = require("../controllers/link.controller");

// Middlewares
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

router.get("/", auth, getLinks);
router.get("/:id", auth, getLink);

// Create new link
router.post(
  "/",
  auth,
  roleCheck(["teacher", "supervisor"]),
  checkPermission("canCreateLink"),
  createLink
);

// Update link
router.put(
  "/:id",
  auth,
  roleCheck(["teacher", "supervisor"]),
  checkPermission("canEditLink"),
  updateLink
);

// Delete link
router.delete(
  "/:id",
  auth,
  roleCheck(["teacher", "supervisor"]),
  checkPermission("canDeleteLink"),
  deleteLink
);

router.post("/:id/usage", auth, addUsage);
router.get("/:id/preview", auth, getLinkPreview);

module.exports = router;
