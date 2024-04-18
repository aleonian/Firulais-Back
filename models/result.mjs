import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  when: {
    type: Date,
    required: true,
  },
  outcome: {
    type: Object,
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Test',
  },
});

resultSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// module.exports = mongoose.model('Result', resultSchema);
export const Result = mongoose.model('Result', resultSchema);

