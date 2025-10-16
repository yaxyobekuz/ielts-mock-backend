const mongoose = require("mongoose");

const TgUser = new mongoose.Schema(
  {
    phone: { type: Number },
    state: { type: String },
    chatId: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TgUser", TgUser);
