// Models
const Link = require("../models/Link");
const Test = require("../models/Test");
const Submission = require("../models/Submission");

// Helpers
const { getTestAnswers } = require("../utils/test");

// Yangi submission yaratish
const createSubmission = async (req, res, next) => {
  const userId = req.user._id;
  const { linkId, answers } = req.body;

  try {
    // Link
    const link = await Link.findById(linkId);
    if (!link) {
      return res.status(404).json({
        code: "linkNotFound",
        message: "Havola topilmadi",
      });
    }

    // Test
    const test = await Test.findById(link.testId);
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    await Submission.create({
      answers,
      link: linkId,
      user: userId,
      test: link.testId,
      finishedAt: Date.now(),
      teacher: link.createdBy,
      supervisor: test.supervisor,
    });

    res.status(201).json({
      code: "submissionCreated",
      message: "Test javoblari qabul qilindi",
    });
  } catch (err) {
    next(err);
  }
};

// Barcha submissionlarni olish
const getSubmissions = async (req, res, next) => {
  let filter = {};
  const { _id: userId, role: userRole } = req.user;

  // Filter
  if (userRole === "teacher") filter.teacher = userId;
  else if (userRole === "student") filter.user = userId;
  else if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const submissions = await Submission.find(filter)
      .populate({ path: "user", select: "-phone -password -chatId -balance" })
      .select("-answers");

    res.json({ code: "submissionsFetched", submissions });
  } catch (err) {
    next(err);
  }
};

// ID bo‘yicha submission olish
const getSubmissionById = async (req, res, next) => {
  let filter = { _id: req.params.id };
  const { _id: userId, role: userRole } = req.user;

  // Filter
  if (userRole === "teacher") filter.teacher = userId;
  else if (userRole === "student") filter.user = userId;
  else if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const submission = await Submission.findOne(filter).populate({
      path: "test user teacher",
      select: "-phone -password -chatId -balance",
    });

    if (!submission) {
      return res.status(404).json({
        code: "submissionNotFound",
        message: "Javoblar topilmadi",
      });
    }

    const resData = {
      code: "submissionFetched",
      submission: { ...submission.toObject() },
    };

    if (userRole !== "student") {
      const correctAnswers = await getTestAnswers(submission.test._id);
      resData.submission.correctAnswers = correctAnswers;
    }

    res.json(resData);
  } catch (err) {
    next(err);
  }
};

// Submission yangilash (masalan, foydalanuvchi javob qo‘shsa yoki testni tugatsa)
const updateSubmission = async (req, res, next) => {
  try {
    const data = req.body;

    // Agar test tugasa finishedAt qo‘shiladi
    if (data.isFinished) {
      data.finishedAt = new Date();
    }

    const submission = await Submission.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });
    if (!submission)
      return res.status(404).json({ message: "Submission topilmadi" });

    res.json(submission);
  } catch (err) {
    next(err);
  }
};

// Submission o‘chirish
const deleteSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission)
      return res.status(404).json({ message: "Submission topilmadi" });
    res.json({ message: "Submission o‘chirildi" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSubmissions,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  getSubmissionById,
};
