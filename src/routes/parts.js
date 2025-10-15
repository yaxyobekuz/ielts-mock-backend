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
const { auth, roleCheck } = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const notStudent = roleCheck("teacher", "supervisor", "admin", "owner");

router.get("/", auth, notStudent, getParts);
router.get("/:id", auth, notStudent, getPartById);

// Create new part
router.post(
  "/",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  createPart
);

// Edit part
router.put(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  updatePart
);

// Delete part
router.delete(
  "/:id",
  auth,
  roleCheck(["teacher"]),
  checkPermission("canEditTest"),
  deletePart
);

module.exports = router;
