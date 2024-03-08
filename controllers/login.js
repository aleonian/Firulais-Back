// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');

// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');

const loginRouter = require('express').Router();

const User = require('../models/user');

const commonTools = require('../utils/common');

loginRouter.post('/', async (request, response, next) => {
  const { username, password } = request.body;

  try {
    const user = await User.findOne({ username });

    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordHash);

    if (!(user && passwordCorrect)) {
      return next(commonTools.createError('LoginError', 'Bro, your credentials are messed up 😂'));
    }

    const userForToken = {
      username: user.username,
      id: user._id,
    };

    const token = jwt.sign(userForToken, process.env.SECRET);

    return response
      .status(200)
      .send({ token, username: user.username, name: user.name });
  } catch (error) {
    next(error);
  }
});

module.exports = loginRouter;
