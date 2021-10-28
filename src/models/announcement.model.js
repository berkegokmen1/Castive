/*  
  Castive, A platform to build and share movies & tv series playlists
  Copyright (C) 2021  Ahmet Berke Gökmen

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
