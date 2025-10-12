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
const notStudent = roleCheck("teacher", "supervisor", "admin", "owner");

router.get("/", auth, notStudent, getParts);
router.get("/:id", auth, notStudent, getPartById);
router.post("/", auth, roleCheck("teacher"), createPart);
router.put("/:id", auth, roleCheck("teacher"), updatePart);
router.delete("/:id", auth, roleCheck("teacher"), deletePart);

module.exports = router;
