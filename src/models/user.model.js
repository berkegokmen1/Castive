const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jtw = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    age: {
      type: Number,
      default: 0,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
    },
    accessTokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    refreshToken: {
      type: String,
      required: true,
    },
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre('remove', async function (req, res, next) {
  const user = this;
  // Remove playlists
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
