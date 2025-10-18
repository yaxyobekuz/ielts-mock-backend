const express = require("express");
const router = express.Router();

const {
  getParts,
  createPart,
  updatePart,
  deletePart,
  getPartById,
} = require("../controllers/part.controller");

// Middlewares
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const notStudent = roleCheck("teacher", "supervisor", "admin", "owner");

/**
 * GET /parts
 * Description: Retrieve all parts
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.get("/", auth, notStudent, getParts);

/**
 * GET /parts/:id
 * Description: Retrieve a specific part by ID
 * Access: Teacher, Supervisor, Admin, Owner
 */
router.get("/:id", auth, notStudent, validateId("id"), getPartById);

/**
 * POST /parts
 * Description: Create a new part
 * Access: Teacher (with canEditTest permission)
 */
router.post(
  "/",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  createPart
);

/**
 * PUT /parts/:id
 * Description: Update an existing part
 * Access: Teacher (with canEditTest permission)
 */
router.put(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canEditTest"),
  updatePart
);

/**
 * DELETE /parts/:id
 * Description: Delete a part
 * Access: Teacher (with canEditTest permission)
 */
router.delete(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canEditTest"),
  deletePart
);

module.exports = router;
