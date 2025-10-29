const Test = require("../models/Test");
const Link = require("../models/Link");
const User = require("../models/User");
const Result = require("../models/Result");
const UserStats = require("../models/UserStats");
const Template = require("../models/Template");
const Submission = require("../models/Submission");

/**
 * Initialize or get user statistics
 * @param {ObjectId} userId - User ID
 * @returns {Object} - User statistics document
 */
const initializeUserStats = async (userId) => {
  const user = await User.findById(userId).lean();

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "teacher" && user.role !== "supervisor") {
    throw new Error("Statistics only available for teachers and supervisors");
  }

  // Check if already exists
  const existing = await UserStats.findOne({ userId });
  if (existing) {
    return existing;
  }

  // Create new stats document
  const userStats = await UserStats.create({
    userId,
    role: user.role,
    supervisor: user.supervisor || null,
    metadata: {
      createdFrom: "auto",
    },
  });

  // Calculate initial statistics
  await recalculateUserStats(userId);

  return userStats;
};

/**
 * Recalculate all user statistics from scratch
 * @param {ObjectId} userId - User ID
 * @returns {Object} - Updated statistics
 */
const recalculateUserStats = async (userId) => {
  const user = await User.findById(userId).lean();

  if (!user) {
    throw new Error("User not found");
  }

  const isTeacher = user.role === "teacher";
  const filterField = isTeacher ? "createdBy" : "supervisor";

  // Parallel fetch all data
  const [tests, submissions, results, links, templates] = await Promise.all([
    Test.find({ [filterField]: userId })
      .select("isDeleted")
      .lean(),
    Submission.find({ [isTeacher ? "teacher" : "supervisor"]: userId })
      .select("isScored")
      .lean(),
    Result.find({ [isTeacher ? "teacher" : "supervisor"]: userId })
      .select("overall reading writing speaking listening")
      .lean(),
    Link.find({ [filterField]: userId })
      .select("usedCount maxUses visitsCount")
      .lean(),
    user.role === "supervisor"
      ? Template.find({ createdBy: userId }).select("isActive").lean()
      : Promise.resolve([]),
  ]);

  // Calculate tests
  const activeTests = tests.filter((t) => !t.isDeleted);
  const deletedTests = tests.filter((t) => t.isDeleted);
  const createdTests = tests.length;

  // Calculate submissions
  const deletedSubmissions = 0;
  const createdSubmissions = submissions.length;
  const activeSubmissions = createdSubmissions;
  const gradedSubmissions = submissions.filter((s) => s.isScored);
  const ungradedSubmissions = activeSubmissions - gradedSubmissions.length;

  // Calculate results
  const activeResults = results.length; // All results are considered active by default
  const deletedResults = 0; // Deleted results are not tracked in current system
  const createdResults = results.length;

  // Calculate results averages
  const totalResults = results.length;
  const avgOverall =
    totalResults > 0
      ? results.reduce((sum, r) => sum + (r.overall || 0), 0) / totalResults
      : 0;
  const avgReading =
    totalResults > 0
      ? results.reduce((sum, r) => sum + (r.reading || 0), 0) / totalResults
      : 0;
  const avgWriting =
    totalResults > 0
      ? results.reduce((sum, r) => sum + (r.writing || 0), 0) / totalResults
      : 0;
  const avgSpeaking =
    totalResults > 0
      ? results.reduce((sum, r) => sum + (r.speaking || 0), 0) / totalResults
      : 0;
  const avgListening =
    totalResults > 0
      ? results.reduce((sum, r) => sum + (r.listening || 0), 0) / totalResults
      : 0;

  // Calculate links
  const activeLinks = links.filter((l) => l.usedCount < l.maxUses);
  const deletedLinks = 0; // Deleted links are not tracked in current system
  const createdLinks = links.length;
  const totalVisits = links.reduce((sum, l) => sum + (l.visitsCount || 0), 0);
  const totalUsages = links.reduce((sum, l) => sum + (l.usedCount || 0), 0);

  // Calculate templates (supervisor only)
  const activeTemplates = templates.filter((t) => t.isActive);
  const deletedTemplates = 0; // Deleted templates are not tracked in current system
  const createdTemplates = templates.length;

  // Update statistics
  const updatedStats = await UserStats.findOneAndUpdate(
    { userId },
    {
      role: user.role,
      supervisor: user.supervisor || null,
      tests: {
        created: createdTests,
        active: activeTests.length,
        deleted: deletedTests.length,
      },
      submissions: {
        active: activeSubmissions,
        created: createdSubmissions,
        deleted: deletedSubmissions,
        ungraded: ungradedSubmissions,
        graded: gradedSubmissions.length,
      },
      results: {
        active: activeResults,
        created: createdResults,
        deleted: deletedResults,
        avgScore: {
          overall: Math.round(avgOverall * 10) / 10,
          reading: Math.round(avgReading * 10) / 10,
          writing: Math.round(avgWriting * 10) / 10,
          speaking: Math.round(avgSpeaking * 10) / 10,
          listening: Math.round(avgListening * 10) / 10,
        },
      },
      links: {
        totalVisits,
        totalUsages,
        created: createdLinks,
        deleted: deletedLinks,
        active: activeLinks.length,
      },
      templates: {
        created: createdTemplates,
        deleted: deletedTemplates,
        active: activeTemplates.length,
      },
    },
    { new: true, upsert: true }
  );

  return updatedStats;
};

module.exports = {
  initializeUserStats,
  recalculateUserStats,
};
