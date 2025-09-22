// Models
const Result = require("../models/Result");
const Submission = require("../models/Submission");

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
  const userId = req.user._id;
  const { submissionId } = req.body;

  try {
    // Submission
    const submission = await Submission.findById(submissionId);
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

    // Test answers { 1:"", ... }
    const correctAnswers = await getTestAnswers(submission.test._id);
    if (!correctAnswers) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    const userAnswers = submission.answers; // { 1:"", ... }
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

    const total = listeningScore + readingScore + writingScore + speakingScore;
    const overall = roundToNearestHalf(total / 4);

    // Create result
    const result = await Result.create({
      overall,
      createdBy: userId,
      ...formattedCriteria,
      test: submission.test,
      link: submission.link,
      reading: readingScore,
      writing: writingScore,
      speaking: speakingScore,
      listening: listeningScore,
      submission: submission._id,
      student: submission.student || "68cec957385513f3a2602d80",
      teacher: submission.teacher,
      supervisor: submission.supervisor,
    });

    // Update submission
    submission.isScored = true;
    submission.result = result._id;
    await submission.save();

    res.status(201).json({
      result,
      code: "resultCreated",
      message: "Natija muvaffaqiyatli yaratilindi",
    });
  } catch (err) {
    next(err);
  }
};

// Get results
const getResults = async (req, res, next) => {
  let filter = {};
  const { _id: userId, role: userRole } = req.user;

  // Filter
  if (userRole === "teacher") filter.teacher = userId;
  else if (userRole === "student") filter.user = userId;
  else if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const results = await Result.find(filter)
      .select("-teacher -supervisor -createdBy")
      .populate("student");

    res.json({ code: "resultsFetched", results });
  } catch (err) {
    next(err);
  }
};

// Get result by id
const getResultById = async (req, res, next) => {
  let filter = { _id: req.params.id };
  const { _id: userId, role: userRole } = req.user;

  // Filter
  if (userRole === "teacher") filter.teacher = userId;
  else if (userRole === "student") filter.user = userId;
  else if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const result = await Result.findOne(filter)
      .populate({
        path: "submission student",
        select: `-answers -password -balance -chatId -createdAt -__v -updatedAt`,
      })
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

// Result yangilash (masalan, foydalanuvchi javob qo‘shsa yoki testni tugatsa)
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
    res.json({ message: "Result o‘chirildi" });
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
