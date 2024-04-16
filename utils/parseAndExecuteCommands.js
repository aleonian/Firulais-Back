const fs = require('fs');
const tools = require('./common');
const storage = {};
const BAD_COMMAND = 6;

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
  
async function parseAndExecuteCommands(commandsString, page, jobData) {
    const commands = commandsString.split('\n');
    const paecResult = {};
    paecResult.commandLogs = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const command of commands) {
        // const [instruction, ...args] = command.trim().split(' ');
        const [instruction, ...args] = command.trim().split(/\s+/);
        if (!instruction || instruction.length < 1 || instruction.startsWith("//")) continue;
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

            case 'get-current-url':
                result = await getCurrentUrl(page, args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
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

            case 'get-video-duration':
                result = await getVideoDuration(page, args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'get-video-current-time':
                result = await getVideoCurrentTime(page, args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'set-video-current-time':
                result = await setVideoCurentTime(page, args);
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

            case 'test-audio-play':
                result = await hookAudioPlayer(page);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'video-play':
                result = await videoPlay(page, jobData);
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

            case 'audio-play':
                result = await audioPlay(page, jobData);
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

            case 'compare-greater-equal':
                result = await compareGreaterEqual(args);
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

            case 'compare-equal':
                result = await compareEqual(args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'compare-not-equal':
                result = await compareNotEqual(args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
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
            case 'clear-input':
                result = await clearInput(page, args);
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

            case 'text-not-find':
                result = await performNegativeSearch(page, args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'save-data-in-variable':
                result = await saveDataInVariable(args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'get-text-content':
                result = await getTextContent(page, args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'get-link-href':
                result = await getLinkHref(page, args);
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'text-find':
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

            case 'iframe-text-find':
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
                console.log("wait-for-selector result->", result)
                if (result.success === false) {
                    commandLog.success = false;
                    addProblem(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'wait-for-selector-visible':
                result = await waitForSelectorVisible(page, args);
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


async function hookAudioPlayer(page) {
    try {

        const timeoutPromise = new Promise(resolve => setTimeout(() => {
            console.log("returning after 15 secs...");
            resolve(false)
        }, 15000));

        const evaluationPromise = page.evaluate(() => {
            const audioElements = document.querySelectorAll('audio');

            if (audioElements.length === 0) {
                console.error('No audio elements found on the page.');
                return false; // No audio elements found, return false
            }

            return new Promise(resolve => {
                audioElements.forEach(audio => {
                    audio.addEventListener('play', () => {
                        console.warn('Audio playback started');
                        resolve(true); // Resolve with an object indicating play action
                    });
                    // audio.addEventListener('pause', () => {
                    //   console.warn('Audio playback paused');
                    //   resolve({ action: 'pause' }); // Resolve with an object indicating pause action
                    // });
                    // audio.addEventListener('ended', () => {
                    //   console.warn('Audio playback ended');
                    //   resolve({ action: 'stop' }); // Resolve with an object indicating stop action
                    // });
                });
            });
        });

        const resultPromise = await Promise.race([timeoutPromise, evaluationPromise]);

        console.log("resultPromise->", resultPromise);

        return {
            success: resultPromise,
        };
    } catch (error) {
        return {
            success: false,
        };
    }
}

function getOperand(inputData) {
    if (inputData.startsWith('var-')) {
        return storage[inputData];
    }
    return inputData;
}

async function compareGreaterEqual(args) {

    try {

        let firstOperand, secondOperand;

        firstOperand = getOperand(args[0]);

        secondOperand = getOperand(args[1]);

        if (firstOperand >= secondOperand) {
            return {
                success: true,
            };
        }
        else {
            return {
                success: false,
            };
        }
    } catch (error) {
        return {
            success: false,
        };
    }

}
async function compareEqual(args) {

    try {

        let firstOperand, secondOperand;

        firstOperand = getOperand(args[0]);

        secondOperand = getOperand(args[1]);

        console.log("compareEqual:");
        console.log("firstOperand->", firstOperand);
        console.log("secondOperand->", secondOperand);

        if (firstOperand === secondOperand) {
            return {
                success: true,
            };
        }
        else {
            return {
                success: false,
            };
        }
    } catch (error) {
        return {
            success: false,
        };
    }

}
async function compareNotEqual(args) {
    try {

        let firstOperand, secondOperand;

        firstOperand = getOperand(args[0]);

        secondOperand = getOperand(args[1]);

        if (firstOperand !== secondOperand) {
            return {
                success: true,
            };
        }
        else {
            return {
                success: false,
            };
        }
    } catch (error) {
        return {
            success: false,
        };
    }
}


async function getTextContent(page, args) {
    try {

        console.log('getTextContent');
        console.log('args->', args);

        const variableName = args[0];

        const selector = args.slice(1).join(' ');

        console.log('selector->', selector);
        console.log('variableName->', variableName);

        if (!selector || selector.length < 1) {
            console.log("getTextContent: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }

        if (!variableName || variableName.length < 1) {
            console.log("getTextContent: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }

        let desiredElement = await page.waitForSelector(selector);

        const textContent = await desiredElement.evaluate(element => {
            return element.textContent.trim();
        });

        console.log("textContent->", textContent, " will be saved to ", `storage[${variableName}]`);
        storage[variableName] = textContent;

        return {
            success: true,
        };
    } catch (error) {
        console.error('Text not found on the page:', error);
        return {
            success: false,
        };
    }
}
async function getLinkHref(page, args) {
    try {

        const variableName = args[0];

        const selector = args.slice(1).join(' ');

        if (!selector || selector.length < 1) {
            console.log("getLinkHref: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a selector."
            };
        }

        if (!variableName || variableName.length < 1) {
            console.log("getLinkHref: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }

        let desiredElement = await page.waitForSelector(selector);

        const href = await desiredElement.evaluate(element => {
            return element.getAttribute('href');
        });

        storage[variableName] = href;

        return {
            success: true,
        };
    } catch (error) {
        console.error('Text not found on the page:', error);
        return {
            success: false,
        };
    }
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
        };
    }
}
async function saveDataInVariable(args) {
    try {
        const variableName = args[0];
        const data = args.slice(1).join(' ');

        if (!variableName || variableName.length < 1) {
            console.log("saveDataInVariable: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }

        if (!data || data.length < 1) {
            console.log("saveDataInVariable: You need to provide data.")
            return {
                success: false,
                errorMessage: "You need to provide data."
            };
        }

        storage[variableName] = data;

        return {
            success: true,
        };
    } catch (error) {
        console.error('Text not found on the page:', error);
        return {
            success: false,
        };
    }
}
async function performNegativeSearch(page, args) {
    try {
        const searchString = args.join(' ');
        await page.waitForSelector('body', { timeout: 10000 }); // Wait for the page to load
        await page.waitForFunction(
            `document.querySelector("body").innerText.includes("${searchString}")`,
            { timeout: 10000 },
        );
        console.log('Text found on the page.');
        return {
            success: false,
        };
    } catch (error) {
        console.error('Text not found on the page (great success):', error);
        return {
            success: true,
        };
    }
}
async function performSearchInIframe(page, args) {
    try {

        const iframeSelector = args[0];

        const searchString = args.slice(1).join(' ');

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
        };
    }
}
async function clearInput(page, args) {
    try {

        const elementSelector = args[0];

        await page.evaluate((elementSelector) => {
            // Replace 'inputSelector' with the actual CSS selector of your input element
            const inputElement = document.querySelector(elementSelector);

            // Check if the input element exists
            if (inputElement) {
                // Set the value of the input element to an empty string
                inputElement.value = '';
            } else {
                console.error('Input element not found');
            }
        }, elementSelector);

        console.log(elementSelector + ' element cleared');

        return {
            success: true,
        }
    } catch (error) {
        console.error('clearInput error:', error);
        return {
            success: false,
        };
    }
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
        };
    } catch (error) {
        return {
            success: false,
        };
    }
}
async function waitForSelector(page, args) {
    try {
        const desiredSelector = args[0];
        await page.waitForSelector(desiredSelector, {
            timeout: 30000,
        })
        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
        };
    }
}
async function waitForSelectorVisible(page, args) {
    try {
        await page.waitForSelector(args[0], {
            timeout: 30000,
            visible: true,
        });

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
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
        };
    }
}

async function getCurrentUrl(page, args) {
    try {
        const currentUrl = await page.evaluate(() => window.location.href);
        const dataLabel = args[0];
        if (!dataLabel || dataLabel.length < 1) {
            console.log("getCurrentUrl: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }
        storage[dataLabel] = currentUrl;
        return {
            success: true,
        };
    }
    catch (error) {
        console.log("getCurrentUrl error:", error);
        return {
            success: false,
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
        };
    }
}
async function getVideoDuration(page, args) {
    try {

        await page.waitForSelector('video');

        // Get the video element handle
        const videoHandle = await page.$('video');

        const videoDuration = Math.floor(await page.evaluate(video => video.duration, videoHandle));

        const dataLabel = args[0];

        if (!dataLabel || dataLabel.length < 1) {
            console.log("getVideoDuration: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }

        storage[dataLabel] = videoDuration;

        return {
            success: true,
        };
    } catch (error) {
        console.log("error:", error);
        return {
            success: false,
        };

    }
}
async function getVideoCurrentTime(page, args) {
    try {

        await page.waitForSelector('video');

        const dataLabel = args[0];

        if (!dataLabel || dataLabel.length < 1) {
            console.log("getVideoCurrentTime: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }
        const currentVideoTime = await page.evaluate(() => {
            const video = document.querySelector('video');
            return video.currentTime;
        });

        storage[dataLabel] = currentVideoTime;

        return {
            success: true,
        };
    } catch (error) {
        console.log("getVideoCurrentTime error:", error);
        return {
            success: false,
        };
    }
}
async function setVideoCurentTime(page, args) {
    try {
        let desiredTimeInSeconds;

        if (args[0].startsWith('var-')) {
            const variableName = args[0];
            desiredTimeInSeconds = storage[variableName];
        }

        else desiredTimeInSeconds = args[0];

        await page.waitForSelector('video');

        await page.evaluate((desiredTime) => {
            try {
                const video = document.querySelector('video');
                video.currentTime = desiredTime;
            }
            catch (error) {
                console.log("Trouble setting video", error);
            }
        }, desiredTimeInSeconds);

        return {
            success: true,
        };
    } catch (error) {
        console.log("setVideoCurentTime error:", error);
        return {
            success: false,
        };
    }
}
async function videoPlay(page, jobData) {
    try {

        await page.waitForSelector('video');

        await page.evaluate(() => {
            try {
                const video = document.querySelector('video');
                video.play();
            }
            catch (error) {
                console.log("Trouble playing video", error);
            }
        });

        return {
            success: true,
        };
    } catch (error) {
        console.log("videoPlay error:", error);
        return {
            success: false,
        };
    }
}
async function audioPlay(page) {
    try {

        await page.waitForSelector('audio');

        await page.evaluate(() => {
            try {
                const audio = document.querySelector('audio');
                audio.play();
            }
            catch (error) {
                console.log("Trouble playing audio", error);
            }
        });

        return {
            success: true,
        };
    } catch (error) {
        console.log("audioPlay error:", error);
        return {
            success: false,
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
        };
    } catch (error) {
        console.log(`performEvalCheckBoxClick() error: ${error}`);
        return {
            success: false,


        };
    }
}

module.exports = { parseAndExecuteCommands };