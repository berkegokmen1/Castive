const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    original: {
      type: Buffer,
      default: undefined,
    },
    small: {
      type: Buffer,
      default: undefined,
    },
    medium: {
      type: Buffer,
      default: undefined,
    },
  },
  {
    versionKey: false,
    id: false,
  }
);

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
