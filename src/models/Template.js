const mongoose = require("mongoose");

const Template = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    banner: { ref: "Image", type: mongoose.Schema.Types.ObjectId },

    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { ref: "User", type: mongoose.Schema.Types.ObjectId },

    type: {
      type: String,
      required: true,
      default: "teacher",
      enum: ["custom", "prediction", "cambridge"],
    },
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
