const mongoose = require("mongoose");

/**
 * General statistics model for supervisor and teacher
 * Created once per user and stores lifetime cumulative data
 */
const UserStats = new mongoose.Schema(
  {
    // User reference (unique per user)
    userId: {
      ref: "User",
      unique: true,
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },

    // User role snapshot
    role: {
      type: String,
      required: true,
      enum: ["teacher", "supervisor"],
    },

    // Supervisor reference (for teachers)
    supervisor: {
      ref: "User",
      type: mongoose.Schema.Types.ObjectId,
    },

    // Test Statistics
    tests: {
      total: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      deleted: { type: Number, default: 0 },
    },

    // Submission Statistics
    submissions: {
      total: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      graded: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      deleted: { type: Number, default: 0 },
      ungraded: { type: Number, default: 0 },
    },

    // Result Statistics
    results: {
      total: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      deleted: { type: Number, default: 0 },
      avgScore: {
        overall: { type: Number, default: 0, min: 0, max: 9 },
        reading: { type: Number, default: 0, min: 0, max: 9 },
        writing: { type: Number, default: 0, min: 0, max: 9 },
        speaking: { type: Number, default: 0, min: 0, max: 9 },
        listening: { type: Number, default: 0, min: 0, max: 9 },
      },
    },

    // Link Statistics
    links: {
      total: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      deleted: { type: Number, default: 0 },
      totalVisits: { type: Number, default: 0 },
      totalUsages: { type: Number, default: 0 },
    },

    // Template Statistics
    templates: {
      total: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      deleted: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

UserStats.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("UserStats", UserStats);
