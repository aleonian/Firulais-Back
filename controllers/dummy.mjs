import express from 'express';

export const dummyRouter = express.Router();


dummyRouter.get('/', (request, response) => {
  response.send('dumma bua!');
});

