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
const { auth, roleCheck } = require("../middlewares/auth");
const notStudent = roleCheck(["teacher", "supervisor", "owner", "admin"]);

router.get("/", auth, getResults);
router.get("/:id", auth, getResultById);

router.post("/", auth, notStudent, createResult);
router.put("/:id", auth, notStudent, updateResult);
router.delete("/:id", auth, notStudent, deleteResult);

module.exports = router;
