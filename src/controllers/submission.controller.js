// Models
const Link = require("../models/Link");
const Test = require("../models/Test");
const Submission = require("../models/Submission");

// Helpers
const { getTestAnswers } = require("../utils/test");

// Create a new submission
const createSubmission = async (req, res, next) => {
  const userId = req.user._id;
  const { linkId, answers } = req.body;

  try {
    // Find link by ID
    const link = await Link.findById(linkId);
    if (!link) {
      return res.status(404).json({
        code: "linkNotFound",
        message: "Havola topilmadi",
      });
    }

    // Find test by ID
    const test = await Test.findById(link.testId);
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    // Increment total submissions count
    test.totalSubmissions = (test.totalSubmissions || 0) + 1;
    await test.save();

    await Submission.create({
      answers,
      link: linkId,
      student: userId,
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

// Get all submissions
const getSubmissions = async (req, res, next) => {
  let filter = {};
  const { _id: userId, role: userRole } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const populateTest = req.query.populateTest === "true";
  let populate = {
    path: "student",
    populate: "avatar",
    select: "firstName lastName avatar role",
  };

  if (populateTest) {
    populate = { path: "test", select: "title description" };
  }

  // Filter by user role
  if (userRole === "teacher") filter.teacher = userId;
  else if (userRole === "student") filter.student = userId;
  else if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate(populate)
        .sort({ createdAt: -1 })
        .select("-answers")
        .skip(skip)
        .limit(limit),
      Submission.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      submissions,
      code: "submissionsFetched",
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

// Get submission by ID
const getSubmissionById = async (req, res, next) => {
  let filter = { _id: req.params.id };
  const { _id: userId, role: userRole } = req.user;

  // Filter by user role
  if (userRole === "teacher") filter.teacher = userId;
  else if (userRole === "student") filter.student = userId;
  else if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const submission = await Submission.findOne(filter)
      .populate({
        path: "student teacher",
        select: "-phone -password -chatId -balance",
      })
      .populate({ path: "test", select: "title description" });

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

// Update submission (e.g. when user adds answers or finishes test)
const updateSubmission = async (req, res, next) => {
  try {
    const data = req.body;

    // Add finishedAt if test is finished
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

// Delete submission
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
