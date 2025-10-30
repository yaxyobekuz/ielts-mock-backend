// Agenda (job scheduler)
const agenda = require("../config/agenda");

// Models
const Stats = require("../models/Stats");
const UserStats = require("../models/UserStats");

/**
 * Job: Update UserStats (lifetime cumulative)
 */
agenda.define("update-user-stats", async (job) => {
  const { user, updateData, teacherId } = job.attrs.data;

  try {
    const updateStats = async (userId) => {
      // Check if updating avgScore fields
      const hasAvgScoreUpdate = Object.keys(updateData).some((key) =>
        key.startsWith("results.avgScore")
      );

      if (hasAvgScoreUpdate) {
        // Calculate new average score
        const userStats = await UserStats.findOne({ userId });
        if (userStats) {
          const totalResults = userStats.results.active;
          const newResultsCount =
            totalResults + (updateData["results.active"] || 0);

          // Recalculate averages
          const modules = [
            "overall",
            "reading",
            "writing",
            "speaking",
            "listening",
          ];
          const avgScoreUpdates = {};

          modules.forEach((module) => {
            const key = `results.avgScore.${module}`;
            const newScore = updateData[key];

            if (newScore !== undefined) {
              const currentAvg = userStats.results.avgScore[module] || 0;
              const newAvg =
                (currentAvg * totalResults + newScore) / newResultsCount;
              avgScoreUpdates[key] = parseFloat(newAvg.toFixed(2));
            }
          });

          // Remove avgScore from updateData and merge with calculated averages
          const filteredUpdate = { ...updateData };
          Object.keys(filteredUpdate).forEach((key) => {
            if (key.startsWith("results.avgScore")) {
              delete filteredUpdate[key];
            }
          });

          await UserStats.findOneAndUpdate(
            { userId },
            { $inc: filteredUpdate, $set: avgScoreUpdates },
            { upsert: true }
          );
          return;
        }
      }

      // Regular update
      await UserStats.findOneAndUpdate(
        { userId },
        { $inc: updateData },
        { upsert: true }
      );
    };

    // Teacher
    if (user.role === "teacher") {
      await updateStats(user._id);
      if (user.supervisor) await updateStats(user.supervisor);
    }

    // Supervisor
    else {
      await updateStats(user._id);
      if (teacherId && teacherId !== user._id) {
        await updateStats(teacherId);
      }
    }
  } catch (error) {
    console.error(`UserStats update xatolik (userId: ${user._id}):`, error);
  }
});

/**
 * Job: Update Stats (daily)
 */
agenda.define("update-stats", async (job) => {
  const { user, updateData, teacherId } = job.attrs.data;

  try {
    const updateStats = async (userId, isSupervisor = false) => {
      // Get today's date at midnight UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Check if all values are zero
      const hasNonZeroValue = Object.values(updateData).some((value) => {
        if (typeof value === "object") {
          return Object.values(value).some((v) => v !== 0);
        }
        return value !== 0;
      });

      // Skip if all values are zero
      if (!hasNonZeroValue) return;

      // Check if updating average scores
      const hasAvgScoreUpdate = Object.keys(updateData).some((key) =>
        key.startsWith("results.avg")
      );

      if (hasAvgScoreUpdate) {
        // Calculate new average for the day
        const stats = await Stats.findOne({ userId, date: today });

        if (stats) {
          const totalResults = stats.results.created || 0;
          const newResultsCount =
            totalResults + (updateData["results.created"] || 0);

          // Recalculate daily averages
          const modules = {
            "results.avgOverall": "avgOverall",
            "results.avgReading": "avgReading",
            "results.avgWriting": "avgWriting",
            "results.avgSpeaking": "avgSpeaking",
            "results.avgListening": "avgListening",
          };

          const avgScoreUpdates = {};
          Object.entries(modules).forEach(([key, field]) => {
            const newScore = updateData[key];

            if (newScore !== undefined) {
              const currentAvg = stats.results[field] || 0;
              const newAvg =
                (currentAvg * totalResults + newScore) / newResultsCount;
              avgScoreUpdates[key] = parseFloat(newAvg.toFixed(2));
            }
          });

          // Remove avg from updateData and merge with calculated averages
          const filteredUpdate = { ...updateData };
          Object.keys(filteredUpdate).forEach((key) => {
            if (key.startsWith("results.avg")) {
              delete filteredUpdate[key];
            }
          });

          await Stats.findOneAndUpdate(
            { userId, date: today },
            {
              $inc: filteredUpdate,
              supervisor: user.supervisor || null,
              role: isSupervisor ? "supervisor" : "teacher",
              $set: { ...avgScoreUpdates, "metadata.lastUpdated": Date.now() },
            },
            { upsert: true }
          );
          return;
        }
      }

      // Regular update
      await Stats.findOneAndUpdate(
        { userId, date: today },
        {
          $inc: updateData,
          supervisor: user.supervisor || null,
          $set: { "metadata.lastUpdated": Date.now() },
          role: isSupervisor ? "supervisor" : "teacher",
        },
        { upsert: true, new: true }
      );
    };

    // Teacher
    if (user.role === "teacher") {
      await updateStats(user._id);
      if (user.supervisor) {
        await updateStats(user.supervisor, true);
      }
    }

    // Supervisor
    else {
      await updateStats(user._id, true);
      if (teacherId && teacherId !== user._id) {
        await updateStats(teacherId);
      }
    }
  } catch (error) {
    console.error(`Stats update xatolik (userId: ${user._id}):`, error);
  }
});
