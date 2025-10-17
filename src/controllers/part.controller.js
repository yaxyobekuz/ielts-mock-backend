// Models
const Part = require("../models/Part");
const Test = require("../models/Test");
const Section = require("../models/Section");

// Helpers
const { pickAllowedFields } = require("../utils/helpers");

// Create new part
const createPart = async (req, res, next) => {
  const { testId, module } = req.body;
  const { _id: createdBy, supervisor } = req.user;

  try {
    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    if (!["listening", "reading"].includes(module)) {
      return res.status(400).json({
        code: "moduleNotAllowed",
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
      supervisor: supervisor || createdBy,
    });

    test[module].updatedAt = Date.now();

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
      message: "Yangi qism yaratildi",
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
      message: "Barcha qismlar olindi",
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
      message: "Qism olindi",
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
    }).populate("sections");

    if (!part) {
      return res.status(404).json({
        code: "partNotFound",
        message: "Qism topilmadi",
      });
    }

    res.json({
      part,
      code: "partUpdated",
      message: "Qism yangilandi",
    });

    const test = await Test.findById(part.testId);
    if (test) {
      test[part.module].updatedAt = Date.now();
      await test.save();
    }
  } catch (err) {
    next(err);
  }
};

// Delete part
const deletePart = async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user._id;

  try {
    const deleted = await Part.findOneAndDelete({ _id: id, createdBy });
    if (!deleted) {
      return res.status(404).json({
        code: "partNotFound",
        message: "Qism topilmadi",
      });
    }

    const updateTestPromise = deleted.testId
      ? (async () => {
          const test = await Test.findById(deleted.testId);
          if (!test) return;

          const module = test[deleted.module];
          module.parts.pull(deleted._id);
          module.updatedAt = Date.now();
          module.partsCount -= 1;

          test.totalParts -= 1;
          await test.save();

          const parts = await Part.find({
            testId: deleted.testId,
            module: deleted.module,
          }).sort("number");

          await Promise.all(
            parts.map((part, idx) => {
              part.number = idx + 1;
              return part.save();
            })
          );
        })()
      : null;

    const deleteSectionsPromise = deleted.sections?.length
      ? Promise.all(
          deleted.sections.map((sectionId) =>
            Section.findByIdAndDelete(sectionId)
          )
        )
      : null;

    await Promise.all([updateTestPromise, deleteSectionsPromise]);

    res.json({
      code: "partDeleted",
      message: "Qism o'chirildi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPart, getParts, getPartById, updatePart, deletePart };
