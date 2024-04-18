import mongoose from 'mongoose';

const testChema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  authUser: {
    type: String,
  },
  authPass: {
    type: String,
  },
  actions: {
    type: Array,
    required: true,
  },
  state: {
    type: Boolean,
  },
});

testChema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// module.exports = mongoose.model('Test', testChema);
export const Test = mongoose.model('Test', testChema);
