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

module.exports = resultsRouter;
