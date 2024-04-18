// const puppeteer = require('puppeteer');
import puppeteer from 'puppeteer';

import {
  blue, cyan, green, magenta, red, yellow,
} from 'colorette';
// const {
//   blue, cyan, green, magenta, red, yellow,
// } = require('colorette');

import { Queue } from '../../models/queue.mjs';

import { Test } from '../../models/test.mjs';

import { Result } from '../../models/result.mjs';

// const Queue = require('../../models/queue');

// const Test = require('../../models/test');

// const Result = require('../../models/result');

import { emit } from '../websocket.mjs';


import { parseAndExecuteCommands } from "./parseAndExecuteCommands.mjs";

import { setAddProblemFunction, setBrowserObject } from './paecFunctions.mjs';

import {
  GREAT_SUCCESS,
  BROWSER_OPEN_FAIL,
  GENERAL_EXCEPTION,
  CONSOLE_PROBLEMS,
  PAGE_ERROR,
  REQUEST_FAILED,
  BAD_COMMAND,
  exitCodeStrings,
  typeStrings
} from "../constants.js";

export let isBusy = false;

let queueLength = 0;

let queueTimer;

let responseObject = {};

const pupConfig = {
  headless: process.env.PUPPIE_HEADLESS ? JSON.parse(process.env.PUPPIE_HEADLESS) : false,
  defaultViewport: null,
  ignoreDefaultArgs: ['--enable-automation'],
  args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
  // executablePath: '/usr/bin/chromium-browser',
};

if (process.env.EXECUTABLE_PATH) {
  pupConfig.executablePath = process.env.EXECUTABLE_PATH;
}

function addProblem(problemType, errorMessage) {
  responseObject.success = false;
  if (!responseObject.problems) responseObject.problems = [];
  responseObject.problems.push({
    problemType,
    errorMessage,
  });
}

async function goFetch(jobData) {
  try {
    const browser = await puppeteer.launch(pupConfig);
    setBrowserObject(browser);
    if (!browser) {
      responseObject = {
        success: false,
        exitCode: BROWSER_OPEN_FAIL,
        message: exitCodeStrings[BROWSER_OPEN_FAIL],
      };
      return responseObject;
    }

    responseObject = {
      success: true,
      exitCode: GREAT_SUCCESS,
      actions: {},
    };
    const page = await browser.newPage();

    // This allegedly detects redirects 
    // const redirects = [];
    // const client = await page.target().createCDPSession();
    // await client.send('Network.enable');
    // await client.on('Network.requestWillBeSent', (e) => {
    //   if (e.type !== "Document") {
    //     return;
    //   }
    //   redirects.push(e.documentURL);
    // });

    // Listen for the 'response' event
    page.on('response', response => {

      // Check if response status code indicates a redirect
      if ([301, 302].includes(response.status())) {
        console.error('Redirect detected!');
      }
      // if ((status >= 300) && (status <= 399)) {
      //   console.log('Redirect from', response.url(), 'to', response.headers()['location'])
      // }
      if (response.url() !== response.request().url()) {
        console.warn('Redirect detected!');
        console.log('Response URL:', response.url());
        console.log('Response headers():', response.headers());
      }
    });

    page
      .on('console', (message) => {
        const type = message.type();
        const colors = {
          log: (text) => text,
          error: red,
          warn: yellow,
          info: cyan,
        };
        if (type === 'error') {
          addProblem(
            typeStrings[CONSOLE_PROBLEMS],
            `(${type}) ${message.text()}`,
          );
        }
        const color = colors[type] || blue;
        console.log(color(`console ${type} ${message.text()}`));
      })
      .on('pageerror', ({ message }) => {
        addProblem(typeStrings[PAGE_ERROR], message);
      })
      .on('requestfailed', (request) => {
        console.log('This request failed->', red(request.url()));
        console.log('request.failure()->', request.failure());
        // TODO: should i add this failed requests to results?
        // if (request.failure() && request.failure().errorText) {
        //   console.log(magenta(`${request.failure().errorText} ${request.url()}`));
        //   addProblem(typeStrings[REQUEST_FAILED], request.failure().errorText);
        // } else {
        //   addProblem(typeStrings[REQUEST_FAILED], "Unidentified error, but it's kinda bad.");
        // }
      });

    if (jobData.authUser && jobData.authUser !== '' && jobData.authPass && jobData.authPass !== '') {
      console.log('authUser->', jobData.authUser);
      console.log('authPass->', jobData.authPass);
      await page.authenticate({ username: jobData.authUser, password: jobData.authPass });
    }
    console.log(`page.goto(${jobData.url});`);

    await page.goto(jobData.url, { timeout: 60000 });

    const { actions } = jobData;

    console.log('Actions->', actions);

    if (actions && actions.length > 0) {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const { commands } = action;
        const paecResult = await parseAndExecuteCommands(commands, page, jobData);
        console.log('paecResult->', JSON.stringify(paecResult));
        console.log('action.name->', action.name);
        responseObject.actions[action.name] = paecResult;
      }
    }
    console.log(JSON.stringify(responseObject));
    browser.close();
    return responseObject;
  } catch (error) {
    console.log('Error!->', error);
    addProblem(typeStrings[GENERAL_EXCEPTION], `Exeption: ${error}`);
    responseObject.exitCode = GENERAL_EXCEPTION;
    return responseObject;
  }
}
function stopQueueMonitor() {
  console.log('queue monitor ends!');
  clearInterval(queueTimer);
}

async function processQueue() {
  if (!isBusy) {
    while (queueLength > 0) {
      isBusy = true;
      try {
        const nextItem = await Queue.findOne({});

        const nextTest = await Test.findById(nextItem.testId);

        nextTest.state = true;

        await nextTest.save();

        emit(nextTest);

        const runResults = await goFetch(nextTest);

        // const postProcessedResults = postProcessResults(runResults)

        nextTest.state = false;

        emit(nextTest);

        await nextTest.save();

        const newResult = new Result({
          testId: nextItem.testId,
          when: Date.now(),
          outcome: runResults,
        });

        const saveResult = await newResult.save(newResult);

        // now delete that item from the queue

        await Queue.findByIdAndDelete(nextItem.id);
      } catch (error) {
        console.log('Error trying to process queue:', error);
      }
      // decrement the queueLength
      queueLength--;
    }
    isBusy = false;
    stopQueueMonitor();
  }
}

function startQueueMonitor() {
  console.log('queue monitor starts!');
  queueTimer = setInterval(() => processQueue(), 5000);
}

export async function init() {
  // loads all the documents in the queue and modifies queueLength accordingly;
  const queue = await Queue.find({});
  console.log('queue.length->', queue.length);
  queueLength = queue.length;
  if (queueLength > 0) startQueueMonitor();
  setAddProblemFunction(addProblem);
}

export async function enqueue(testData) {
  const enqueuedJob = new Queue({
    testId: testData.id,
  });

  try {
    await enqueuedJob.save();
    queueLength++;
    if (queueLength === 1) startQueueMonitor();
    return true;
  } catch (error) {
    console.log('error enqueing! ', error);
    return false;
  }
}

export async function enqueueAllTests() {
  console.log('Enqueing all tests...');
  const tests = await Test.find({});
  for (let i = 0; i < tests.length; i++) {
    try {
      await enqueue(tests[i]);
    } catch (error) {
      console.log('enqueueAllTests() error: ', error);
    }
  }
}

// module.exports = {
//   enqueue,
//   init,
//   enqueueAllTests,
//   isBusy,
// };
