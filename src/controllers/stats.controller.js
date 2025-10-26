const Stats = require("../models/Stats");

/**
 * Get dashboard statistics for last 7 days
 */
const getDashboardStats = async (req, res, next) => {
  const endDate = new Date();
  const startDate = new Date();
  const { _id: userId, role } = req.user;
  startDate.setDate(startDate.getDate() - 7);

  try {
    const filter = { date: { $gte: startDate, $lte: endDate } };

    // Add userId to the filter based on role
    if (role === "supervisor") filter.supervisor = userId;
    else if (role === "teacher") filter.userId = userId;
    else filter.userId = userId;

    const stats = await Stats.find(filter)
      .select("date tests submissions links")
      .sort({ date: 1 })
      .lean();

    if (stats.length === 0) {
      return res.status(200).json({
        code: "noData",
        data: { summary: {}, charts: {} },
        message: "Statistika ma'lumotlari topilmadi",
      });
    }

    let totalActiveLinks = 0;
    let totalTestsCreated = 0;
    let totalSubmissionsGraded = 0;
    let totalSubmissionsCreated = 0;

    const chartData = stats.map((stat) => {
      const activeLinks = stat.links?.active || 0;
      const testsCreated = stat.tests?.created || 0;
      const submissionsGraded = stat.submissions?.graded || 0;
      const submissionsCreated = stat.submissions?.created || 0;

      totalActiveLinks += activeLinks;
      totalTestsCreated += testsCreated;
      totalSubmissionsGraded += submissionsGraded;
      totalSubmissionsCreated += submissionsCreated;

      const dateKey = stat.date.toISOString().split("T")[0];

      return {
        activeLinks,
        testsCreated,
        date: dateKey,
        submissionsGraded,
        submissionsCreated,
      };
    });

    const charts = {
      testsCreated: chartData.map((d) => ({
        x: d.date,
        y: d.testsCreated,
      })),
      submissionsCreated: chartData.map((d) => ({
        x: d.date,
        y: d.submissionsCreated,
      })),
      submissionsGraded: chartData.map((d) => ({
        x: d.date,
        y: d.submissionsGraded,
      })),
    };

    res.status(200).json({
      code: "dashboardStatsFetched",
      message: "Dashboard statistikasi yuklandi",
      data: {
        charts,
        summary: {
          activeLinks: totalActiveLinks,
          testsCreated: totalTestsCreated,
          submissionsGraded: totalSubmissionsGraded,
          submissionsCreated: totalSubmissionsCreated,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed statistics with aggregations
 */
const getDetailedStats = async (req, res, next) => {
  const { startDate: startParam, endDate: endParam } = req.query;

  const { _id: userId, role } = req.user;
  const endDate = endParam ? new Date(endParam) : new Date();
  const startDate = startParam ? new Date(startParam) : new Date();

  if (!startParam) {
    startDate.setDate(startDate.getDate() - 7);
  }

  try {
    const filter = { date: { $gte: startDate, $lte: endDate } };

    // Add userId to the filter based on role
    if (role === "supervisor") filter.supervisor = userId;
    else if (role === "teacher") filter.userId = userId;
    else filter.userId = userId;

    const stats = await Stats.find(filter)
      .select("date tests submissions results links")
      .sort({ date: 1 })
      .lean();

    if (stats.length === 0) {
      return res.status(200).json({
        code: "noData",
        data: { summary: {}, charts: {} },
        message: "Tanlangan davr uchun statistika topilmadi",
      });
    }

    const periodData = stats.map((stat) => {
      const dateKey = stat.date.toISOString().split("T")[0];
      return {
        period: dateKey,
        tests: {
          created: stat.tests?.created || 0,
          deleted: stat.tests?.deleted || 0,
        },
        submissions: {
          created: stat.submissions?.created || 0,
          graded: stat.submissions?.graded || 0,
        },
        results: {
          created: stat.results?.created || 0,
          avgOverall: stat.results?.avgOverall || 0,
          avgReading: stat.results?.avgReading || 0,
          avgWriting: stat.results?.avgWriting || 0,
          avgListening: stat.results?.avgListening || 0,
          avgSpeaking: stat.results?.avgSpeaking || 0,
        },
        links: {
          active: stat.links?.active || 0,
          created: stat.links?.created || 0,
          visits: stat.links?.totalVisits || 0,
          usages: stat.links?.totalUsages || 0,
        },
      };
    });

    const summary = periodData.reduce(
      (acc, curr) => ({
        tests: {
          created: acc.tests.created + curr.tests.created,
          deleted: acc.tests.deleted + curr.tests.deleted,
        },
        submissions: {
          created: acc.submissions.created + curr.submissions.created,
          graded: acc.submissions.graded + curr.submissions.graded,
        },
        results: {
          created: acc.results.created + curr.results.created,
          avgOverall:
            acc.results.avgOverall + curr.results.avgOverall / stats.length,
          avgReading:
            acc.results.avgReading + curr.results.avgReading / stats.length,
          avgWriting:
            acc.results.avgWriting + curr.results.avgWriting / stats.length,
          avgListening:
            acc.results.avgListening + curr.results.avgListening / stats.length,
          avgSpeaking:
            acc.results.avgSpeaking + curr.results.avgSpeaking / stats.length,
        },
        links: {
          created: acc.links.created + curr.links.created,
          visits: acc.links.visits + curr.links.visits,
          usages: acc.links.usages + curr.links.usages,
        },
      }),
      {
        tests: { created: 0, deleted: 0 },
        submissions: { created: 0, graded: 0 },
        results: {
          created: 0,
          avgOverall: 0,
          avgReading: 0,
          avgWriting: 0,
          avgListening: 0,
          avgSpeaking: 0,
        },
        links: { created: 0, visits: 0, usages: 0 },
      }
    );

    summary.results.avgOverall = parseFloat(
      summary.results.avgOverall.toFixed(2)
    );
    summary.results.avgReading = parseFloat(
      summary.results.avgReading.toFixed(2)
    );
    summary.results.avgWriting = parseFloat(
      summary.results.avgWriting.toFixed(2)
    );
    summary.results.avgListening = parseFloat(
      summary.results.avgListening.toFixed(2)
    );
    summary.results.avgSpeaking = parseFloat(
      summary.results.avgSpeaking.toFixed(2)
    );

    const charts = {
      tests: {
        created: periodData.map((p) => ({ x: p.period, y: p.tests.created })),
        deleted: periodData.map((p) => ({ x: p.period, y: p.tests.deleted })),
      },
      submissions: {
        created: periodData.map((p) => ({
          x: p.period,
          y: p.submissions.created,
        })),
        graded: periodData.map((p) => ({
          x: p.period,
          y: p.submissions.graded,
        })),
      },
      results: {
        avgOverall: periodData.map((p) => ({
          x: p.period,
          y: p.results.avgOverall,
        })),
        avgReading: periodData.map((p) => ({
          x: p.period,
          y: p.results.avgReading,
        })),
        avgWriting: periodData.map((p) => ({
          x: p.period,
          y: p.results.avgWriting,
        })),
        avgListening: periodData.map((p) => ({
          x: p.period,
          y: p.results.avgListening,
        })),
        avgSpeaking: periodData.map((p) => ({
          x: p.period,
          y: p.results.avgSpeaking,
        })),
      },
      links: {
        active: periodData.map((p) => ({ x: p.period, y: p.links.active })),
        visits: periodData.map((p) => ({ x: p.period, y: p.links.visits })),
        usages: periodData.map((p) => ({ x: p.period, y: p.links.usages })),
      },
    };

    res.status(200).json({
      code: "detailedStatsFetched",
      message: "Batafsil statistika yuklandi",
      data: {
        charts,
        summary,
        dateRange: {
          end: endDate.toISOString().split("T")[0],
          start: startDate.toISOString().split("T")[0],
          days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getDetailedStats };
