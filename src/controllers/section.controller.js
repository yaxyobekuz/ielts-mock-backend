// Models
const Part = require("../models/Part");
const Section = require("../models/Section");

// Create new section
const createSection = async (req, res) => {
  const createdBy = req.user.id;
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
    });

    await Part.findByIdAndUpdate(partId, { $push: { sections: section._id } });

    res.status(201).json({
      section,
      code: "sectionCreated",
      message: "New section created successfully",
    });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

// Get all sections
const getSections = async (req, res) => {
  try {
    const sections = await Section.find().select("-__v");

    res.json({
      sections,
      code: "sectionsFetched",
      message: "All sections fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

// Get section by ID
const getSectionById = async (req, res) => {
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
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

// Update section
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Section.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ code: "sectionNotFound", message: "Section not found" });
    }

    res.json({
      section: updated,
      code: "sectionUpdated",
      message: "Section updated successfully",
    });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

// Delete section
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Section.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ code: "sectionNotFound", message: "Section not found" });
    }

    res.json({
      code: "sectionDeleted",
      message: "Section deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ code: "serverError", message: err.message });
  }
};

module.exports = {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getSectionById,
};
