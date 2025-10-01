const mongoose = require("mongoose");

const Part = new mongoose.Schema(
  {
    text: { type: String },
    description: { type: String },
    number: { type: Number, required: true },
    module: { type: String, required: true },
    totalQuestions: { type: Number, required: true, default: 0 },
    testId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Part", Part);
