// Models
const Part = require("../models/Part");
const Test = require("../models/Test");

// Helpers
const { pickAllowedFields } = require("../utils/helpers");

// Create new part
const createPart = async (req, res, next) => {
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
        message: "Qism qo'shishning eng yuqori darajasiga yetildi",
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
      message: "Yangi qism muvaffaqiyatli yaratildi",
    });
  } catch (err) {
    next(err);
  }
};

// Get all parts
const getParts = async (req, res, next) => {
  try {
    const parts = await Part.find()
      .populate("test", "title")
      .populate("sections");

    res.json({
      parts,
      code: "partsFetched",
      message: "Barcha qismlar muvaffaqiyatli olindi",
    });
  } catch (err) {
    next(err);
  }
};

// Get part by ID
const getPartById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const part = await Part.findById(id)
      .populate("test", "title")
      .populate("sections");

    if (!part) {
      return res
        .status(404)
        .json({ code: "partNotFound", message: "Qism topilmadi" });
    }

    res.json({
      part,
      code: "partFetched",
      message: "Qism muvaffaqiyatli olindi",
    });
  } catch (err) {
    next(err);
  }
};

// Update part
const updatePart = async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user.id;
  const allowedFields = ["text", "description"];
  const partData = pickAllowedFields(req.body, allowedFields);

  try {
    const part = await Part.findOneAndUpdate({ _id: id, createdBy }, partData, {
      new: true,
    });

    if (!part) {
      return res
        .status(404)
        .json({ code: "partNotFound", message: "Qism topilmadi" });
    }

    res.json({
      part,
      code: "partUpdated",
      message: "Qism muvaffaqiyatli yangilandi",
    });
  } catch (err) {
    next(err);
  }
};

// Delete part
const deletePart = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Part.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ code: "partNotFound", message: "Qism topilmadi" });
    }

    res.json({
      code: "partDeleted",
      message: "Qism muvaffaqiyatli o'chirildi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPart, getParts, getPartById, updatePart, deletePart };
