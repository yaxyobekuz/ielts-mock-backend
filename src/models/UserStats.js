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
      active: { type: Number, default: 0, required: true },
      created: { type: Number, default: 0, required: true },
      deleted: { type: Number, default: 0, required: true },
    },

    // Submission Statistics
    submissions: {
      active: { type: Number, default: 0, required: true },
      graded: { type: Number, default: 0, required: true },
      created: { type: Number, default: 0, required: true },
      deleted: { type: Number, default: 0, required: true },
      ungraded: { type: Number, default: 0, required: true },
    },

    // Result Statistics
    results: {
      active: { type: Number, default: 0, required: true },
      created: { type: Number, default: 0, required: true },
      deleted: { type: Number, default: 0, required: true },
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
      active: { type: Number, default: 0, required: true },
      created: { type: Number, default: 0, required: true },
      deleted: { type: Number, default: 0, required: true },
      totalVisits: { type: Number, default: 0, required: true },
      totalUsages: { type: Number, default: 0, required: true },
    },

    // Template Statistics
    templates: {
      active: { type: Number, default: 0, required: true },
      created: { type: Number, default: 0, required: true },
      deleted: { type: Number, default: 0, required: true },
    },
  },
  { timestamps: true }
);

UserStats.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("UserStats", UserStats);
