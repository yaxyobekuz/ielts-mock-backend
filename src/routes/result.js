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

router.post("/", auth, roleCheck(["teacher"]), createResult);
router.delete("/:id", auth, roleCheck(["teacher"]), deleteResult);
router.put("/:id", auth, notStudent, roleCheck(["teacher"]), updateResult);

module.exports = router;
