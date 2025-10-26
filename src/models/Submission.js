const mongoose = require("mongoose");

const Submission = new mongoose.Schema(
  {
    finishedAt: { type: Date },
    startedAt: { type: Date, default: Date.now },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    link: { type: mongoose.Schema.Types.ObjectId, ref: "Link", required: true },

    // Result
    scoredAt: { type: Date, default: null },
    isScored: { type: Boolean, default: false },
    scoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Result",
      default: null,
    },

    // Answers
    answers: {
      reading: { default: {}, type: Object, required: true },
      writing: { default: {}, type: Object, required: true },
      listening: { default: {}, type: Object, required: true },
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", Submission);
