const mongoose = require("mongoose");

const Link = new mongoose.Schema(
  {
    title: { type: String, required: true },
    usedCount: { type: Number, default: 0 },
    testId: { type: String, required: true },
    visitsCount: { type: Number, default: 0 },
    requireComment: { type: Boolean, default: true, required: true },
    maxUses: { type: Number, required: true, default: 10, max: 200 },
    createdBy: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    supervisor: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    usages: [
      {
        ip: String,
        userAgent: String,
        userId: mongoose.Schema.Types.ObjectId,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    visits: [
      {
        ip: String,
        userAgent: String,
        userId: mongoose.Schema.Types.ObjectId,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", Link);
