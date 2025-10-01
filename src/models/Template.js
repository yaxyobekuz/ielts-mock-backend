const mongoose = require("mongoose");

const Template = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    banner: { ref: "Image", type: mongoose.Schema.Types.ObjectId },
    images: [
      {
        ref: "Image",
        required: true,
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    test: {
      ref: "Test",
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

module.exports = mongoose.model("Template", Template);
