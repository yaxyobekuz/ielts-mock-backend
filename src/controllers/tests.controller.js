// Stats jobs
const {
  scheduleStatsUpdate,
  scheduleUserStatsUpdate,
} = require("../jobs/statsJobs");

// Mongoose
const mongoose = require("mongoose");

// Models
const Part = require("../models/Part");
const Test = require("../models/Test");
const Audio = require("../models/Audio");
const Template = require("../models/Template");

// Helpers
const { pickAllowedFields } = require("../utils/helpers");

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

    const getPartData = (module, number = 1) => ({
      module,
      number,
      createdBy,
      testId: test._id,
      totalQuestions: 0,
      supervisor: supervisor || createdBy,
    });

    // Create parts
    const writingPart1 = await Part.create(getPartData("writing"));
    const writingPart2 = await Part.create(getPartData("writing", 2));

    const readingPart = await Part.create(getPartData("reading"));
    const listeningPart = await Part.create(getPartData("listening"));

    // Save test
    test.totalParts = 4;
    test.reading = { partsCount: 1, parts: [readingPart._id] };
    test.listening = { partsCount: 1, parts: [listeningPart._id] };
    test.writing = {
      partsCount: 2,
      parts: [writingPart1._id, writingPart2._id],
    };
    const savedTest = await test.save();

    // Schedule stats update for teacher and supervisor
    const { _id, role, supervisor } = req.user;
    const statsUpdate = { "tests.created": 1 };
    const userStatsUpdate = { "tests.active": 1, "tests.created": 1 };

    await scheduleUserStatsUpdate(_id, userStatsUpdate);
    await scheduleStatsUpdate(_id, role, supervisor, statsUpdate);

    // If teacher, update supervisor stats too
    if (role === "teacher" && supervisor) {
      await scheduleUserStatsUpdate(supervisor, userStatsUpdate);
      await scheduleStatsUpdate(supervisor, "supervisor", null, statsUpdate);
    }

    res.status(201).json({
      code: "testCreated",
      message: "Yangi test muvaffaqiyatli yaratildi",
      test: {
        ...savedTest.toObject(),
        reading: [readingPart],
        listening: [listeningPart],
        writing: [writingPart1, writingPart2],
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get tests
const getTests = async (req, res, next) => {
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.trim() || "";

  // Filter
  let filter = { isDeleted: false };
  if (user.role === "supervisor") filter.supervisor = user._id;
  else if (user.role === "teacher") filter.createdBy = user._id;

  // Search by title
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  try {
    const skip = (page - 1) * limit;

    const [tests, total] = await Promise.all([
      Test.find(filter)
        .populate("createdBy", "firstName lastName")
        .select(
          "title totalSubmissions createdAt isCopied isTemplate isTemplated template totalParts"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Test.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      tests,
      code: "testsFetched",
      message: "Testlar olindi",
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get latest tests with limit
const getLatestTests = async (req, res, next) => {
  const user = req.user;
  const { limit } = req.query;
  const max = parseInt(limit) || 5;

  // Filter
  let filter = { isDeleted: false };
  if (user.role === "supervisor") filter.supervisor = user._id;
  else if (user.role === "teacher") filter.createdBy = user._id;

  try {
    const tests = await Test.find(filter)
      .sort({ updatedAt: -1 })
      .limit(max)
      .select("title updatedAt");

    res.json({
      tests,
      code: "latestTestsFetched",
      message: "So'nggi testlar olindi",
    });
  } catch (err) {
    console.log(err);

    next(err);
  }
};

// Get single test by ID
const getTestById = async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  // Filter
  let filter = { _id: id, isDeleted: false };
  if (user.role === "supervisor") filter.supervisor = user._id;
  else if (user.role === "teacher") filter.createdBy = user._id;

  try {
    const test = await Test.findOne(filter)
      .populate({
        path: "createdBy",
        populate: "avatar",
        select: "firstName lastName role avatar",
      })
      .populate({
        path: "listening.parts reading.parts writing.parts",
        populate: { path: "sections", model: "Section" },
      })
      .populate("listening.audios")
      .select("-__v -deletedAt -isDeleted");

    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
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
  const { id } = req.params;
  const createdBy = req.user.id;
  const allowedFields = ["title", "description"];

  try {
    const updates = pickAllowedFields(req.body, allowedFields);
    if (updates.title && !updates?.title?.trim()?.length) {
      return res.status(400).json({
        code: "invalidProperty",
        message: "Sarlavha talab qilinadi",
      });
    }

    const updated = await Test.findOneAndUpdate(
      { _id: id, createdBy, isDeleted: false },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    res.json({
      test: updated,
      code: "testUpdated",
      message: "Test yangilandi",
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
    const test = await Test.findOne({ _id: id, createdBy, isDeleted: false });
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
  const userId = req.user.id;

  try {
    const deleted = await Test.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { isDeleted: true, deletedBy: userId, deletedAt: Date.now() }
    );

    if (!deleted) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    if (deleted.isTemplate) {
      await Template.findOneAndUpdate(
        { _id: deleted.template },
        { isDeleted: true, deletedBy: userId, deletedAt: Date.now() }
      );
    }

    // Schedule stats update for teacher and supervisor
    const { _id, role, supervisor } = req.user;
    const statsUpdate = { "tests.deleted": 1 };
    const userStatsUpdate = { "tests.active": -1, "tests.deleted": 1 };

    await scheduleUserStatsUpdate(_id, userStatsUpdate);
    await scheduleStatsUpdate(_id, role, supervisor, statsUpdate);

    // If teacher, update supervisor stats too
    if (role === "teacher" && supervisor) {
      await scheduleUserStatsUpdate(supervisor, userStatsUpdate);
      await scheduleStatsUpdate(supervisor, "supervisor", null, statsUpdate);
    }

    res.json({
      code: "testDeleted",
      message: "Test o'chirildi",
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
