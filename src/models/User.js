const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    // For teacher
    canEditTest: { type: Boolean, default: false },
    canDeleteTest: { type: Boolean, default: false },
    canCreateTest: { type: Boolean, default: false },

    canEditLink: { type: Boolean, default: false },
    canCreateLink: { type: Boolean, default: false },
    canDeleteLink: { type: Boolean, default: false },

    canEditResult: { type: Boolean, default: false },
    canCreateResult: { type: Boolean, default: false },
    canDeleteResult: { type: Boolean, default: false },

    canUseTemplate: { type: Boolean, default: false },
    canEditTemplate: { type: Boolean, default: false },
    canCreateTemplate: { type: Boolean, default: false },
    canDeleteTemplate: { type: Boolean, default: false },
  },
  { _id: false }
);

const User = new mongoose.Schema(
  {
    bio: { type: String },
    chatId: { type: Number },
    lastName: { type: String },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    permissions: { type: permissionSchema, default: {} },
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
  // Permissions
  if (this.isNew) {
    if (this.role === "teacher") {
      this.permissions = {
        canEditTest: true,
        canDeleteTest: false,
        canCreateTest: true,

        canEditLink: false,
        canCreateLink: false,
        canDeleteLink: false,

        canEditResult: true,
        canCreateResult: true,
        canDeleteResult: false,

        canUseTemplate: true,
        canEditTemplate: true,
        canCreateTemplate: true,
        canDeleteTemplate: true,
      };
    } else {
      this.permissions = {};
    }
  }

  // Hash password
  if (!this.isModified("password")) return next();
  this.password = await hashPassword(this.password);
  next();
});

// Check if user has a specific permission
User.methods.hasPermission = function (permissionKey) {
  return !!(this.permissions && this.permissions[permissionKey]);
};

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
