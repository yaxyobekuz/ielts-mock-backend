// Models
const Part = require("../models/Part");
const Section = require("../models/Section");

// Helpers
const { pickAllowedFields } = require("../utils/helpers");

// Create new section
const createSection = async (req, res, next) => {
  const { _id: createdBy, supervisor } = req.user;
  const { title, description, type, partId, testId, module } = req.body;

  try {
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
    "description",
    "questionsCount",
  ];
  const sectionData = pickAllowedFields(req.body, allowedFields);

  try {
    const section = await Section.findOneAndUpdate(
      { _id: id, createdBy },
      sectionData,
      { new: true }
    );

    if (!section) {
      return res
        .status(404)
        .json({ code: "sectionNotFound", message: "Section not found" });
    }

    res.json({
      section,
      code: "sectionUpdated",
      message: "Section updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Delete section
const deleteSection = async (req, res, next) => {
  const { id } = req.params;
  const createdBy = req.user._id;

  try {
    const deleted = await Section.findOneAndDelete({ _id: id, createdBy });
    if (!deleted) {
      return res.status(404).json({
        code: "sectionNotFound",
        message: "Bo'lim topilmadi",
      });
    }

    res.json({
      code: "sectionDeleted",
      message: "Bo'lim o'chirildi",
    });
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
