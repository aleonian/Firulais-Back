const resultsRouter = require('express').Router();

const Result = require('../models/result');

resultsRouter.get('/', async (request, response, next) => {
  const results = await Result.find({}).populate('testId');
  console.log('results->', results);
  response.json(results);
});

module.exports = resultsRouter;
