const puppeteer = require('puppeteer');

const Queue = require('../models/queue');

const Test = require('../models/test');

const tools = require('./common');

const BROWSER_OPEN_FAIL = 0;

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

async function run(jobData) {
  console.log('jobData->', jobData);

  try {
    const browser = await puppeteer.launch(pupConfig);
    let responseObject = {};

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

    // page.setDefaultTimeout(10000);

    await page.goto(jobData.url);

    // await page.waitForSelector('[id="nav-menu-item-14795"]');

    // await page.hover('[id="nav-menu-item-14795"]');

    await tools.wait(3000);

    // const menuItem = await page.waitForSelector('[id="nav-menu-item-14797"]', { visible: true });

    // const elementText = await page.$eval('[id="nav-menu-item-14797"]', (element) => element.textContent);

    browser.close();

    return responseObject;
  } catch (error) {
    console.log('Error!->', error);
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
  console.log("queue monitor ends!");
  clearInterval(queueTimer);
}

async function processQueue() {
  if (!isBusy) {
    while (queueLength > 0) {
      isBusy = true;
      try {
        const nextItem = await Queue.findOne({});

        const nextTest = await Test.findById(nextItem.testId);

        const runResult = await run(nextTest);
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
  console.log("queue monitor starts!");
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
