// eslint-disable-next-line import/no-extraneous-dependencies
import jwt from 'jsonwebtoken';
// eslint-disable-next-line import/no-extraneous-dependencies
import bcrypt from 'bcryptjs';

import express from 'express';

export const loginRouter = express.Router();

import { User } from '../models/user.mjs';

import * as commonTools from '../utils/common.mjs';

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
