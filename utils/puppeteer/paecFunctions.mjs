const storage = {};
import fs from 'fs';
import * as tools from '../common.mjs';
import lighthouse from 'lighthouse'; // Use import instead of require
import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js'; // Specify the path to report-generator

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


let addProblemFunction = () => {
    console.log("The old addProblemFunction is being called!")
};

let browser;

export const executeAddProblemFunction = (...args) => {
    addProblemFunction(...args);
}
export function setAddProblemFunction(fn) {
    addProblemFunction = fn;
}
export function setBrowserObject(browserObj) {
    browser = browserObj;
}
export async function testAudioPlayer(page) {
    try {

        const timeoutPromise = new Promise(resolve => setTimeout(() => {
            console.log("timeoutPromise returning after 15 secs...");
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
                audioPlay(page);
            });
        });

        const resultPromise = await Promise.race([evaluationPromise, timeoutPromise]);

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
function getVariableValue(inputData) {
    if (inputData.startsWith('var-')) {
        return storage[inputData];
    }
    return inputData;
}
export async function compareGreaterEqual(args) {

    try {

        let firstOperand, secondOperand;

        firstOperand = getVariableValue(args[0]);

        secondOperand = getVariableValue(args[1]);

        if (firstOperand >= secondOperand) {
            return {
                success: true,
            };
        }
        else {
            return {
                success: false,
                value: {
                    firstOperand,
                    secondOperand
                }
            };
        }
    } catch (error) {
        return {
            success: false,
        };
    }

}
export async function compareLowerEqual(args) {

    try {

        let firstOperand, secondOperand;

        firstOperand = getVariableValue(args[0]);

        secondOperand = getVariableValue(args[1]);

        if (firstOperand <= secondOperand) {
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
            data: {
                name: 'compare-lower-equal',
                value: {
                    firstOperand,
                    secondOperand
                }
            }
        };
    }

}
export async function compareEqual(args) {

    try {

        let firstOperand, secondOperand;

        firstOperand = getVariableValue(args[0]);

        secondOperand = getVariableValue(args[1]);

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
                data: {
                    name: 'compare-equal',
                    value: {
                        firstOperand,
                        secondOperand
                    }
                }
            };
        }
    } catch (error) {
        return {
            success: false,
        };
    }

}
export async function compareNotEqual(args) {
    try {

        let firstOperand, secondOperand;

        firstOperand = getVariableValue(args[0]);

        secondOperand = getVariableValue(args[1]);

        if (firstOperand !== secondOperand) {
            return {
                success: true,
            };
        }
        else {
            return {
                success: false,
                data: {
                    name: 'compare-not-equal',
                    value: {
                        firstOperand,
                        secondOperand
                    }
                }
            };
        }
    } catch (error) {
        return {
            success: false,
        };
    }
}
export async function getTextContent(page, args) {
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
export async function getLinkHref(page, args) {
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
export async function performSearch(page, args) {
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
export async function saveDataInVariable(args) {
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
export async function performNegativeSearch(page, args) {
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
export async function performSearchInIframe(page, args) {
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
export async function clearInput(page, args) {
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
export async function performSelect(page, args) {
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
export async function waitForSelector(page, args) {
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
export async function waitForSelectorVisible(page, args) {
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
export async function waitForSelectorInIframe(page, args) {
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
export async function performType(page, args) {
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
export async function getCurrentUrl(page, args) {
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
export async function generateLighthouseReport(page, jobData) {
    try {

        const directory = './public/reports';

        // Check if the directory exists
        if (!fs.existsSync(directory)) {
            // If it doesn't exist, create it
            fs.mkdirSync(directory);
            console.log(`Directory '${directory}' created successfully.`);
        } else {
            console.log(`Directory '${directory}' already exists.`);
        }

        const { lhr } = await lighthouse(page.url(), { // Destructure lhr from the report
            port: (new URL(browser.wsEndpoint())).port,
            output: 'json',
            logLevel: 'info',
            disableDeviceEmulation: true,
            chromeFlags: ['--disable-mobile-emulation']
        });

        const fileName = `report-${jobData.id}-${Date.now()}.html`;
        console.log("Gonna create ", fileName);

        const html = ReportGenerator.generateReport(lhr, 'html'); // Generate HTML report
        fs.writeFileSync(`${directory}/${fileName}`, html); // Write HTML report to file
        console.log('HTML report generated.');

        return {
            success: true,
            data: {
                name: 'generate-lighthouse-report',
                value: fileName,
                type: "file"
            }
        };
    }
    catch (error) {
        console.log("getCurrentUrl error:", error);
        return {
            success: false,
        };
    }
}
export async function takeSnapshot(page, jobData) {
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

        const fileName = `screenshot-${jobData.id}-${Date.now()}.png`;
        console.log("Gonna create ", fileName);
        await page.screenshot({ path: `${directory}/${fileName}`, fullPage: true });
        return {
            success: true,
            data: {
                name: 'take-pic',
                value: fileName,
                type: "file"
            }
        };
    } catch (error) {
        console.log("error:", error);
        return {
            success: false,
        };
    }
}
export async function checkAllImageTags(page, args) {
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
                name: 'check-image-tags',
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
export async function checkImageTag(page, args) {
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
export async function getVideoDuration(page, args) {
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
export async function getVideoCurrentTime(page, args) {
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
export async function getAttributeLang(page, args) {
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
export async function setVideoCurentTime(page, args) {
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
export async function setViewport(page, args) {
    try {

        // Small:
        // 414x896

        // Medium:
        // 800x1280

        // Large:
        // 1920x1080

        let viewportSize = getVariableValue(args[0]);

        if (!viewportSize || viewportSize.length < 1) {
            console.log("setViewport: You need to provide a viewport size.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name."
            };
        }
        const viewportWidth = Number(viewportSize.split("x")[0]);
        const viewportHeight = Number(viewportSize.split("x")[1]);
        await page.setViewport({ width: viewportWidth, height: viewportHeight });

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
export async function videoPlay(page, jobData) {
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
export async function audioPlay(page) {
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
export async function resetAudioPlayer(page) {
    try {

        await page.waitForSelector('audio');

        await page.evaluate(() => {
            try {
                const audio = document.querySelector('audio');
                audio.pause();
                audio.currentTime = 0;
            }
            catch (error) {
                console.log("resetAudioPlayer: Trouble resetting audio player", error);
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
export async function pageReload(page) {
    try {
        await page.reload({ waitUntil: 'networkidle0', ignoreCache: true });
        return {
            success: true,
        };
    }
    catch (error) {
        console.log("pageReload error:", error);
        return {
            success: false,
        };
    }
}

export async function getLoadTime(page, args) {
    try {

        let url = args[0];
        let dataLabel = args[1];

        if (!url || url < 1) {
            console.error("getLoadTime: You need to provide a url.")
            return {
                success: false,
                errorMessage: "You need to provide a url."
            };
        }

        if (!dataLabel || dataLabel < 1) {
            console.error("getLoadTime: You need to provide a variable name to store the load time.")
            return {
                success: false,
                errorMessage: "You need to provide a variable name to store the load time."
            };
        }

        const startTime = Date.now();
        await page.goto(url);
        const loadTime = Date.now() - startTime;
        storage[dataLabel] = loadTime;

        return {
            success: true,
        };
    } catch (error) {
        console.log("getLoadTime error:", error);
        return {
            success: false,
        };
    }
}
export async function performClick(page, args) {
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
export async function zoom(page, args) {

    const howMuch = args[0];

    if (!howMuch || howMuch.length < 1) {
        console.log("zoom: You need to provide a value.")
        return {
            success: false,
            errorMessage: "You need to provide a value."
        };
    }
    try {
        await page.evaluate((zoomLevel) => {document.body.style.zoom = zoomLevel}, howMuch );

        // await page.evaluate((zoom) => {
        //     document.body.style.zoom = zoom;
        //   }, zoomLevel);

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
        };
    }
}
export async function performScrollBottom(page) {
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
export async function performEvalCheckBoxClick(page, args) {
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