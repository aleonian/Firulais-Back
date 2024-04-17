const storage = {};
const fs = require('fs');
const tools = require('../common');
const {
    GREAT_SUCCESS,
    BROWSER_OPEN_FAIL,
    GENERAL_EXCEPTION,
    CONSOLE_PROBLEMS,
    PAGE_ERROR,
    REQUEST_FAILED,
    BAD_COMMAND,
    exitCodeStrings,
    typeStrings
} = require("../constants");

let addProblemFunction = () => {
    console.log("The old addProblemFunction is being called!")
};

const executeAddProblemFunction = (...args) => {
    addProblemFunction(...args);
}
function setAddProblemFunction(fn) {
    addProblemFunction = fn;
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
async function checkAllImageTags(page, args) {
    try {

        const imageElements = await page.$$eval('img', imgs => imgs.map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
        })));

        console.log("imageElements->", imageElements);

        let everyImageHasATag = true;

        imageElements.forEach((image, index) => {
            if (!image.alt) {
                everyImageHasATag = false;
            }
        });

        return {
            success: everyImageHasATag,
            data: {
                name: 'image-tags',
                value: imageElements
            }
        };
    } catch (error) {
        console.log("checkAllImageTags error:", error);
        return {
            success: false,
        };

    }
}
async function checkImageTag(page, args) {
    try {
        const desiredImagePath = args[0];
        const desiredImageTag = args.slice(1).join(' ');

        if (!desiredImagePath || desiredImagePath.length < 1) {
            console.log("checkImageTag: You need to provide an image path.")
            return {
                success: false,
                errorMessage: "You need to provide a image path."
            };
        }

        const imageElements = await page.$$eval('img', imgs => imgs.map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
        })));

        let desiredImageHasCorrectTag = true;
        let desiredImageObject = {};

        imageElements.forEach((image, index) => {
            if (image.src === desiredImagePath) {
                desiredImageObject.src = image.src;
                desiredImageObject.alt = image.alt;
                if (!image.alt || image.alt !== desiredImageTag) {
                    desiredImageHasCorrectTag = false;
                }
            }
        });
        const resultArray = [];
        resultArray.push(desiredImageObject);

        return {
            success: desiredImageHasCorrectTag,
            data: {
                name: 'image-tags',
                value: resultArray
            }
        };
    } catch (error) {
        console.log("checkImageTag error:", error);
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
async function getAttributeLang(page, args) {
    try {

        const dataLabel = args[0];

        if (!dataLabel || dataLabel.length < 1) {
            console.log("getVideoCurrentTime: You need to provide a variable name.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }
        const langAttribute = await page.evaluate(() => {
            const htmlElement = document.documentElement;
            return htmlElement.getAttribute('lang');
        });

        storage[dataLabel] = langAttribute;

        return {
            success: true,
        };
    } catch (error) {
        console.log("getAttributeLang error:", error);
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
            success: false
        };
    }
}

module.exports = {
    hookAudioPlayer,
    performEvalCheckBoxClick,
    performScrollBottom,
    performClick,
    audioPlay,
    videoPlay,
    setVideoCurentTime,
    getVideoCurrentTime,
    getVideoDuration,
    takeSnapshot,
    getCurrentUrl,
    performType,
    waitForSelectorInIframe,
    waitForSelectorVisible,
    waitForSelector,
    performSelect,
    clearInput,
    performSearchInIframe,
    performNegativeSearch,
    saveDataInVariable,
    performSearch,
    getLinkHref,
    getTextContent,
    compareNotEqual,
    compareEqual,
    compareGreaterEqual,
    setAddProblemFunction,
    executeAddProblemFunction,
    checkAllImageTags,
    checkImageTag,
    getAttributeLang
}