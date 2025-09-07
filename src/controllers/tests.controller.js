// Models
const Part = require("../models/Part");
const Test = require("../models/Test");

// Create test
const createTest = async (req, res, next) => {
  const createdBy = req.user.id;
  const { title, description = "", image = "" } = req.body;

  if (!title || !title.trim().length) {
    return res.status(400).json({
      code: "invalidProperty",
      message: "Test sarlavhasi talab qilinadi",
    });
  }

  try {
    const test = await Test.create({
      title,
      image,
      createdBy,
      description,
    });

    const getPartData = (module) => ({
      module,
      number: 1,
      createdBy,
      partsCount: 1,
      testId: test._id,
      totalQuestions: 0,
    });

    // Create parts
    const writingPart = await Part.create(getPartData("writing"));
    const readingPart = await Part.create(getPartData("reading"));
    const listeningPart = await Part.create(getPartData("listening"));

    // Save test
    test.totalParts = 3;
    test.reading = { partsCount: 1, parts: [readingPart._id] };
    test.writing = { partsCount: 1, parts: [writingPart._id] };
    test.listening = { partsCount: 1, parts: [listeningPart._id] };
    const savedTest = await test.save();

    res.status(201).json({
      code: "testCreated",
      message: "Yangi test muvaffaqiyatli yaratildi",
      test: {
        ...savedTest.toObject(),
        reading: [readingPart],
        writing: [writingPart],
        listening: [listeningPart],
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get tests
const getTests = async (req, res, next) => {
  const { mine } = req.query;
  const createdBy = req.user.id;

  try {
    let tests;

    // User tests
    if (mine) {
      tests = await Test.find({ createdBy })
        .populate("createdBy", "firstName lastName role avatar")
        .select("-__v")
        .sort({ createdAt: -1 });
    }

    // All tests
    else {
      tests = await Test.find()
        .populate("createdBy", "firstName lastName role avatar")
        .select("-__v")
        .sort({ createdAt: -1 });
    }

    res.json({
      tests,
      code: "testsFetched",
      message: "Testlar muvaffaqiyatli olindi",
    });
  } catch (err) {
    next(err);
  }
};

// Get latest tests with limit
const getLatestTests = async (req, res, next) => {
  const { limit } = req.query;
  const createdBy = req.user.id;
  const max = parseInt(limit) || 5;

  try {
    const tests = await Test.find({ createdBy })
      .sort({ updatedAt: -1 })
      .limit(max)
      .select("-__v");

    res.json({
      tests,
      code: "latestTestsFetched",
      message: "Latest tests fetched successfully",
    });
  } catch (err) {
    console.log(err);

    next(err);
  }
};

// Get single test by ID
const getTestById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const test = await Test.findById(id)
      .populate("createdBy", "firstName lastName role avatar")
      .populate({
        path: "listening.parts reading.parts writing.parts",
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
    next(err);
  }
};

// Update test
const updateTest = async (req, res, next) => {
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
    next(err);
  }
};

// Delete test
const deleteTest = async (req, res, next) => {
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
    next(err);
  }
};

module.exports = {
  getTests,
  createTest,
  updateTest,
  deleteTest,
  getTestById,
  getLatestTests,
};
