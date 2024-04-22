// const express = require('express');
import express from 'express';

export const app = express();

// const http = require('http').createServer();

import { createServer } from 'http';
import { Server } from 'socket.io';

const http = createServer();

// const io = require('socket.io')(http, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST'],
//   },
// });

const io = new Server(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// eslint-disable-next-line import/no-extraneous-dependencies
// const cors = require('cors');
import cors from 'cors';
// eslint-disable-next-line import/no-extraneous-dependencies
// const mongoose = require('mongoose');
import mongoose from 'mongoose';
// const config = require('./utils/config.mjs');
import * as config from './utils/config.mjs'
// const websocket = require('./utils/websocket.mjs');
import * as websocket from './utils/websocket.mjs'

// const middleware = require('./utils/middleware');
import * as middleware from './utils/middleware.mjs'

const mongoUrl = config.MONGODB_URI;

// const usersRouter = require('./controllers/users');
import { usersRouter } from './controllers/users.mjs';

import { loginRouter } from './controllers/login.mjs';

import { testRouter } from './controllers/tests.mjs';

import { indexRouter } from './controllers/index.mjs';

import { resultsRouter } from './controllers/results.mjs';

import { dummyRouter } from './controllers/dummy.mjs';


mongoose.connect(mongoUrl);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/dummy', dummyRouter);
app.use('/users', middleware.tokenExtractor, middleware.userExtractor, usersRouter);
app.use('/tests', middleware.tokenExtractor, middleware.userExtractor, testRouter);
app.use('/results', middleware.tokenExtractor, middleware.userExtractor, resultsRouter);
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

io.on('connection', websocket.processIncomingRequest);

http.listen(config.WS_PORT, () => {
  console.log(`ws running on ${config.WS_PORT}`);
});
