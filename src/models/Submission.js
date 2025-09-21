const mongoose = require("mongoose");

const Submission = new mongoose.Schema(
  {
    finishedAt: { type: Date },
    startedAt: { type: Date, default: Date.now },
    isChecked: { type: Boolean, default: false },
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    link: { type: mongoose.Schema.Types.ObjectId, ref: "Link", required: true },
    answers: {
      reading: { default: {}, type: Object, required: true },
      writing: { default: {}, type: Object, required: true },
      listening: { default: {}, type: Object, required: true },
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
    supervisor: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", Submission);
