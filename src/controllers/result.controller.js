// Data
const texts = require("../data/texts");

// Agenda (job scheduler)
const agenda = require("../config/agenda");

// Models
const Result = require("../models/Result");
const Submission = require("../models/Submission");

// Services
const { sendMessage } = require("../services/bot");

// Helpers
const {
  calculateBandScores,
  countCorrectAnswers,
  formatResultModulesCriteria,
} = require("../utils/result");
const { getTestAnswers } = require("../utils/test");
const { getModuleBandScore } = require("../utils/score");
const { roundToNearestHalf } = require("../utils/helpers");

// Create result
const createResult = async (req, res, next) => {
  const { _id: userId } = req.user;
  const { submissionId, listening, reading } = req.body;

  if (isNaN(Number(listening)) || isNaN(Number(reading))) {
    return res.status(400).json({
      code: "invalidScores",
      message: "Listening yoki Reading ballari noto'g'ri kiritilgan",
    });
  }

  try {
    // Submission
    const submission = await Submission.findById(submissionId).populate(
      "student"
    );
    if (!submission) {
      return res.status(404).json({
        code: "submissionNotFound",
        message: "Javoblar topilmadi",
      });
    }

    if (submission.isScored) {
      return res.status(400).json({
        code: "submissionIsScored",
        message: "Javoblar avval baholangan",
      });
    }

    // Test answers { 1:"", 2:[""], ... }
    const correctAnswers = await getTestAnswers(submission.test._id);
    if (!correctAnswers) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    const userAnswers = submission.answers; // { 1:"", 2:[""], ... }
    const formattedCriteria = formatResultModulesCriteria(req.body);
    const { writing: writingScore, speaking: speakingScore } =
      calculateBandScores(formattedCriteria);

    // Correct answers count
    const readingCorrectAnswersCount = countCorrectAnswers(
      userAnswers.reading,
      correctAnswers.reading
    );
    const listeningCorrectAnswersCount = countCorrectAnswers(
      userAnswers.listening,
      correctAnswers.listening
    );

    // Calculate listening & reading band score
    const listeningScore = getModuleBandScore(
      listeningCorrectAnswersCount,
      "listening"
    );
    const readingScore = getModuleBandScore(
      readingCorrectAnswersCount,
      "reading"
    );

    const serverTotal =
      listeningScore + readingScore + writingScore + speakingScore;
    const teacherTotal =
      Number(listening) + Number(reading) + writingScore + speakingScore;

    const serverOverall = roundToNearestHalf(serverTotal / 4);
    const teacherOverall = roundToNearestHalf(teacherTotal / 4);

    // Server
    const server = {
      overall: serverOverall,
      reading: readingScore,
      writing: writingScore,
      speaking: speakingScore,
      listening: listeningScore,
    };

    // Create result
    const result = await Result.create({
      server,
      createdBy: userId,
      ...formattedCriteria,
      test: submission.test,
      link: submission.link,
      writing: writingScore,
      overall: teacherOverall,
      speaking: speakingScore,
      reading: Number(reading),
      submission: submission._id,
      student: submission.student,
      teacher: submission.teacher,
      listening: Number(listening),
      supervisor: submission.supervisor,
    });

    // Update submission
    submission.isScored = true;
    submission.result = result._id;
    await submission.save();

    // Schedule stats update for teacher and supervisor
    const userStatsUpdate = {
      "results.active": 1,
      "results.created": 1,
      "submissions.graded": 1,
      "submissions.ungraded": -1,
    };
    const statsUpdate = {
      "results.created": 1,
      "submissions.graded": 1,
      "results.avgWriting": writingScore,
      "results.avgSpeaking": speakingScore,
      "results.avgOverall": teacherOverall,
      "results.avgReading": Number(reading),
      "results.avgListening": Number(listening),
    };

    await agenda.now("update-user-stats", {
      user: req.user,
      updateData: userStatsUpdate,
      teacherId: submission.teacher,
    });

    await agenda.now("update-stats", {
      user: req.user,
      updateData: statsUpdate,
      teacherId: submission.teacher,
    });

    res.status(201).json({
      result,
      code: "resultCreated",
      message: "Natija muvaffaqiyatli yaratilindi",
    });

    // Send notification to student
    const chatId = submission.student?.chatId;
    if (!chatId) return;
    await sendMessage(
      chatId,
      texts.resultReady(
        teacherOverall,
        reading,
        writingScore,
        speakingScore,
        listening
      ),
      {
        inline_keyboard: [
          [
            {
              text: "Javoblarni ko'rish",
              url: `https://cdimock.uz/profile/submissions/${submission._id}`,
            },
          ],
          [
            {
              text: "Saytga kirish",
              url: `https://cdimock.uz/profile/results/${result._id}`,
            },
          ],
        ],
      }
    );
  } catch (err) {
    next(err);
  }
};

// Get results
const getResults = async (req, res, next) => {
  let filter = {};
  const { _id: userId, role: userRole } = req.user;
  const populateTest = req.query.populateTest === "true";
  const { linkId, testId } = req.query;

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let populate = {
    path: "student",
    populate: "avatar",
    select: "firstName lastName avatar role",
  };

  if (populateTest) {
    populate = { path: "test", select: "title description" };
  }

  // Filter by linkId or testId if provided
  if (linkId) filter.link = linkId;
  if (testId) filter.test = testId;

  // Filter
  if (userRole === "teacher") filter.teacher = userId;
  else if (userRole === "student") filter.user = userId;
  else if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate(populate)
        .sort({ createdAt: -1 })
        .select("-teacher -supervisor -createdBy -__v")
        .skip(skip)
        .limit(limit),
      Result.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      results,
      code: "resultsFetched",
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get result by id
const getResultById = async (req, res, next) => {
  let filter = { _id: req.params.id };
  const { _id: userId, role: userRole } = req.user;
  const populateTest = req.query.populateTest === "true";

  let populate = {
    path: "student",
    populate: "avatar",
    select: "firstName lastName avatar role phone",
  };

  if (populateTest) {
    populate = { path: "test", select: "title description" };
  }

  // Filter
  if (userRole === "teacher") filter.teacher = userId;
  else if (userRole === "student") filter.user = userId;
  else if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const result = await Result.findOne(filter)
      .populate(populate)
      .select("-teacher -supervisor -createdBy -__v");

    if (!result) {
      return res.status(404).json({
        code: "resultNotFound",
        message: "Natija topilmadi",
      });
    }

    res.json({ result, code: "resultFetched" });
  } catch (err) {
    next(err);
  }
};

// Update result
const updateResult = async (req, res, next) => {
  try {
    const data = req.body;

    // Agar test tugasa finishedAt qo‘shiladi
    if (data.isFinished) {
      data.finishedAt = new Date();
    }

    const result = await Result.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });
    if (!result) return res.status(404).json({ message: "Result topilmadi" });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Result o‘chirish
const deleteResult = async (req, res, next) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Result topilmadi" });
    res.json({ message: "Result o'chirildi" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getResults,
  createResult,
  updateResult,
  deleteResult,
  getResultById,
};
