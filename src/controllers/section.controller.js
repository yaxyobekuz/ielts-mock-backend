// Models
const Part = require("../models/Part");
const Test = require("../models/Test");
const Section = require("../models/Section");

// Helpers
const { pickAllowedFields } = require("../utils/helpers");

// Create new section
const createSection = async (req, res, next) => {
  const { _id: createdBy, supervisor } = req.user;
  const { title, description, type, partId, testId, module } = req.body;

  try {
    // Test
    const test = await Test.findOne({ _id: testId, createdBy });
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    // Part
    const part = await Part.findOne({ _id: partId, createdBy });
    if (!part) {
      return res.status(404).json({
        code: "partNotFound",
        message: "Qism topilmadi",
      });
    }

    const section = await Section.create({
      type,
      title,
      module,
      testId,
      partId,
      createdBy,
      description,
      supervisor: supervisor || createdBy,
    });

    await Part.findByIdAndUpdate(partId, { $push: { sections: section._id } });

    res.status(201).json({
      section,
      code: "sectionCreated",
      message: "New section created successfully",
    });

    test[module].updatedAt = Date.now();
    await test.save();
  } catch (err) {
    next(err);
  }
};

// Get all sections
const getSections = async (req, res, next) => {
  try {
    const sections = await Section.find().select("-__v");

    res.json({
      sections,
      code: "sectionsFetched",
      message: "All sections fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Get section by ID
const getSectionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id).select("-__v");

    if (!section) {
      return res
        .status(404)
        .json({ code: "sectionNotFound", message: "Section not found" });
    }

    res.json({
      section,
      code: "sectionFetched",
      message: "Section fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Update section
const updateSection = async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user.id;

  const allowedFields = [
    "grid",
    "text",
    "title",
    "items",
    "groups",
    "coords",
    "options",
    "answers",
    "splitAnswers",
    "description",
    "questionsCount",
  ];
  const sectionData = pickAllowedFields(req.body, allowedFields);

  try {
    // Section
    const section = await Section.findOne({ _id: id, createdBy });
    if (!section) {
      return res.status(404).json({
        code: "sectionNotFound",
        message: "Bo'lim topilmadi",
      });
    }

    // Test
    const test = await Test.findOne({ _id: section.testId, createdBy });
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    const updatedSection = await Section.findByIdAndUpdate(id, sectionData, {
      new: true,
    });

    res.json({
      code: "sectionUpdated",
      section: updatedSection,
      message: "Bo'lim yangilandi",
    });

    // Update test's module updatedAt
    test[section.module].updatedAt = Date.now();
    await test.save();
  } catch (err) {
    next(err);
  }
};

// Delete section
const deleteSection = async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user._id;

  try {
    // Section
    const section = await Section.findOne({ _id: id, createdBy });
    if (!section) {
      return res.status(404).json({
        code: "sectionNotFound",
        message: "Bo'lim topilmadi",
      });
    }

    // Test
    const test = await Test.findOne({ _id: section.testId, createdBy });
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    // Part
    const part = await Part.findOneAndUpdate(
      { _id: section.partId, createdBy },
      { $pull: { sections: section._id } }
    );
    if (!part) {
      return res.status(404).json({
        code: "partNotFound",
        message: "Qism topilmadi",
      });
    }

    // Delete
    const deleted = await Section.findOneAndDelete({ _id: id, createdBy });
    if (!deleted) {
      return res.status(404).json({
        code: "sectionNotFound",
        message: "Bo'lim topilmadi",
      });
    }

    res.json({
      section: deleted,
      code: "sectionDeleted",
      message: "Bo'lim o'chirildi",
    });

    // Update test's module updatedAt
    test[section.module].updatedAt = Date.now();
    await test.save();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSectionById,
};
