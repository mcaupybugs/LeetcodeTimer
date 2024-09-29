var dataArray = [];
var setArray = new Set();
const TIMER_LC_EXTENSION = "timer-lc-extension";
chrome.runtime.onStartup.addListener(async function () {
  await ensureFilePresent();
});

// ----------- Listeners -------------------------------
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
      await handleExtensionOperations(tabId);
    }
  } catch (e) {
    console.log("Method failed with exception: ", { e });
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  try {
    console.log(removeInfo);
    await handlePageClosingOperations(tabId);
  } catch (e) {
    console.log("Method failed with exception: ", { e });
  }
});

// -------------- Helper Methods --------------------

async function handleExtensionOperations(tabId) {
  await ensureFilePresent();
  pageInfo = await getActiveTabInformation(tabId);
  if (
    checkLeetcodePage(pageInfo?.pageUrl) &&
    !isTabLeetcodeEdgeRenderCase(pageInfo?.pageTitle)
  ) {
    console.log(dataArray);
    console.log(setArray);
    handleDataEntryOperations(pageInfo);
    var currentQuestionData = getQuestionData(pageInfo?.pageTitle);
    console.log(currentQuestionData[0]?.timeTaken, "time taken");
    handleInjectingTimerOperation(
      tabId,
      currentQuestionData[0]?.timeTaken.hours,
      currentQuestionData[0]?.timeTaken.minutes,
      currentQuestionData[0]?.timeTaken.seconds
    );
  }
}

async function handlePageClosingOperations(tabId) {
  await ensureFilePresent();
  var closingQuestionData = getQuestionBasedOnLastTabId(tabId);
  console.log("Closing question", closingQuestionData);
  if (!closingQuestionData[0]) {
    return;
  }
  closingQuestionData = closingQuestionData[0];
  if (
    checkLeetcodePage(closingQuestionData?.questionUrl) &&
    !isTabLeetcodeEdgeRenderCase(closingQuestionData?.questionTitle)
  ) {
    handleTimeUpdateOperation(closingQuestionData);
  }
}

async function getActiveTabInformation(tabId) {
  const tab = await chrome.tabs.get(tabId);
  const pageTitle = tab.title;
  const pageUrl = tab.url;

  return { pageTitle, pageUrl, tabId };
}

function handleDataEntryOperations(pageInfo) {
  if (pageInfo == null) {
    throw new Error("pageInfo found null");
  }
  if (!isQuestionPreviouslyVisited(pageInfo?.pageTitle)) {
    var updatedDataList = putCurrentQuestionInToDataList(
      new CSVDataModel(
        pageInfo?.tabId,
        pageInfo.pageTitle,
        pageInfo.pageUrl,
        new TimeModel(),
        new Date().toDateString(),
        Date.now()
      )
    );
    chrome.storage.local.set({ leetcode_timer_file: updatedDataList });
  } else {
    var question = getQuestionData(pageInfo?.pageTitle);
    if (question.length == 0) {
      throw new Error("No records found with the current question");
    }
    question = question[0];
    console.log("Question", question);
    removeDataListEntry(question?.questionTitle);
    question.lastTabId = pageInfo?.tabId;
    question.lastActiveTime = Date.now();
    console.log("Tabid", pageInfo?.tabId);
    console.log("Data array", dataArray);
    putCurrentQuestionInToDataList(question);
    console.log("After print data arrya", dataArray);
    chrome.storage.local.set({ leetcode_timer_file: dataArray });
  }
}

function handleTimeUpdateOperation(currentQuestionData) {
  removeDataListEntry(currentQuestionData.questionTitle);
  console.log(currentQuestionData.lastActiveTime, "activeTime");
  console.log(Date.now() - currentQuestionData.lastActiveTime);
  var timeTakenInCurrentSession =
    Date.now() - currentQuestionData.lastActiveTime;
  var timeTaken =
    timeTakenInCurrentSession +
    (currentQuestionData.timeTaken.hours * 60 * 60 +
      currentQuestionData.timeTaken.minutes * 60 +
      currentQuestionData.timeTaken.seconds) *
      1000;
  let hours = Math.floor(timeTaken / (1000 * 60 * 60)); // 1 hour = 1000ms * 60s * 60m
  let minutes = Math.floor((timeTaken % (1000 * 60 * 60)) / (1000 * 60)); // Remaining minutes
  let seconds = Math.floor((timeTaken % (1000 * 60)) / 1000); // Remaining seconds
  console.log(hours, minutes, seconds);
  currentQuestionData.timeTaken = new TimeModel(hours, minutes, seconds);
  dataArray.push(currentQuestionData);
  chrome.storage.local.set({ leetcode_timer_file: dataArray });
}

function handleInjectingTimerOperation(
  tabId,
  hours = 0,
  minutes = 0,
  seconds = 0
) {
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
    pauseButton.innerHTML = "⏸";

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
      pauseButton.innerText = isPaused ? "▶" : "⏸";
    });
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

async function ensureFilePresent() {
  await chrome.storage.local.get(["leetcode_timer_file"]).then((result) => {
    handleFileNotFound(result);
    var file = result.leetcode_timer_file;
    dataArray = file ? file : [];
    console.log("File", file);
    setArray = file
      ? new Set(file.map((item) => item.questionTitle))
      : new Set();
  });
}

// ------------------------- Data Array Operations -----------------------

// GET

function getQuestionData(title) {
  return dataArray.filter((data) => data.questionTitle == title);
}

function getQuestionBasedOnLastTabId(tabId) {
  return dataArray.filter((data) => data.lastTabId == tabId);
}

// POST

function putCurrentQuestionInToDataList(question) {
  dataArray.push(question);
  console.log("print from currentquestion", dataArray);
  return dataArray;
}

function removeDataListEntry(pageTitle) {
  dataArray = dataArray.filter((data) => data.questionTitle != pageTitle);
  console.log(dataArray);
  return dataArray;
}

// ------------------------------------------- Data model -----------------

function CSVDataModel(
  tabId,
  questionTitle,
  questionUrl,
  timeTaken,
  date,
  lastActiveTime
) {
  return {
    lastTabId: tabId,
    questionTitle: questionTitle,
    questionUrl: questionUrl,
    timeTaken: timeTaken,
    date: date,
    lastActiveTime: lastActiveTime,
  };
}

function TimeModel(hours = 0, minutes = 0, seconds = 0) {
  return {
    hours: hours,
    minutes: minutes,
    seconds: seconds,
  };
}
