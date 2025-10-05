const mongoose = require("mongoose");

const Audio = new mongoose.Schema(
  {
    url: { type: String, required: true },
    size: { type: Number, required: true },
    name: { type: String, required: true },
    mimetype: { type: String, required: true },
    createdBy: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Audio", Audio);
