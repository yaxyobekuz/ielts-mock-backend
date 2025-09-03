const mongoose = require("mongoose");

const TestSchema = new mongoose.Schema(
  {
    image: { type: String },
    description: { type: String },
    title: { type: String, required: true },
    reading: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
    writing: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
    listening: [{ ref: "Part", type: mongoose.Schema.Types.ObjectId }],
    createdBy: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", TestSchema);
