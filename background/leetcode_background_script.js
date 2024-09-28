var dataArray = [];
var setArray = new Set();
const TIMER_LC_EXTENSION = "timer-lc-extension";

chrome.runtime.onStartup.addListener(function () {
    ensureFilePresent();
});

chrome.tabs.onActivated.addListener(async (tab) => {
    try {
        pageInfo = await handleExtensionOperations(tab.tabId);
    } catch (e) {
        console.log("Method failed with exception: ", { e });
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === "complete") {
            pageInfo = await handleExtensionOperations(tabId);
        }
    } catch (e) {
        console.log("Method failed with exception: ", { e });
    }
});

async function handleExtensionOperations(tabId) {
    ensureFilePresent();
    pageInfo = await getActiveTabInformation(tabId);
    if (
        checkLeetcodePage(pageInfo?.pageUrl) &&
        !isTabLeetcodeEdgeRenderCase(pageInfo?.pageTitle)
    ) {
        console.log(dataArray);
        console.log(setArray);
        handleDataEntryOperations(pageInfo);
        handleInjectingTimerOperation(tabId);
    }
}

function handleDataEntryOperations(pageInfo) {
    if (pageInfo == null) {
        throw new Error("pageInfo found null");
    }
    if (!isQuestionPreviouslyVisited(pageInfo?.pageTitle)) {
        dataArray.push(
            new CSVDataModel(
                pageInfo.pageTitle,
                pageInfo.pageUrl,
                "10",
                new Date().toDateString()
            )
        );
        chrome.storage.local.set({ leetcode_timer_file: dataArray });
    }
}

async function getActiveTabInformation(tabId) {
    const tab = await chrome.tabs.get(tabId);
    const pageTitle = tab.title;
    const pageUrl = tab.url;

    return { pageTitle, pageUrl };
}

function handleInjectingTimerOperation(tabId, hours = 0, minutes = 0, seconds = 0) {
    chrome.scripting
        .executeScript({
            target: { tabId: tabId },
            func: initializeTimer,
            args: [TIMER_LC_EXTENSION, { hours, minutes, seconds }],
        })
        .then(() => console.log("script injected"));
}

function initializeTimer(
    TIMER_LC_EXTENSION,
    { hours = 0, minutes = 0, seconds = 0 }
) {
    let intervalId;
    let isPaused = false;
    if (!document.getElementById(TIMER_LC_EXTENSION)) {
        const formatTime = (time) => time.toString().padStart(2, "0");

        var formattedTime = `${formatTime(hours)}:${formatTime(
            minutes
        )}:${formatTime(seconds)}`;
        var ideButtonsElement = document.getElementById("ide-top-btns");

        var timerDivElement = document.createElement("div");
        timerDivElement.className = "relative flex w-56 gap-2 ml-2";
        timerDivElement.id = TIMER_LC_EXTENSION;

        var childTextElement = document.createElement("p");
        childTextElement.className = "text-center text-xl";
        childTextElement.innerText = formattedTime;

        // Create the pause/resume button
        var pauseButton = document.createElement("button");
        pauseButton.className = "bg-blue-500 text-white";
        pauseButton.innerHTML = '⏸'

        timerDivElement.appendChild(childTextElement);
        timerDivElement.appendChild(pauseButton);

        ideButtonsElement.appendChild(timerDivElement);
        // Function to update the timer every second
        const updateTimer = () => {
            if (!isPaused) {
                seconds++;
                if (seconds > 59) {
                    seconds = 0;
                    minutes++;
                    if (minutes > 59) {
                        minutes = 0;
                        hours++;
                    }
                }
                formattedTime = `${formatTime(hours)}:${formatTime(
                    minutes
                )}:${formatTime(seconds)}`;
                childTextElement.innerText = formattedTime; // Update the displayed time
            }
        };

        intervalId = setInterval(updateTimer, 1000);

        pauseButton.addEventListener("click", () => {
            isPaused = !isPaused;
            pauseButton.innerText = isPaused ? '▶' : '⏸';
        })

    }
}

// Add all the check conditions in this file
function checkLeetcodePage(url) {
    if (url.includes("https://leetcode.com/problems/")) {
        return true;
    }
    return false;
}

function isTabLeetcodeEdgeRenderCase(pageTitle) {
    return pageTitle === "- LeetCode";
}

function isQuestionPreviouslyVisited(pageTitle) {
    return setArray.has(pageTitle);
}

function handleFileNotFound(result) {
    var file = result.leetcode_timer_file;
    if (!file) {
        dataArray = [];
        setArray = new Set();
        chrome.storage.local.set({ leetcode_timer_file: dataArray }).then(() => {
            console.log("Initial Doc Value set");
        });
    }
}

function ensureFilePresent() {
    chrome.storage.local.get(["leetcode_timer_file"]).then((result) => {
        handleFileNotFound(result);
        var file = result.leetcode_timer_file;
        dataArray = file ? file : [];
        setArray = file
            ? new Set(file.map((item) => item.questionTitle))
            : new Set();
    });
}

// ------------------------------------------- Data model -----------------

function CSVDataModel(questionTitle, questionUrl, timeTaken, date) {
    return {
        questionTitle: questionTitle,
        questionUrl: questionUrl,
        timeTaken: timeTaken,
        date: date,
    };
}
