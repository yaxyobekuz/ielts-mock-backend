const mongoose = require("mongoose");

// Daily stats model
const Stats = new mongoose.Schema(
  {
    // User reference
    userId: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },

    // User role snapshot (for historical accuracy)
    role: {
      type: String,
      required: true,
      enum: ["teacher", "supervisor"],
    },

    // Supervisor reference (for access control)
    supervisor: { ref: "User", type: mongoose.Schema.Types.ObjectId },

    // Date for this stats entry (midnight UTC)
    date: { type: Date, required: true, index: true },

    // Test Statistics
    tests: {
      created: { type: Number, default: 0 },
      deleted: { type: Number, default: 0 },
    },

    // Submission Statistics
    submissions: {
      graded: { type: Number, default: 0 }, // isScored = true
      created: { type: Number, default: 0 },
    },

    // Result Statistics
    results: {
      created: { type: Number, default: 0 },
      avgOverall: { type: Number, default: 0, min: 0, max: 9 },
      avgReading: { type: Number, default: 0, min: 0, max: 9 },
      avgWriting: { type: Number, default: 0, min: 0, max: 9 },
      avgSpeaking: { type: Number, default: 0, min: 0, max: 9 },
      avgListening: { type: Number, default: 0, min: 0, max: 9 },
    },

    // Link Statistics
    links: {
      active: { type: Number, default: 0 }, // usedCount < maxUses
      created: { type: Number, default: 0 },
      totalVisits: { type: Number, default: 0 },
      totalUsages: { type: Number, default: 0 },
      avgUsageRate: { type: Number, default: 0 }, // usages / maxUses
      avgVisitRate: { type: Number, default: 0 }, // visits per link
    },

    // Metadata
    metadata: {
      collectionDuration: { type: Number }, // ms taken to collect
      lastUpdated: { type: Date, default: Date.now },
      isBackfilled: { type: Boolean, default: false }, // True if from migration
    },
  },
  {
    timestamps: true,
    indexes: [
      { role: 1, date: -1 },
      { userId: 1, date: -1 },
      { supervisor: 1, date: -1 },
      { userId: 1, date: 1, unique: true }, // Prevent duplicate stats for same user and date
    ],
  }
);

module.exports = mongoose.model("Stats", Stats);
