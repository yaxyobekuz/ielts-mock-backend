const mongoose = require("mongoose");

const Test = new mongoose.Schema(
  {
    image: { type: String },
    description: { type: String },
    title: { type: String, required: true },
    totalParts: { type: Number, required: true, default: 0 },
    reading: {
      partsCount: { type: Number, required: true, default: 0 },
      parts: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
    },
    writing: {
      partsCount: { type: Number, required: true, default: 0 },
      parts: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
    },
    listening: {
      partsCount: { type: Number, required: true, default: 0 },
      parts: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
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

module.exports = mongoose.model("Test", Test);
