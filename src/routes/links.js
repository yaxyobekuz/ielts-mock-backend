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
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

/**
 * GET /links
 * Description: Retrieve all links
 * Access: All authenticated users
 */
router.get("/", auth, getLinks);

/**
 * GET /links/:id
 * Description: Retrieve a specific link by ID
 * Access: All authenticated users
 */
router.get("/:id", auth, validateId("id"), getLink);

/**
 * GET /links/:id/preview
 * Description: Get preview information for a specific link
 * Access: All authenticated users
 */
router.get("/:id/preview", auth, validateId("id"), getLinkPreview);

/**
 * POST /links
 * Description: Create a new link
 * Access: Teacher, Supervisor (with canCreateLink permission)
 */
router.post(
  "/",
  auth,
  roleCheck(["teacher", "supervisor"]),
  checkPermission("canCreateLink"),
  createLink
);

/**
 * POST /links/:id/usage
 * Description: Add usage record for a link
 * Access: All authenticated users
 */
router.post("/:id/usage", auth, validateId("id"), addUsage);

/**
 * PUT /links/:id
 * Description: Update an existing link
 * Access: Teacher, Supervisor (with canEditLink permission)
 */
router.put(
  "/:id",
  auth,
  roleCheck(["teacher", "supervisor"]),
  validateId("id"),
  checkPermission("canEditLink"),
  updateLink
);

/**
 * DELETE /links/:id
 * Description: Delete a link
 * Access: Teacher, Supervisor (with canDeleteLink permission)
 */
router.delete(
  "/:id",
  auth,
  roleCheck(["teacher", "supervisor"]),
  validateId("id"),
  checkPermission("canDeleteLink"),
  deleteLink
);

module.exports = router;
