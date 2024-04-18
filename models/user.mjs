// eslint-disable-next-line import/no-extraneous-dependencies
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minLength: 3,
    required: true,
  },
  name: {
    type: String,
    minLength: 3,
    required: true,
  },
  passwordHash: String,
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

export const User = mongoose.model('User', userSchema);

