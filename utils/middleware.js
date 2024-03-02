// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

const errorHandler = (error, request, response, next) => {
  if (error.name === 'JsonWebTokenError') {
    return response.status(400).send({ error: `Token error: ${error}` });
  } if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  } if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' });
  } if (error.name === 'MissingTokenError' && error.message.includes('Bro, you need an auth token to do this.')) {
    return response.status(400).json({ error: error.message });
  }

  return next(error);
};

const getTokenFrom = (request) => {
  const authorization = request.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '');
  }
  return null;
};

const tokenExtractor = (request, response, next) => {
  const token = getTokenFrom(request);
  request.token = token;
  return next();
};

const userExtractor = (request, response, next) => {
  if (!request.token) {
    const missingTokenError = new Error('No token?');
    missingTokenError.name = 'MissingTokenError';
    missingTokenError.message = 'Bro, you need an auth token to do this.'; // You can add custom properties as well
    next(missingTokenError);
  }
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  request.userId = decodedToken.id;
  return next();
};

module.exports = {
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
