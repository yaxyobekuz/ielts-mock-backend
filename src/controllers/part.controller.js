const Part = require("../models/Part");
const Test = require("../models/Test");

// Create new part
const createPart = async (req, res) => {
  const createdBy = req.user.id;
  const { testId, module } = req.body;

  try {
    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    if (!["listening", "reading", "writing"].includes(module)) {
      return res.status(400).json({
        code: "moduleNotAllow",
        message: `${module} uchun ruxsat berilmagan`,
      });
    }

    const partNumber = test[module].parts.length + 1;

    if (partNumber > 6) {
      return res.status(400).json({
        code: "maxParts",
        message: "Sahifa qo'shishning eng baland darajasiga yetib bo'ldi",
      });
    }

    const part = await Part.create({
      module,
      testId,
      createdBy,
      number: partNumber,
    });

    test[module].parts.push(part);
    test[module].partsCount = partNumber;
    test.totalParts =
      test.writing.partsCount +
      test.reading.partsCount +
      test.listening.partsCount;
    await test.save();

    res.status(201).json({
      part,
      code: "partCreated",
      message: "New part created successfully",
    });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

// Get all parts
const getParts = async (req, res) => {
  try {
    const parts = await Part.find()
      .populate("test", "title")
      .populate("sections");

    res.json({
      parts,
      code: "partsFetched",
      message: "All parts fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

// Get part by ID
const getPartById = async (req, res) => {
  try {
    const { id } = req.params;

    const part = await Part.findById(id)
      .populate("test", "title")
      .populate("sections");

    if (!part) {
      return res
        .status(404)
        .json({ code: "partNotFound", message: "Part not found" });
    }

    res.json({
      part,
      code: "partFetched",
      message: "Part fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

// Update part
const updatePart = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Part.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res
        .status(404)
        .json({ code: "partNotFound", message: "Part not found" });
    }

    res.json({
      part: updated,
      code: "partUpdated",
      message: "Part updated successfully",
    });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

// Delete part
const deletePart = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Part.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ code: "partNotFound", message: "Part not found" });
    }

    res.json({ code: "partDeleted", message: "Part deleted successfully" });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

module.exports = { createPart, getParts, getPartById, updatePart, deletePart };
