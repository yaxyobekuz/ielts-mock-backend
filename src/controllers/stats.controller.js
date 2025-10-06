const mongoose = require("mongoose");

// Models
const User = require("../models/User");
const Test = require("../models/Test");
const Result = require("../models/Result");
const Submission = require("../models/Submission");

// helper date range
const getDateRange = (period, from, to) => {
  const now = new Date();
  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
    case "week": {
      const start = new Date(now);
      // start of week (Sunday)
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 0 + 1);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
    case "custom":
      return { startDate: new Date(from), endDate: new Date(to) };
    default: {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
  }
};

// choose granularity and $dateToString format
const chooseGranularity = (period, startDate, endDate) => {
  const ms = endDate - startDate;
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));

  if (period === "today") return { unit: "hour", format: "%Y-%m-%dT%H:00:00Z" };
  if (period === "week") return { unit: "day", format: "%Y-%m-%d" };
  if (period === "month") return { unit: "day", format: "%Y-%m-%d" };

  // custom
  if (days <= 2) return { unit: "hour", format: "%Y-%m-%dT%H:00:00Z" };
  if (days <= 92) return { unit: "day", format: "%Y-%m-%d" };
  if (days <= 730) return { unit: "month", format: "%Y-%m" };
  return { unit: "year", format: "%Y" };
};

// add time helper
const addTime = (date, unit, amount = 1) => {
  const d = new Date(date);
  if (unit === "hour") d.setHours(d.getHours() + amount);
  if (unit === "day") d.setDate(d.getDate() + amount);
  if (unit === "month") d.setMonth(d.getMonth() + amount);
  if (unit === "year") d.setFullYear(d.getFullYear() + amount);
  return d;
};

// format bucket same way as aggregation ($dateToString with UTC)
const formatBucket = (date, unit) => {
  const d = new Date(date);
  if (unit === "hour") {
    // YYYY-MM-DDTHH:00:00Z
    return d.toISOString().slice(0, 13) + ":00:00Z";
  }
  if (unit === "day") {
    // YYYY-MM-DD
    return d.toISOString().slice(0, 10);
  }
  if (unit === "month") {
    // YYYY-MM
    return d.toISOString().slice(0, 7);
  }
  if (unit === "year") {
    return d.toISOString().slice(0, 4);
  }
  return d.toISOString();
};

// generate full bucket list for range
const generateBuckets = (startDate, endDate, unit) => {
  const buckets = [];
  let cur = new Date(startDate);

  // normalize start
  if (unit === "hour") {
    cur.setMinutes(0, 0, 0);
  } else if (unit === "day") {
    cur.setHours(0, 0, 0, 0);
  } else if (unit === "month") {
    cur.setDate(1);
    cur.setHours(0, 0, 0, 0);
  } else if (unit === "year") {
    cur.setMonth(0, 1);
    cur.setHours(0, 0, 0, 0);
  }

  while (cur <= endDate) {
    buckets.push(formatBucket(cur, unit));
    cur = addTime(cur, unit, 1);
  }

  return buckets;
};

// map agg results to simple map
const aggToMap = (arr, valueField = "count") => {
  const map = Object.create(null);
  arr.forEach((r) => {
    const key = r._id ? String(r._id) : "";
    map[key] = r[valueField] !== undefined ? r[valueField] : r.count || 0;
  });
  return map;
};

