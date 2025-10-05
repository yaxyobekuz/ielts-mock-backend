// Mongoose
const mongoose = require("mongoose");

// Models
const Part = require("../models/Part");
const Test = require("../models/Test");
const Audio = require("../models/Audio");

// Upload service
const { uploadAudio } = require("../services/uploadService");

// Create test
const createTest = async (req, res, next) => {
  const { _id: createdBy, supervisor } = req.user;
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
      supervisor: supervisor || createdBy,
    });

    const getPartData = (module) => ({
      module,
      number: 1,
      createdBy,
      partsCount: 1,
      testId: test._id,
      totalQuestions: 0,
      supervisor: supervisor || createdBy,
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
      .populate("listening.audios")
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

// Update module
const updateModuleDuration = async (req, res, next) => {
  const createdBy = req.user.id;
  const { id, module } = req.params;
  const duration = req.body.duration;
  const allowedModules = ["listening", "reading", "writing"];

  // Check module type
  if (!allowedModules.includes(module)) {
    return res.status(400).json({
      code: "invalidModule",
      message: "Modul noto'g'ri kiritildi",
    });
  }

  try {
    // Test
    const test = await Test.findOne({ _id: id, createdBy });
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    // Update module
    test[module].duration = duration;
    await test.save();

    res.json({
      module,
      duration,
      code: "moduleDurationUpdated",
      message: "Modul vaqti muvaffaqiyatli yangilandi",
    });
  } catch (err) {
    next(err);
  }
};

// Add new audio to module
const addAudioToModule = async (req, res, next) => {
  const file = req.file;
  const userId = req.user.id;
  const { id, module } = req.params;
  const allowedModules = ["listening"];

  // Check module type
  if (!allowedModules.includes(module)) {
    return res.status(400).json({
      code: "invalidModule",
      message: "Modul noto'g'ri kiritildi",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      code: "invalidId",
      message: "Yaroqsiz ID formati kiritildi",
    });
  }

  try {
    // Test
    const test = await Test.findOne({ _id: id, createdBy: userId });
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    const audio = await uploadAudio(file, userId);

    // Update module
    test[module].audios.push(audio._id);
    await test.save();

    res.status(201).json({
      audio,
      module,
      code: "audioAddedToModule",
      message: "Modulga audio qo'shildi",
    });
  } catch (err) {
    next(err);
  }
};

// Delete audio from module
const deleteAudioFromModule = async (req, res, next) => {
  const createdBy = req.user.id;
  const allowedModules = ["listening"];
  const { id, module, audioId } = req.params;

  if (!allowedModules.includes(module)) {
    return res.status(400).json({
      code: "invalidModule",
      message: "Modul noto'g'ri kiritildi",
    });
  }

  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(audioId)
  ) {
    return res.status(400).json({
      code: "invalidId",
      message: "Yaroqsiz ID formati kiritildi",
    });
  }

  try {
    const test = await Test.findOne({ _id: id, createdBy });
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    // Check if audio exists
    const exists = test[module].audios.some(
      (audio) => audio.toString() === audioId.toString()
    );
    if (!exists) {
      return res.status(404).json({
        module,
        audioId,
        code: "audioNotFound",
        message: "Audio topilmadi",
      });
    }

    // Remove audio
    test[module].audios = test[module].audios.filter(
      (audio) => audio.toString() !== audioId.toString()
    );

    await test.save();
    if (!test.isCopied && (!test.copyCount || test.copyCount === 0)) {
      await Audio.findByIdAndDelete(audioId);
    }

    res.json({
      module,
      audioId,
      code: "audioDeletedFromModule",
      message: "Audio moduldan o'chirildi",
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
  addAudioToModule,
  updateModuleDuration,
  deleteAudioFromModule,
};
