// Express
const express = require("express");
const router = express.Router();

// Controllers
const {
  getResults,
  updateResult,
  deleteResult,
  createResult,
  getResultById,
} = require("../controllers/result.controller");

// Middlewares
const validateId = require("../middlewares/validateId");
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const notStudent = roleCheck(["teacher", "supervisor", "owner", "admin"]);

/**
 * GET /results
 * Description: Retrieve all results
 * Access: All authenticated users
 */
router.get("/", auth, getResults);

/**
 * GET /results/:id
 * Description: Retrieve a specific result by ID
 * Access: All authenticated users
 */
router.get("/:id", auth, validateId("id"), getResultById);

/**
 * POST /results
 * Description: Create a new result
 * Access: Teacher (with canCreateResult permission)
 */
router.post(
  "/",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canCreateResult"),
  createResult
);

/**
 * PUT /results/:id
 * Description: Update an existing result
 * Access: Teacher (with canEditResult permission)
 */
router.put(
  "/:id",
  auth,
  notStudent,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canEditResult"),
  updateResult
);

/**
 * DELETE /results/:id
 * Description: Delete a result
 * Access: Teacher (with canDeleteResult permission)
 */
router.delete(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  validateId("id"),
  checkPermission("canDeleteResult"),
  deleteResult
);

module.exports = router;
