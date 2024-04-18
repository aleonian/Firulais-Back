// const express = require('express');
import express from 'express';

export const app = express();

const http = require('http').createServer();

const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// eslint-disable-next-line import/no-extraneous-dependencies
const cors = require('cors');

// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');

const config = require('./utils/config.mjs');

const websocket = require('./utils/websocket.mjs');

const middleware = require('./utils/middleware');

const mongoUrl = config.MONGODB_URI;

const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
const testsRouter = require('./controllers/tests');
const indexRouter = require('./controllers/index');
const resultsRouter = require('./controllers/results');

mongoose.connect(mongoUrl);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use(middleware.tokenExtractor);
app.use(middleware.userExtractor);
app.use('/users', usersRouter);
app.use('/tests', testsRouter);
app.use('/results', resultsRouter);
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

io.on('connection', websocket.processIncomingRequest);

http.listen(config.WS_PORT, () => {
  console.log(`ws running on ${config.WS_PORT}`);
});
