const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  sessionString: {
    type: String,
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    required: false,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
userSchema.index({ telegramId: 1, phoneNumber: 1 });

module.exports = mongoose.model('User', userSchema);