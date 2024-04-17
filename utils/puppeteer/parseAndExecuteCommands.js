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

const {
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
    executeAddProblemFunction,
    checkImageTags
} = require("./paecFunctions");


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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;

            case 'check-image-tags':
                result = await checkImageTags(page, args);
                if (result.success === false) {
                    commandLog.success = false;
                    executeAddProblemFunction(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                if (result.data) commandLog.data = result.data;
                paecResult.commandLogs.push(commandLog);
                break;


            case 'get-video-current-time':
                result = await getVideoCurrentTime(page, args);
                if (result.success === false) {
                    commandLog.success = false;
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    console.log("gonna call executeAddProblemFunction:", executeAddProblemFunction);
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
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
                    executeAddProblemFunction(
                        typeStrings[BAD_COMMAND],
                        `${exitCodeStrings[BAD_COMMAND]} ${commandLog.command}`,
                    );
                }
                paecResult.commandLogs.push(commandLog);
                break;
            // Add more commands as needed
            default:
                console.log(`Unknown command: ${instruction}`);
                executeAddProblemFunction(
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

module.exports = { parseAndExecuteCommands };