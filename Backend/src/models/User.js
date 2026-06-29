const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['USER', 'STUDENT', 'TEACHER', 'MANAGER', 'ADMIN'],
      default: 'STUDENT'
    },

    roleRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },

    status: {
      type: String,
      enum: ['INACTIVE', 'ACTIVE'],
      default: 'INACTIVE'
    },

    fullName: {
      type: String,
      default: ''
    },

    phone: {
      type: String,
      default: ''
    },

    address: {
      type: String,
      default: ''
    },

    avatar: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
