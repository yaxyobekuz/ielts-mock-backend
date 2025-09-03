const mongoose = require("mongoose");

const Part = new mongoose.Schema(
  {
    description: { type: String },
    number: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
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
