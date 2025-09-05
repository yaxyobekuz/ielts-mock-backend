const mongoose = require("mongoose");

const Answer = new mongoose.Schema({ text: { type: String } });

const Group = new mongoose.Schema({
  answers: [Answer],
  question: { type: String, required: true },
  correctAnswerIndex: { type: Number, required: true },
});

const Option = new mongoose.Schema({
  option: { type: String, required: true },
});

const Section = new mongoose.Schema(
  {
    // Base
    description: { type: String },
    title: { type: String, required: true },
    module: { type: String, required: true },
    partId: { type: String, required: true },
    testId: { type: String, required: true },
    questionsCount: { type: Number, default: 0, required: true },
    type: {
      type: String,
      required: true,
      enum: ["text", "text-draggable", "flowchart", "radio-group"],
    },

    // text
    text: { type: String },
    answers: [Answer],

    // radio-group
    groups: [Group],

    // text-draggable & flowchart
    options: { title: { type: String }, data: [Option] },

    // flowchart
    items: { title: { type: String }, data: [{ text: { type: String } }] },

    createdBy: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Section", Section);
