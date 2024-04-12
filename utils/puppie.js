const puppeteer = require('puppeteer');
const fs = require('fs');

const {
  blue, cyan, green, magenta, red, yellow,
} = require('colorette');

const Queue = require('../models/queue');

const Test = require('../models/test');

const Result = require('../models/result');

const tools = require('./common');

const websocket = require('./websocket');

const GREAT_SUCCESS = 0;
const BROWSER_OPEN_FAIL = 1;
const GENERAL_EXCEPTION = 2;
const CONSOLE_PROBLEMS = 3;
const PAGE_ERROR = 4;
const REQUEST_FAILED = 5;
const BAD_COMMAND = 6;

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
  6: 'BAD_COMMAND',
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
async function performSelect(page, args) {
  try {
    await page.waitForSelector(args[0], {
      timeout: 5000,
    });

    const selector = args[0];
    const optionValue = args.slice(1).join(' ');

    await page.select(selector, optionValue);

    const selectedOption = await page.$eval(selector, (select) => select.value);

    if (selectedOption === optionValue) {
      console.log('Option selected successfully');
      return {
        success: true,
      };
    }
    console.error('Option selection failed');
    return {
      success: false,
      exitCode: -1,

    };
  } catch (error) {
    return {
      success: false,
      exitCode: -1,

    };
  }
}
async function waitForSelector(page, args) {
  try {
    await page.waitForSelector(args[0], {
      timeout: 30000,
    })
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      exitCode: -1,
    };
  }
}
async function waitForSelectorInIframe(page, args) {
  const iframeSelector = args[0];

  const objectSelector = args[1];

  try {

    await page.waitForSelector(iframeSelector);

    const iframeElementHandle = await page.$(iframeSelector);

    const iframeContentFrame = await iframeElementHandle.contentFrame();

    await iframeContentFrame.waitForSelector(objectSelector);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      exitCode: -1,
    };
  }
}
async function performType(page, args) {
  try {
    const selector = args[0];
    const text = args.slice(1).join(' ');

    await page.waitForSelector(selector, {
      timeout: 5000,
    });

    await page.type(selector, text);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      exitCode: -1,
    };
  }
}
async function takeSnapshot(page, jobData) {
  try {

    const directory = './public/snapshots';

    // Check if the directory exists
    if (!fs.existsSync(directory)) {
      // If it doesn't exist, create it
      fs.mkdirSync(directory);
      console.log(`Directory '${directory}' created successfully.`);
    } else {
      console.log(`Directory '${directory}' already exists.`);
    }

    const fileName = `screenshot-${jobData.id}.png`;
    await page.screenshot({ path: `${directory}/${fileName}` });

    return {
      success: true,
      data: {
        name: 'snapshot',
        value: fileName
      }
    };
  } catch (error) {
    console.log("error:", error);
    return {
      success: false,
      exitCode: -1,
    };

  }
}
async function performClick(page, args) {
  const selector = args.join(' ');

  try {
    await page.waitForSelector(selector, {
      timeout: 5000,
    });

    await page.click(selector);
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      exitCode: -1,
    };
  }
}
async function performScrollBottom(page) {
  try {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    return {
      success: true,
    };
  } catch (error) {
    console.log('performScrollBottom() failed: ', error);
    return {
      success: false,
      exitCode: -1,
    };
  }
}
async function performEvalCheckBoxClick(page, args) {
  try {
    const selector = args[0];

    await page.waitForSelector(selector, {
      timeout: 5000,
    });

    await page.evaluate((evalSelector) => {
      const element = document.querySelector(evalSelector);
      console.log('Element:', element);
      element.click();
    }, selector);

    await tools.wait(2000);

    const clickResult = await page.evaluate((evalSelector) => {
      try {
        const element = document.querySelector(evalSelector);
        if (element) {
          return element.checked;
        }
        throw new Error('Checkbox element not found');
      } catch (error) {
        console.error('Error evaluating element state:', error);
        return false;
      }
    }, selector);

    if (clickResult) {
      console.log('performEvalCheckBoxClick: clicked successfully');
      return {
        success: true,
        exitCode: GREAT_SUCCESS,
      };
    }
    console.error('EvalClick check failed');
    return {
      success: false,
      exitCode: -1,

    };
  } catch (error) {
    console.log(`performEvalCheckBoxClick() error: ${error}`);
    return {
      success: false,
      exitCode: -1,

    };
  }
}

function addProblem(problemType, errorMessage) {
  responseObject.success = false;
  if (!responseObject.problems) responseObject.problems = [];
  responseObject.problems.push({
    problemType,
    errorMessage,
  });
}

