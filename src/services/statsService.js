// Models
const Test = require("../models/Test");
const Link = require("../models/Link");
const User = require("../models/User");
const Stats = require("../models/Stats");
const Result = require("../models/Result");
const Submission = require("../models/Submission");

/**
 * Collects statistics for a given user and date
 * @param {ObjectId} userId - User ID
 * @param {Date} date - Statistics date (UTC midnight)
 * @returns {Object} - Collected statistics
 */
const collectStatsForUser = async (userId, date) => {
  const startTime = Date.now();
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  // Get user information
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  const isTeacher = user.role === "teacher";

  const stats = {
    userId,
    tests: {},
    links: {},
    results: {},
    metadata: {},
    role: user.role,
    submissions: {},
    date: startOfDay,
    supervisor: user.supervisor,
  };

  // Get models
  const [allTests, allLinks, allResults, allSubmissions] = await Promise.all([
    Test.find({
      [isTeacher ? "createdBy" : "supervisor"]: userId,
      $or: [
        { createdAt: { $gte: startOfDay, $lt: endOfDay } },
        { isDeleted: true, deletedAt: { $gte: startOfDay, $lt: endOfDay } },
      ],
    })
      .select("isDeleted createdAt deletedAt")
      .lean(),
    Link.find({
      [isTeacher ? "createdBy" : "supervisor"]: userId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    })
      .select("usedCount maxUses visitsCount")
      .lean(),
    Result.find({
      [isTeacher ? "teacher" : "supervisor"]: userId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    })
      .select("overall reading writing speaking listening")
      .lean(),
    Submission.find({
      [isTeacher ? "teacher" : "supervisor"]: userId,
      $or: [
        { createdAt: { $gte: startOfDay, $lt: endOfDay } },
        { isScored: true, scoredAt: { $gte: startOfDay, $lt: endOfDay } },
      ],
    })
      .select("isScored createdAt scoredAt")
      .lean(),
  ]);

  // Test statistics
  const createdTests = allTests.filter(
    (t) => t.createdAt >= startOfDay && t.createdAt < endOfDay
  );
  const deletedTests = allTests.filter(
    (t) => t.isDeleted && t.deletedAt >= startOfDay && t.deletedAt < endOfDay
  );
  stats.tests = {
    created: createdTests.length,
    deleted: deletedTests.length,
  };

  // Submission statistics
  const gradedSubmissions = allSubmissions.filter(
    (s) => s.isScored && s.scoredAt >= startOfDay && s.scoredAt < endOfDay
  );
  const createdSubmissions = allSubmissions.filter(
    (s) => s.createdAt >= startOfDay && s.createdAt < endOfDay
  );
  stats.submissions = {
    graded: gradedSubmissions.length,
    created: createdSubmissions.length,
  };

  // Result statistics
  const avgOverall =
    allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.overall, 0) / allResults.length
      : 0;
  const avgReading =
    allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.reading, 0) / allResults.length
      : 0;
  const avgWriting =
    allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.writing, 0) / allResults.length
      : 0;
  const avgSpeaking =
    allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.speaking, 0) / allResults.length
      : 0;
  const avgListening =
    allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.listening, 0) / allResults.length
      : 0;

  stats.results = {
    created: allResults.length,
    avgOverall: parseFloat(avgOverall.toFixed(2)),
    avgReading: parseFloat(avgReading.toFixed(2)),
    avgWriting: parseFloat(avgWriting.toFixed(2)),
    avgSpeaking: parseFloat(avgSpeaking.toFixed(2)),
    avgListening: parseFloat(avgListening.toFixed(2)),
  };

  // Link statistics
  const activeLinks = allLinks.filter((l) => l.usedCount < l.maxUses);
  const totalUsages = allLinks.reduce((sum, l) => sum + l.usedCount, 0);
  const totalVisits = allLinks.reduce((sum, l) => sum + l.visitsCount, 0);
  const avgVisitRate = allLinks.length > 0 ? totalVisits / allLinks.length : 0;

  const avgUsageRate =
    allLinks.length > 0
      ? allLinks.reduce((sum, l) => sum + l.usedCount / l.maxUses, 0) /
        allLinks.length
      : 0;

  stats.links = {
    totalVisits,
    totalUsages,
    created: allLinks.length,
    active: activeLinks.length,
    avgUsageRate: parseFloat(avgUsageRate.toFixed(2)),
    avgVisitRate: parseFloat(avgVisitRate.toFixed(2)),
  };

  // Metadata
  const collectionDuration = Date.now() - startTime;
  stats.metadata = {
    collectionDuration,
    isBackfilled: false,
    lastUpdated: new Date(),
  };

  return stats;
};

/**
 * Collects statistics for all supervisor and teachers
 * @param {Date} date - Statistics date (UTC midnight)
 * @returns {Array} - Created statistics
 */
const collectAllStats = async (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  // Get all supervisor and teacher users
  const eligibleUsers = await User.find({
    isActive: true,
    isVerified: true,
    role: { $in: ["teacher", "supervisor"] },
  });

  console.log(`📊 Collecting statistics for ${eligibleUsers.length} users...`);

  // Sequential collection to prevent race conditions
  const results = [];
  for (const user of eligibleUsers) {
    try {
      const stats = await collectStatsForUser(user._id, startOfDay);

      // Use findOneAndUpdate with upsert to prevent duplicate creation
      const result = await Stats.findOneAndUpdate(
        { userId: user._id, date: startOfDay },
        { $set: stats },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(
        `✅ ${user.firstName} - statistics ${result ? "updated" : "created"}`
      );
      results.push(result);
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - entry already exists, skip
        console.log(
          `⚠️  ${user.firstName} - statistics already exist, skipping`
        );
      } else {
        console.error(`❌ ${user.firstName} - error:`, error.message);
      }
    }
  }

  return results;
};

/**
 * Backfill historical statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Created statistics
 */
const backfillStats = async (startDate, endDate = new Date()) => {
  const results = [];
  const currentDate = new Date(startDate);
  currentDate.setUTCHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  console.log(
    `🔄 Historical statistics backfill started: from ${currentDate.toISOString()} to ${end.toISOString()}`
  );

  while (currentDate <= end) {
    console.log(`\n📅 Date: ${currentDate.toISOString().split("T")[0]}`);
    const dayStats = await collectAllStats(new Date(currentDate));
    results.push(...dayStats);

    // Move to next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  console.log(`\n✅ Total ${results.length} statistics backfilled`);
  return results;
};

module.exports = {
  backfillStats,
  collectAllStats,
  collectStatsForUser,
};
