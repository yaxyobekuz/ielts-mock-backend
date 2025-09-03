// Models
const Test = require("../models/Test");

// Create test
const createTest = async (req, res) => {
  const createdBy = req.user.id;
  const { title, description = "", image = "" } = req.body;

  if (!title || !title.trim().length) {
    return res.status(400).json({
      code: "invalidProperty",
      message: "Test sarlavhasi talab qilinadi",
    });
  }

  try {
    const test = await Test.create({ title, image, description, createdBy });

    res.status(201).json({
      test,
      code: "testCreated",
      message: "Yangi test muvaffaqiyatli yaratildi",
    });
  } catch (err) {
    res.status(500).json({
      code: "serverError",
      message: err.message || "Serverda ichki xatolik",
    });
  }
};

// Get tests
const getTests = async (req, res) => {
  const { mine } = req.query;
  const createdBy = req.user.id;

  try {
    let tests;

    // User tests
    if (mine) {
      tests = await Test.find({ createdBy })
        .populate("createdBy", "firstName lastName role avatar")
        .select("-__v");
    }

    // All tests
    else {
      tests = await Test.find()
        .populate("createdBy", "firstName lastName role avatar")
        .select("-__v");
    }

    res.json({
      tests,
      code: "testsFetched",
      message: "Testlar muvaffaqiyatli olindi",
    });
  } catch (err) {
    res.status(500).json({
      code: "serverError",
      message: err.message || "Serverda ichki xatolik",
    });
  }
};

// Get single test by ID
const getTestById = async (req, res) => {
  const { id } = req.params;

  try {
    const test = await Test.findById(id)
      .populate("createdBy", "firstName lastName role avatar")
      .populate({
        path: "listening reading writing",
        populate: { path: "sections", model: "Section" },
      })
      .select("-__v");

    if (!test) {
      return res
        .status(404)
        .json({ code: "testNotFound", message: "Test topilmadi" });
    }

    res.json({
      test,
      code: "testFetched",
      message: "Test muvaffaqiyatli olindi",
    });
  } catch (err) {
    res.status(500).json({
      code: "serverError",
      message: err.message || "Serverda ichki xatolik",
    });
  }
};

// Update test
const updateTest = async (req, res) => {
  const updates = {};
  const { id } = req.params;
  const createdBy = req.user.id;
  const allowedFields = ["title", "description", "image"];

  try {
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (!updates?.title || !updates.title.trim().length) {
      return res.status(400).json({
        code: "invalidProperty",
        message: "Test sarlavhasi talab qilinadi",
      });
    }

    const updated = await Test.findOneAndUpdate(
      { _id: id, createdBy },
      updates,
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ code: "testNotFound", message: "Test topilmadi" });
    }

    res.json({
      test: updated,
      code: "testUpdated",
      message: "Test muvaffaqiyatli yangilandi",
    });
  } catch (err) {
    res.status(500).json({
      code: "serverError",
      message: err.message || "Serverda ichki xatolik",
    });
  }
};

// Delete test
const deleteTest = async (req, res) => {
  const { id } = req.params;
  const createdBy = req.user.id;

  try {
    const deleted = await Test.findOneAndDelete({ _id: id, createdBy });

    if (!deleted) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    res.json({
      code: "testDeleted",
      message: "Test muvaffaqiyatli o'chirildi",
    });
  } catch (err) {
    res.status(500).json({
      code: "serverError",
      message: err.message || "Serverda ichki xatolik",
    });
  }
};

module.exports = {
  getTests,
  createTest,
  updateTest,
  deleteTest,
  getTestById,
};
