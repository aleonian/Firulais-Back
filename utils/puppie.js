const puppeteer = require('puppeteer');

const Queue = require('../models/queue');

const Test = require('../models/test');

const Result = require('../models/result');

const tools = require('./common');

const BROWSER_OPEN_FAIL = 0;

const GENERAL_EXCEPTION = 1;

let isBusy = false;

let queueLength = 0;

let queueTimer;

const exitCodeStrings = [
  'Could not open browser :(!',
];

const pupConfig = {
  headless: JSON.parse(process.env.PUPPIE_HEADLESS),
  defaultViewport: null,
  ignoreDefaultArgs: ['--enable-automation'],
  args: [
    '--start-maximized',
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ],
  // executablePath: '/usr/bin/chromium-browser',
};

if (process.env.EXECUTABLE_PATH) {
  pupConfig.executablePath = process.env.EXECUTABLE_PATH;
}

async function parseAndExecuteCommands(commandsString, page) {
  const commands = commandsString.split('\n');
  // eslint-disable-next-line no-restricted-syntax
  for (const command of commands) {
    const [action, ...args] = command.trim().split(' ');
    console.log(`executing: ${action} ${args}`);
    switch (action) {
      case 'goto':
        await page.goto(args[0]);
        break;
      case 'click':
        // Implement click logic here
        break;
      case 'type':
        // Implement type logic here
        break;
      case 'wait':
        await tools.wait(args[0]);
        break;
        // Add more commands as needed
      default:
        console.log(`Unknown command: ${action}`);
    }
  }
}

async function goFetch(jobData) {
  let responseObject = {};

  try {
    const browser = await puppeteer.launch(pupConfig);

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
    };
    const page = await browser.newPage();

    const { actions } = jobData;
    if (actions && actions.length > 0) {
      const { commands } = actions[0];
      // Pass the 'page' object as an argument to the provided code
      // eslint-disable-next-line no-eval
      await parseAndExecuteCommands(commands, page);
    }
    browser.close();
    return responseObject;
  } catch (error) {
    console.log('Error!->', error);
    responseObject.success = false;
    responseObject.exitCode = GENERAL_EXCEPTION;
    responseObject.message = `Exeption: ${error}`;
    return responseObject;
  }
}

async function init() {
// loads all the documents in the queue and modifies queueLength accordingly;
  const queue = await Queue.find({});
  console.log('queue.length->', queue.length);
  queueLength = queue.length;
  if (queueLength > 0) startQueueMonitor();
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

        const runResult = await goFetch(nextTest);

        const newResult = new Result({
          testId: nextItem.testId,
          when: Date.now(),
          outcome: runResult,
        });

        const saveResult = await newResult.save(newResult);

        console.log('saveResult->', saveResult);

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

async function enqueue(jobData) {
  console.log('jobData->', jobData);

  const enqueuedJob = new Queue({
    testId: jobData.id,
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
module.exports = {
  enqueue, isBusy, queueLength, init,
};
