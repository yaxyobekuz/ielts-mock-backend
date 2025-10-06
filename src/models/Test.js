const mongoose = require("mongoose");

const Test = new mongoose.Schema(
  {
    image: { type: String },
    description: { type: String },
    title: { type: String, required: true },

    copyCount: { type: Number, default: 0 },
    isCopied: { type: Boolean, default: false },

    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },

    totalParts: { type: Number, required: true, default: 0 },
    originalTest: { ref: "Test", type: mongoose.Schema.Types.ObjectId },

    reading: {
      partsCount: { type: Number, required: true, default: 0 },
      duration: { type: Number, default: 60, min: 5, max: 180 },
      parts: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
    },

    writing: {
      partsCount: { type: Number, required: true, default: 0 },
      duration: { type: Number, default: 60, min: 5, max: 180 },
      parts: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
    },

    listening: {
      partsCount: { type: Number, required: true, default: 0 },
      duration: { type: Number, default: 60, min: 5, max: 180 },
      parts: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
      audios: [{ ref: "Audio", type: mongoose.Schema.Types.ObjectId }],
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
