import express from 'express';

export const indexRouter = express.Router();


indexRouter.get('/', (request, response) => {
  response.send('Howdy bro!');
});

