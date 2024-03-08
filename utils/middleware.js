// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');

const commonTools = require('./common');

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

const errorHandler = (error, request, response, next) => {
  console.log('error.name = ', error.name);
  console.log('error.message = ', error.message);

  if (error.name === 'JsonWebTokenError') {
    return response.status(400).send({ error: `Token error: ${error}` });
  } if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  } if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' });
  } if (error.name === 'MissingTokenError' && error.message.includes('Bro, you need an auth token to do this.')) {
    return response.status(400).json({ error: error.message });
  } if (error.name === 'InvalidTokenError') {
    return response.status(400).json({ error: error.message });
  } if (error.name === 'QueueError') {
    return response.status(500).json({ error: error.message });
  }
  if (error.name === 'ReferenceError') {
    return response.status(500).json({ error: error.message });
  }
  if (error.name === 'LoginError') {
    return response.status(401).json({ error: error.message });
  }
  if (error.name === 'InvalidObjectId') {
    return response.status(400).json({ error: error.message });
  }
  if (error.name === 'DocumentNotFoundError') {
    return response.status(400).json({ error: error.message });
  }
  if (error.name === 'DbError') {
    return response.status(400).json({ error: error.message });
  }
  if (error.name === 'InputError') {
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

// tries to extract the token from the request object
// and sets request.userid obtained from the token
const userExtractor = (request, response, next) => {
  if (!request.token) {
    next(commonTools.createError('MissingTokenError', 'Bro, you need an auth token to do this.'));
  }
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken.id) {
    const InvalidTokenError = new Error('InvalidTokenError');
    InvalidTokenError.name = 'MissingTokenError';
    InvalidTokenError.message = 'Bro, your token seems to be invalid.'; // You can add custom properties as well
    next(InvalidTokenError);
  }
  request.userId = decodedToken.id;
  return next();
};

module.exports = {
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
