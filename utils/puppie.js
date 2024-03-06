const puppeteer = require('puppeteer');

const {
  blue, cyan, green, magenta, red, yellow,
} = require('colorette');

const Queue = require('../models/queue');

const Test = require('../models/test');

const Result = require('../models/result');

const tools = require('./common');

const GREAT_SUCCESS = 0;
const BROWSER_OPEN_FAIL = 1;
const GENERAL_EXCEPTION = 2;
const CONSOLE_PROBLEMS = 3;
const PAGE_ERROR = 4;
const REQUEST_FAILED = 5;
const BAD_ACTION_COMMAND = 6;

let isBusy = false;

let queueLength = 0;

let queueTimer;

let responseObject = {};

const exitCodeStrings = [
  'All went good!',
  'Could not open browser :(!',
  'Some problem happened',
  'Devtools console messages detected',
  'There has been a pretty bad page error. Check console.',
  'An http request failed.',
  'This command failed to execute: ',
];

const typeStrings = {
  0: 'GREAT_SUCCESS',
  1: 'BROWSER_OPEN_FAIL',
  2: 'GENERAL_EXCEPTION',
  3: 'CONSOLE_PROBLEMS',
  4: 'PAGE_ERROR',
  5: 'REQUEST_FAILED',
  6: 'BAD_ACTION_COMMAND',
};

const pupConfig = {
  headless: JSON.parse(process.env.PUPPIE_HEADLESS),
  defaultViewport: null,
  ignoreDefaultArgs: ['--enable-automation'],
  args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
  // executablePath: '/usr/bin/chromium-browser',
};

if (process.env.EXECUTABLE_PATH) {
  pupConfig.executablePath = process.env.EXECUTABLE_PATH;
}
async function performSelect(action, page, args) {
  await page.select(args[0], args[1]);

  const selectedOption = await page.$eval(args[0], (select) => select.value);

  if (selectedOption === args[1]) {
    console.log('Option selected successfully');
    return true;
  }
  console.error('Option selection failed');
  return {
    success: false,
    exitCode: -1,
    command: `${action} ${args.join(' ')}`,
  };
}
async function performClick(action, page, args) {
  console.log('action->', action);
  console.log('page->', page);
  console.log('args->', args);

  await page.click(args[0]);

  // const checkboxState = await page.evaluate(() => {
  //   const checkbox = document.querySelector(args[0]);
  //   return checkbox.checked;
  // });

  await tools.wait(2000);

  const checkboxState = await page.evaluate(() => {
    try {
      const checkbox = document.querySelector(args[0]);
      if (checkbox) {
        return checkbox.checked;
      }
      throw new Error('Checkbox element not found');
    } catch (error) {
      console.error('Error evaluating checkbox state:', error);
      return false;
    }
  });

  if (checkboxState) {
    console.log('Checkbox selected successfully');
    return true;
  }
  console.error('Option selection failed');
  return {
    success: false,
    exitCode: -1,
    command: `${action} ${args.join(' ')}`,
  };
}

function addProblem(problemType, errorMessage) {
  responseObject.success = false;
  if (!responseObject.problems) responseObject.problems = [];
  responseObject.problems.push({
    problemType,
    errorMessage,
  });
}

async function parseAndExecuteCommands(commandsString, page) {
  const commands = commandsString.split('\n');
  // eslint-disable-next-line no-restricted-syntax
  for (const command of commands) {
    const [action, ...args] = command.trim().split(' ');
    console.log(`executing: ${action} ${args.join(' ')}`);
    let result;
    switch (action) {
      case 'goto':
        await page.goto(args[0]);
        break;
      case 'click':
        result = await performClick(action, page, args);
        if (result.success === false && result.exitCode === -1) {
          addProblem(typeStrings[BAD_ACTION_COMMAND], `${exitCodeStrings[BAD_ACTION_COMMAND]} ${result.command}`);
        }
        break;
      case 'wait':
        await tools.wait(args[0]);
        break;
      case 'type':
        await page.type(args[0], args[1]);
        break;
      case 'select':
        result = await performSelect(action, page, args);
        if (result.success === false && result.exitCode === -1) {
          addProblem(typeStrings[BAD_ACTION_COMMAND], `${exitCodeStrings[BAD_ACTION_COMMAND]} ${result.command}`);
        }
        break;
      // Add more commands as needed
      default:
        console.log(`Unknown command: ${action}`);
        return {
          success: false,
          exitCode: -1,
          command,
        };
    }
  }
  return {
    success: true,
    exitCode: GREAT_SUCCESS,
  };
}

async function goFetch(jobData) {
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
      exitCode: GREAT_SUCCESS,
    };
    const page = await browser.newPage();

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
          addProblem(typeStrings[CONSOLE_PROBLEMS], `(${type}) ${message.text()}`);
        }
        const color = colors[type] || blue;
        console.log(color(`${type} ${message.text()}`));
      })
      .on('pageerror', ({ message }) => {
        addProblem(typeStrings[PAGE_ERROR], message);
      })
      // .on('response', (response) => console.log(green(`${response.status()} ${response.url()}`)))
      .on('requestfailed', (request) => {
        console.log(magenta(`${request.failure().errorText} ${request.url()}`));
        addProblem(typeStrings[REQUEST_FAILED], request.failure().errorText);
      });

    await page.goto(jobData.url);

    const { actions } = jobData;

    console.log('Actions->', actions);

    if (actions && actions.length > 0) {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const { commands } = action;
        const result = await parseAndExecuteCommands(commands, page);
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

async function init() {
  // loads all the documents in the queue and modifies queueLength accordingly;
  const queue = await Queue.find({});
  console.log('queue.length->', queue.length);
  queueLength = queue.length;
  if (queueLength > 0) startQueueMonitor();
}

async function enqueue(testData) {
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

async function enqueueAllTests() {
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

module.exports = {
  enqueue,
  init,
  enqueueAllTests,
};
