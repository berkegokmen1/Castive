require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
// const https = require('https');

// Route imports
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();
// const server = https.createServer({}, app);

// Helper middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

app.get('/', (_, res) => {
  res.json({
    data: {
      message: 'Hi from /',
    },
    success: true,
  });
});

// Route registers
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

// Middlewares
app.use((error, req, res, next) => {
  const { statusCode, message, whatEver } = error;

  console.log(whatEver);
  return res.status(statusCode).json({
    success: false,
    data: {
      message,
    },
  });
});

// DB Connection and server initializing
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then((_) => {
    app.listen(process.env.PORT || 4000, (_) => {
      console.log('Server is up and running on port', process.env.PORT);
    });
  })
  .catch((err) => {
    console.error(err);
  });
