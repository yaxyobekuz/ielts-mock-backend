const mongoose = require("mongoose");

const NumberSchema = {
  min: 0,
  max: 9,
  default: 0,
  type: Number,
  required: true,
};

const Result = new mongoose.Schema(
  {
    overall: NumberSchema,
    reading: NumberSchema,
    writing: NumberSchema,
    speaking: NumberSchema,
    listening: NumberSchema,
    server: {
      overall: NumberSchema,
      reading: NumberSchema,
      writing: NumberSchema,
      speaking: NumberSchema,
      listening: NumberSchema,
    },
    test: { ref: "Test", required: true, type: mongoose.Schema.Types.ObjectId },
    link: { ref: "Link", required: true, type: mongoose.Schema.Types.ObjectId },
    writingCriteria: {
      task1: {
        taskAchievement: NumberSchema,
        lexicalResource: NumberSchema,
        coherenceAndCohesion: NumberSchema,
        grammaticalRangeAndAccuracy: NumberSchema,
      },
      task2: {
        taskResponse: NumberSchema,
        lexicalResource: NumberSchema,
        coherenceAndCohesion: NumberSchema,
        grammaticalRangeAndAccuracy: NumberSchema,
      },
    },
    speakingCriteria: {
      pronunciation: NumberSchema,
      lexicalResource: NumberSchema,
      fluencyAndCoherence: NumberSchema,
      grammaticalRangeAndAccuracy: NumberSchema,
    },
    submission: {
      required: true,
      ref: "Submission",
      type: mongoose.Schema.Types.ObjectId,
    },
    student: {
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
    createdBy: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", Result);
