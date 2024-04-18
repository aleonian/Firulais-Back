import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  testId: {
    type: String,
    required: true,
  },
});

queueSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// module.exports = mongoose.model('Queue', queueSchema);

export const Queue = mongoose.model('Queue', queueSchema);