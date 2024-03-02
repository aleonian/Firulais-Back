const indexRouter = require('express').Router();

indexRouter.get('/', (request, response) => {
  response.send('Howdy bro!');
});

module.exports = indexRouter;
