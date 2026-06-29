const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    module: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Permission', permissionSchema);
