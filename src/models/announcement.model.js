const mongoose = require('mongoose');

const Image = require('../models/image.model');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: undefined,
    },
    description: {
      type: String,
      trim: true,
      default: undefined,
    },
    description2: {
      type: String,
      trim: true,
      default: undefined,
    },
    links: {
      type: [String],
      trim: true,
      default: undefined,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      default: undefined,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
  }
);

/******************************
 * INDEXES
 ******************************/

announcementSchema.index({ createdAt: -1 }, { name: 'chronologicalOrder' });

/******************************
 * SCHEMA MIDDLEWARES
 ******************************/

announcementSchema.pre('remove', async function (next) {
  try {
    const announcement = this;

    await Image.findByIdAndDelete(announcement.image).exec();

    next();
  } catch (error) {
    throw error;
  }
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
