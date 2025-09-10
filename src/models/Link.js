const mongoose = require("mongoose");

const Link = new mongoose.Schema(
  {
    title: { type: String, required: true },
    usedCount: { type: Number, default: 0 },
    testId: { type: String, required: true },
    visitsCount: { type: Number, default: 0 },
    maxUses: { type: Number, required: true, default: 10 },
    createdBy: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    usages: [
      {
        ip: String,
        age: Number,
        name: String,
        phone: String,
        userAgent: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    visits: [
      {
        ip: String,
        userAgent: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", Link);
