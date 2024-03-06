const resultsRouter = require('express').Router();

const mongoose = require('mongoose');

const Result = require('../models/result');

class DocumentNotFoundERror extends Error {
  constructor(message) {
    super(message);
    this.name = 'DocumentNotFoundERror';
  }
}

resultsRouter.get('/', async (request, response, next) => {
  const results = await Result.find({}).populate('testId');
  response.json(results);
});

resultsRouter.delete('/:id', async (request, response, next) => {
  console.log('request.params.id->', request.params.id);

  const isValidObjectId = mongoose.Types.ObjectId.isValid(request.params.id);

  let objectId;

  if (isValidObjectId) {
    objectId = new mongoose.Types.ObjectId(request.params.id);
  } else {
    // eslint-disable-next-line no-console
    console.error('Invalid ObjectId format');
    return response.status(400).send('Invalid ObjectId format');
  }

  try {
    const deletedDocument = await Result.findByIdAndDelete(objectId);

    if (deletedDocument) {
      // eslint-disable-next-line no-console
      console.log('Document deleted successfully:', deletedDocument);
    } else {
      // eslint-disable-next-line no-console
      console.log('Document not found');
      throw new DocumentNotFoundERror('That document was not found, bro!');
    }
  } catch (error) {
    return next(error);
    // return response.status(401).send(`Error deleting document:${error.message}`);
  }

  return response.status(204).json('document deleted successfully!');
});

resultsRouter.get('/erase/all', async (request, response, next) => {
  // let decodedToken;
  // try {
  //   decodedToken = jwt.verify(request.token, process.env.SECRET);
  //   if (!decodedToken.id) {
  //     return response.status(401).json({ error: 'token invalid' });
  //   }
  // } catch (error) {
  //   console.log('error->', error);
  //   return next(error);
  // }

  console.log("/erase/all");
  try {
    const allResults = await Result.deleteMany({});

    console.log("allResults->", allResults);
    
    if (!allResults) {
      return response.status(400).json({ error: 'Trouble deleting all results from db' });
    }
    // eslint-disable-next-line no-unreachable-loop
    return response.status(200).send('All results deleted!');
  } catch (error) {
    return (next(error));
  }
});

module.exports = resultsRouter;