// main stats controller
const getStats = async (req, res, next) => {
  const { period = "today", from, to } = req.query;
  const user = req.user || {};
  const userId = user._id ? String(user._id) : user.id;
  const role = user.role;

  try {
    const { startDate, endDate } = getDateRange(period, from, to);
    const { unit, format } = chooseGranularity(period, startDate, endDate);

    // supervisor stats
    if (role === "supervisor") {
      // find teacher list
      const teachers = await User.find({ supervisor: userId, role: "teacher" })
        .select("_id firstName lastName")
        .lean();
      const teacherIds = teachers.map((t) => t._id);

      // summary counts
      const testsCreatedCount = await Test.countDocuments({
        createdBy: { $in: teacherIds },
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const testsDeletedCount = await Test.countDocuments({
        createdBy: { $in: teacherIds },
        isDeleted: true,
        deletedAt: { $gte: startDate, $lte: endDate },
      });

      const submissionsCount = await Submission.countDocuments({
        supervisor: new mongoose.Types.ObjectId(userId),
        startedAt: { $gte: startDate, $lte: endDate },
      });

      const resultsCount = await Result.countDocuments({
        teacher: { $in: teacherIds },
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // average score across group
      const avgRes = await Result.aggregate([
        {
          $match: {
            teacher: { $in: teacherIds },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            avgOverall: { $avg: "$overall" },
          },
        },
      ]);
      const avgScore = avgRes?.[0]?.avgOverall || 0;

      // submissions time series (for supervisor group) - group by selected bucket
      const submissionAgg = await Submission.aggregate([
        {
          $match: {
            supervisor: new mongoose.Types.ObjectId(userId),
            startedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $project: {
            bucket: {
              $dateToString: { format, date: "$startedAt", timezone: "UTC" },
            },
          },
        },
        {
          $group: {
            _id: "$bucket",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const buckets = generateBuckets(startDate, endDate, unit);
      const subMap = aggToMap(submissionAgg, "count");
      const submissionsSeries = buckets.map((b) => ({
        x: b,
        y: subMap[b] || 0,
      }));

      // teacher activity breakdown (per teacher)
      let teacherStats = [];
      if (teacherIds.length > 0) {
        // tests created per teacher
        const testsCreatedAgg = await Test.aggregate([
          {
            $match: {
              createdBy: { $in: teacherIds },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          { $group: { _id: "$createdBy", count: { $sum: 1 } } },
        ]);

        const testsDeletedAgg = await Test.aggregate([
          {
            $match: {
              createdBy: { $in: teacherIds },
              isDeleted: true,
              deletedAt: { $gte: startDate, $lte: endDate },
            },
          },
          { $group: { _id: "$createdBy", count: { $sum: 1 } } },
        ]);

        // submissions per teacher with unique students
        const submissionsAggByTeacher = await Submission.aggregate([
          {
            $match: {
              teacher: { $in: teacherIds },
              startedAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: "$teacher",
              submissionsCount: { $sum: 1 },
              students: { $addToSet: "$student" },
            },
          },
        ]);

        // finished submissions per teacher
        const finishedAggByTeacher = await Submission.aggregate([
          {
            $match: {
              teacher: { $in: teacherIds },
              finishedAt: { $gte: startDate, $lte: endDate },
            },
          },
          { $group: { _id: "$teacher", finishedCount: { $sum: 1 } } },
        ]);

        // results reviewed per teacher + avg score
        const reviewedAgg = await Result.aggregate([
          {
            $match: {
              teacher: { $in: teacherIds },
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: "$teacher",
              reviewedCount: { $sum: 1 },
              avgOverall: { $avg: "$overall" },
            },
          },
        ]);

        // maps
        const testsCreatedMap = aggToMap(testsCreatedAgg, "count");
        const testsDeletedMap = aggToMap(testsDeletedAgg, "count");
        const submissionsMap = Object.create(null);
        submissionsAggByTeacher.forEach((r) => {
          const k = String(r._id);
          submissionsMap[k] = {
            submissionsCount: r.submissionsCount || 0,
            uniqueStudents: (r.students || []).length,
          };
        });
        const finishedMap = aggToMap(finishedAggByTeacher, "finishedCount");
        const reviewedMap = Object.create(null);
        reviewedAgg.forEach((r) => {
          reviewedMap[String(r._id)] = {
            reviewedCount: r.reviewedCount || 0,
            avgOverall: r.avgOverall || 0,
          };
        });

        teacherStats = teachers.map((t) => {
          const id = String(t._id);
          const created = testsCreatedMap[id] || 0;
          const deleted = testsDeletedMap[id] || 0;
          const subInfo = submissionsMap[id] || {
            submissionsCount: 0,
            uniqueStudents: 0,
          };
          const finished = finishedMap[id] || 0;
          const reviewInfo = reviewedMap[id] || {
            reviewedCount: 0,
            avgOverall: 0,
          };
          return {
            teacherId: id,
            name: `${t.firstName || ""} ${t.lastName || ""}`.trim(),
            testsCreated: created,
            testsDeleted: deleted,
            submissionsCount: subInfo.submissionsCount,
            finishedSubmissionsCount: finished,
            uniqueStudents: subInfo.uniqueStudents,
            reviewedCount: reviewInfo.reviewedCount,
            avgScore: Number((reviewInfo.avgOverall || 0).toFixed(2)),
          };
        });
      }

      return res.json({
        code: "statsFetched",
        message: "Supervisor stats",
        summary: {
          testsCreatedCount,
          testsDeletedCount,
          submissionsCount,
          resultsCount,
          avgScore: Number(avgScore.toFixed(2)),
        },
        submissionsSeries,
        teacherStats,
        period,
        startDate,
        endDate,
      });
    }

    // teacher stats
    if (role === "teacher") {
      // summary
      const testsCreatedCount = await Test.countDocuments({
        createdBy: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const testsDeletedCount = await Test.countDocuments({
        createdBy: new mongoose.Types.ObjectId(userId),
        isDeleted: true,
        deletedAt: { $gte: startDate, $lte: endDate },
      });

      const submissionsCount = await Submission.countDocuments({
        teacher: new mongoose.Types.ObjectId(userId),
        startedAt: { $gte: startDate, $lte: endDate },
      });

      const finishedCount = await Submission.countDocuments({
        teacher: new mongoose.Types.ObjectId(userId),
        finishedAt: { $gte: startDate, $lte: endDate },
      });

      const reviewedCount = await Result.countDocuments({
        teacher: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const avgRes = await Result.aggregate([
        {
          $match: {
            teacher: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            avgOverall: { $avg: "$overall" },
          },
        },
      ]);
      const avgScore = avgRes?.[0]?.avgOverall || 0;

      // time series for submissions by this teacher
      const submissionAgg = await Submission.aggregate([
        {
          $match: {
            teacher: new mongoose.Types.ObjectId(userId),
            startedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $project: {
            bucket: {
              $dateToString: { format, date: "$startedAt", timezone: "UTC" },
            },
          },
        },
        {
          $group: {
            _id: "$bucket",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const buckets = generateBuckets(startDate, endDate, unit);
      const subMap = aggToMap(submissionAgg, "count");
      const submissionsSeries = buckets.map((b) => ({
        x: b,
        y: subMap[b] || 0,
      }));

      return res.json({
        code: "statsFetched",
        message: "Teacher stats",
        summary: {
          testsCreatedCount,
          testsDeletedCount,
          submissionsCount,
          finishedCount,
          reviewedCount,
          avgScore: Number(avgScore.toFixed(2)),
        },
        submissionsSeries,
        period,
        startDate,
        endDate,
      });
    }

    // other roles not implemented
    return res.status(403).json({
      code: "notImplemented",
      message: "Stats for this role not implemented",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
