const testRouter = require('express').Router();

const mongoose = require('mongoose');

// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');

const Test = require('../models/test');

const testTools = require('../utils/puppie');

class QueueError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QueueError';
  }
}

testRouter.get('/', async (request, response) => {
  const tests = await Test.find({});
  response.json(tests);
});

testRouter.post('/', async (request, response, next) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' });
    }
  } catch (error) {
    console.log('error->', error);
    return next(error);
  }

  //   const user = await User.findById(decodedToken.id);

  const newTest = request.body;

  const test = new Test(newTest);

  let savedTest;
  try {
    savedTest = await test.save();
    return response.status(201).json(savedTest);
  } catch (error) {
    return (next(error));
  }
});

testRouter.post('/enqueue', async (request, response, next) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' });
    }
  } catch (error) {
    console.log('error->', error);
    return next(error);
  }

  const desiredTest = request.body;

  try {
    const objectId = new mongoose.Types.ObjectId(desiredTest.id);

    const foundTest = await Test.findById(objectId);

    if (!foundTest) {
      return response.status(400).json({ error: 'Wrong test id!' });
    }
    const enqueueResult = await testTools.enqueue(foundTest);
    if (!enqueueResult) throw new QueueError('Test not enqued!');
    return response.status(201).json('Test enqueued!');
  } catch (error) {
    return (next(error));
  }
});

testRouter.get('/enqueue/all', async (request, response, next) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' });
    }
  } catch (error) {
    console.log('error->', error);
    return next(error);
  }

  try {
    const allTests = await Test.find({});

    if (!allTests) {
      return response.status(400).json({ error: 'Trouble reading tests from db' });
    }
    // eslint-disable-next-line no-unreachable-loop
    for (let i = 0; i < allTests.length; i++) {
      const enqueueResult = await testTools.enqueue(allTests[i]);
      if (!enqueueResult) throw new QueueError('Test not enqued!');
    }
    return response.status(200).send("All tests enqueued!");
  } catch (error) {
    return (next(error));
  }
});
testRouter.get('/erase/all', async (request, response, next) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' });
    }
  } catch (error) {
    console.log('error->', error);
    return next(error);
  }

  try {
    const allTests = await Test.deleteMany({});

    if (!allTests) {
      return response.status(400).json({ error: 'Trouble deleting all tests from db' });
    }
    // eslint-disable-next-line no-unreachable-loop
    return response.status(200).send('All tests deleted!');
  } catch (error) {
    return (next(error));
  }
});

testRouter.delete('/:id', async (request, response) => {
  console.log('request.params.id->', request.params.id);

  const isValidObjectId = mongoose.Types.ObjectId.isValid(request.params.id);

  let objectId;

  if (isValidObjectId) {
    objectId = new mongoose.Types.ObjectId(request.params.id);
  } else {
    // eslint-disable-next-line no-console
    console.error('Invalid ObjectId format');
    return response.status(400).end();
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
    return response.status(401).send(`Error deleting document:${error.message}`);
  }

  return response.status(204).json('document deleted successfully!');
});

testRouter.put('/:id', async (request, response, next) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' });
    }
  } catch (error) {
    console.log('error->', error);
    return next(error);
  }

  if (!request.params.id) {
    return response.status(401).json({ error: 'No test id?' });
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
    response.status(400).json(error);
    // eslint-disable-next-line no-console
    console.log(error);
  }
});

module.exports = testRouter;
