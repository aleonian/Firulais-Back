const testRouter = require('express').Router();

const mongoose = require('mongoose');

// eslint-disable-next-line import/no-extraneous-dependencies
const Test = require('../models/test');

const testTools = require('../utils/puppie');

const commonTools = require('../utils/common');

class QueueError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QueueError';
  }
}

testRouter.get('/', async (request, response, next) => {
  try {
    const tests = await Test.find({});
    response.json(tests);
  } catch (error) {
    next(error);
  }
});

testRouter.get('/active', async (request, response, next) => {
  try {
    const test = await Test.find({ state: true });
    if (test.length > 0) return response.json(test[0]);
    return response.json(-1);
  } catch (error) {
    next(error);
  }
});

testRouter.get('/:id', async (request, response, next) => {
  const isValidObjectId = mongoose.Types.ObjectId.isValid(request.params.id);

  let objectId;

  if (isValidObjectId) {
    objectId = new mongoose.Types.ObjectId(request.params.id);
  } else {
    // eslint-disable-next-line no-console
    console.error('Invalid ObjectId format');
    throw commonTools.createError('InvalidObjectId', 'Invalid ObjectId format');
  }
  try {
    const test = await Test.find(objectId);
    response.json(test);
  } catch (error) {
    next(error);
  }
});

testRouter.post('/add', async (request, response, next) => {
  const newTest = request.body;

  const test = new Test(newTest);
  test.state = 0;
  let savedTest;
  try {
    savedTest = await test.save();
    return response.status(201).json(savedTest);
  } catch (error) {
    return (next(error));
  }
});

testRouter.post('/enqueue', async (request, response, next) => {
  const desiredTest = request.body;

  try {
    const objectId = new mongoose.Types.ObjectId(desiredTest.id);

    const foundTest = await Test.findById(objectId);

    if (!foundTest) {
      throw commonTools.createError('InputError', 'Wrong test id, bro! Come on, man.');
    }
    const enqueueResult = await testTools.enqueue(foundTest);
    if (!enqueueResult) throw new QueueError('Test not enqued!');
    return response.status(201).json('Test enqueued!');
  } catch (error) {
    return (next(error));
  }
});

testRouter.get('/enqueue/all', async (request, response, next) => {
  try {
    const allTests = await Test.find({});

    if (!allTests) {
      throw commonTools.createError('DbError', 'Trouble reading tests from db');
    }
    // eslint-disable-next-line no-unreachable-loop
    for (let i = 0; i < allTests.length; i++) {
      const enqueueResult = await testTools.enqueue(allTests[i]);
      if (!enqueueResult) throw new QueueError('Test not enqued!');
    }
    return response.status(200).send('All tests enqueued!');
  } catch (error) {
    return (next(error));
  }
});

testRouter.get('/erase/all', async (request, response, next) => {
  try {
    const allTests = await Test.deleteMany({});

    if (!allTests) {
      throw commonTools.createError('DbError', 'Trouble deleting all tests from db');
    }
    // eslint-disable-next-line no-unreachable-loop
    return response.status(200).send('All tests deleted!');
  } catch (error) {
    return (next(error));
  }
});

testRouter.delete('/:id', async (request, response, next) => {
  const isValidObjectId = mongoose.Types.ObjectId.isValid(request.params.id);

  let objectId;

  if (isValidObjectId) {
    objectId = new mongoose.Types.ObjectId(request.params.id);
  } else {
    // eslint-disable-next-line no-console
    console.error('Invalid ObjectId format');
    throw commonTools.createError('InvalidObjectId', 'Invalid ObjectId format');
  }

  try {
    const deletedDocument = await Test.findByIdAndDelete(objectId);

    if (deletedDocument) {
      // eslint-disable-next-line no-console
      console.log('Document deleted successfully:', deletedDocument);
    } else {
      // eslint-disable-next-line no-console
      console.log('Document not found');
    }
  } catch (error) {
    console.log(`Error deleting document:${error.message}`);
    return (next(error));
  }

  return response.status(204).json('document deleted successfully!');
});

testRouter.put('/:id', async (request, response, next) => {
  if (!request.params.id) {
    throw commonTools.createError('InputError', 'No test id?');
  }

  const objectId = new mongoose.Types.ObjectId(request.params.id);

  const { body } = request;

  const test = {
    name: body.name,
    url: body.url,
    actions: body.actions,
  };

  try {
    const updatedTest = await Test.findByIdAndUpdate(
      objectId,
      test,
      { new: true },
    );
    response.json(updatedTest);
  } catch (error) {
    next(error);
    // eslint-disable-next-line no-console
    console.log(error);
  }
});

module.exports = testRouter;
