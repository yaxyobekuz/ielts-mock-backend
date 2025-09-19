const mongoose = require("mongoose");

const Submission = new mongoose.Schema(
  {
    finishedAt: { type: Date },
    startedAt: { type: Date, default: Date.now },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    link: { type: mongoose.Schema.Types.ObjectId, ref: "Link", required: true },
    answers: {
      reading: { default: {}, type: Map, of: String, required: true },
      writing: { default: {}, type: Map, of: String, required: true },
      listening: { default: {}, type: Map, of: String, required: true },
    },
    user: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    teacher: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", Submission);
