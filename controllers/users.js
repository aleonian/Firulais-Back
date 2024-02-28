const bcrypt = require('bcryptjs');

const usersRouter = require('express').Router();

const User = require('../models/user');

// usersRouter.get('/', async (request, response) => {
//   try {
//     const users = await User
//       .find({}).populate('blogposts');

//     response.json(users);
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.log('error->', error);
//     response.status(500).json(error);
//   }
// });

usersRouter.post('/', async (request, response) => {
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
    return response.status(400).json({ error: error.name, message: error.message });
  }
});

module.exports = usersRouter;