async function performSearch(page, args) {
  try {
    const searchString = args.join(' ');
    console.log('searchString->', searchString);
    await page.waitForSelector('body'); // Wait for the page to load
    await page.waitForFunction(
      `document.querySelector("body").innerText.includes("${searchString}")`,
      { timeout: 20000 },
    );
    console.log('Text found on the page.');
    return {
      success: true,
    };
  } catch (error) {
    console.error('Text not found on the page:', error);
    return {
      success: false,
      exitCode: -1,

    };
  }
}
async function performSearchInIframe(page, args) {
  try {

    const iframeSelector = args[0];

    const searchString = args.slice(1).join(' ');;

    await page.waitForSelector(iframeSelector);

    const iframeElement = await page.$(iframeSelector);

    const iframeContentFrame = await iframeElement.contentFrame();

    // Execute JavaScript code within the context of the iframe
    const textExists = await iframeContentFrame.evaluate((searchString) => {
      // Check if the specified text exists within the iframe

      const textObj = {
        success: document.body.innerText.includes(searchString),
        text: document.body.innerText
      }
      return textObj;

    }, searchString);

    if (textExists.success) {
      console.log('Text found on the iframe.');
      return {
        success: true,
      };
    }
    else {
      console.log('Text NOT found on the iframe.');
      return {
        success: false,
      };
    }
  } catch (error) {
    console.error('Text not found on the page:', error);
    return {
      success: false,
      exitCode: -1,

    };
  }
}
async function parseAndExecuteCommands(commandsString, page, jobData) {
  const commands = commandsString.split('\n');
  const paecResult = {};
  paecResult.commandLogs = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const command of commands) {
    const [instruction, ...args] = command.trim().split(' ');

    console.log(`executing: ${instruction} ${args.join(' ')}`);

    const commandLog = {};
    commandLog.success = true;
    commandLog.command = `${instruction} ${args.join(' ')}`;

    let result;
    switch (instruction) {
      case 'goto':
        await page.goto(args[0]);
        paecResult.commandLogs.push(commandLog);
        break;

      case 'button-click':
        result = await performClick(page, args);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;

      case 'take-pic':
        result = await takeSnapshot(page, jobData);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        //some of these commands return data to be saved on the test report for this job
        if (result.data) commandLog.data = result.data;
        paecResult.commandLogs.push(commandLog);
        break;

      case 'scroll-bottom':
        result = await performScrollBottom(page);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;

      case 'checkbox-click':
        result = await performEvalCheckBoxClick(page, args);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;

      case 'text-search':
        result = await performSearch(page, args);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;

      case 'iframe-text-search':
        result = await performSearchInIframe(page, args);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;

      case 'wait':
        await tools.wait(args[0]);
        paecResult.commandLogs.push(commandLog);
        break;
      case 'type':
        result = await performType(page, args);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;

      case 'wait-for-selector':
        result = await waitForSelector(page, args);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;

      case 'wait-for-selector-in-iframe':
        result = await waitForSelectorInIframe(page, args);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;

      case 'select':
        result = await performSelect(page, args);
        if (result.success === false) {
          commandLog.success = false;
          addProblem(
            typeStrings[BAD_COMMAND],
            `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
          );
        }
        paecResult.commandLogs.push(commandLog);
        break;
      // Add more commands as needed
      default:
        console.log(`Unknown command: ${instruction}`);
        addProblem(
          typeStrings[BAD_COMMAND],
          `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
        );
        commandLog.success = false;
        paecResult.commandLogs.push(commandLog);
        break;
    }
  }
  return paecResult;
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
      actions: {},
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

    if (jobData.authUser !== '' && jobData.authPass !== '') {
      console.log('authUser->', jobData.authUser);
      console.log('authPass->', jobData.authPass);
      await page.authenticate({ username: jobData.authUser, password: jobData.authPass });
    }
    await page.goto(jobData.url);

    const { actions } = jobData;

    console.log('Actions->', actions);

    if (actions && actions.length > 0) {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const { commands } = action;
        const paecResult = await parseAndExecuteCommands(commands, page, jobData);
        console.log('paecResult->', JSON.stringify(paecResult));
        console.log('action.name->', action.name);
        //voy por aqui
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

        websocket.emit(nextTest);

        const runResult = await goFetch(nextTest);

        nextTest.state = false;

        websocket.emit(nextTest);

        await nextTest.save();

        const newResult = new Result({
          testId: nextItem.testId,
          when: Date.now(),
          outcome: runResult,
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
  isBusy,
};
