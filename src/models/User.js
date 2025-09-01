const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const User = new mongoose.Schema(
  {
    chatId: { type: Number },
    lastName: { type: String },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    phone: { type: Number, required: true, unique: true },
    avatar: { type: mongoose.Schema.Types.ObjectId, ref: "Photo" },
    role: {
      type: String,
      default: "student",
      enum: ["student", "teacher", "supervisor", "admin", "owner"],
    },
  },
  { timestamps: true }
);

User.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

User.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", User);
