const mongoose = require("mongoose");

const Part = new mongoose.Schema(
  {
    description: { type: String },
    number: { type: Number, required: true },
    module: { type: String, required: true },
    testId: { type: String, required: true },
    totalQuestions: { type: Number, required: true, default: 0 },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
    createdBy: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Part", Part);
