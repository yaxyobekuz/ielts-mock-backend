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
const { auth } = require("../middlewares/auth");


router.get("/", auth, getParts);
router.post("/", auth, createPart);
router.put("/:id", auth, updatePart);
router.get("/:id", auth, getPartById);
router.delete("/:id", auth, deletePart);

module.exports = router;
