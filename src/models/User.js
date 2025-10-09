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
    avatar: { type: mongoose.Schema.Types.ObjectId, ref: "Image" },
    supervisor: { ref: "User", type: mongoose.Schema.Types.ObjectId },
    role: {
      type: String,
      default: "student",
      enum: ["student", "teacher", "supervisor", "admin", "owner"],
    },
  },
  { timestamps: true }
);

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

User.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await hashPassword(this.password);
  next();
});

const updateHooks = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findByIdAndUpdate",
];

updateHooks.forEach((hook) => {
  User.pre(hook, async function (next) {
    const update = this.getUpdate();
    if (update && update.password) {
      update.password = await hashPassword(update.password);
      this.setUpdate(update);
    }
    next();
  });
});

User.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", User);
