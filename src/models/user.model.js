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
      minlength: 2,
      maxlength: 16,
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
      minlength: 6,
      maxlength: 16,
    },
    avatar: {
      type: Buffer,
    },
    accessTokens: {
      type: [String],
      required: true,
      default: [],
    },
    refreshTokens: {
      type: [String],
      required: true,
      default: [],
    },
    subscription: {
      status: {
        type: String,
        required: true,
        default: 'none',
        enum: ['active', 'trialing', 'overdue', 'canceled', 'none'],
      },
      endsIn: {
        type: Date,
        required: true,
        default: Date.now(),
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.accessTokens;
  delete userObject.refreshToken;
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
