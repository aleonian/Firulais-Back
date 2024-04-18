import bcrypt from 'bcryptjs';
import express from 'express';
export const usersRouter = express.Router();

import { User } from '../models/user.mjs';

usersRouter.post('/', async (request, response, next) => {
  const { username, name, password } = request.body;

  if (!password || password.length < 7) {
    return response.status(400).json({ error: 'Password must be at least 7 chars long.' });
  }
  const saltRounds = 10;

  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  try {
    const savedUser = await user.save();
    return response.status(201).json(savedUser);
  } catch (error) {
    next(error);
    console.log(`${error.name} message: ${error.message}`);
  }
});
