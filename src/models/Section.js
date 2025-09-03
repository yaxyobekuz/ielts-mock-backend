const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({ text: { type: String } });

const GroupSchema = new mongoose.Schema({
  answers: [AnswerSchema],
  question: { type: String, required: true },
  correctAnswerIndex: { type: Number, required: true },
});

const OptionSchema = new mongoose.Schema({
  option: { type: String, required: true },
});

const Section = new mongoose.Schema(
  {
    // Base
    description: { type: String },
    title: { type: String, required: true },
    questionsCount: { type: Number, default: 0, required: true },
    type: {
      type: String,
      required: true,
      enum: ["text", "text-draggable", "flowchart", "radio-group"],
    },

    // text
    text: { type: String },
    answers: [AnswerSchema],

    // radio-group
    groups: [GroupSchema],

    // text-draggable & flowchart
    options: { title: { type: String }, data: [OptionSchema] },

    // flowchart
    items: { title: { type: String }, data: [{ text: { type: String } }] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Section", Section);
