var dataArray = [];
var setArray = new Set();
var ideButtons;
chrome.runtime.onStartup.addListener(function () {
    ensureFilePresent();
})

chrome.tabs.onActivated.addListener(async (tab) => {
    try {
        pageInfo = await handleExtensionOperations(tab.tabId)
    }
    catch (e) {
        console.log("Method failed with exception: ", { e })
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === 'complete') {
            pageInfo = await handleExtensionOperations(tabId)
        }
    }
    catch (e) {
        console.log("Method failed with exception: ", { e })
    }
});

async function handleExtensionOperations(tabId) {
    ensureFilePresent();
    pageInfo = await getActiveTabInformation(tabId);
    if (checkLeetcodePage(pageInfo?.pageUrl) && !isTabLeetcodeEdgeRenderCase(pageInfo?.pageTitle)) {
        console.log(dataArray)
        console.log(setArray)
        handleDataEntryOperations(pageInfo)
    }
}

function handleDataEntryOperations(pageInfo) {
    if (pageInfo == null) {
        throw new Error("pageInfo found null")
    }
    if (isQuestionPreviouslyVisited(pageInfo?.pageTitle)) {
        dataArray.push(new CSVDataModel(pageInfo.pageTitle, pageInfo.pageUrl, "10", new Date().toDateString()))
        chrome.storage.local.set({ "leetcode_timer_file": dataArray })
    }
}

async function getActiveTabInformation(tabId) {
    const tab = await chrome.tabs.get(tabId);
    const pageTitle = tab.title;
    const pageUrl = tab.url;

    return { pageTitle, pageUrl };
}

// Add all the check conditions in this file
function checkLeetcodePage(url) {
    if (url.includes("https://leetcode.com/problems/")) {
        return true;
    }
    return false;
}

function isTabLeetcodeEdgeRenderCase(pageTitle) {
    return pageTitle === "- LeetCode"
}

function isQuestionPreviouslyVisited(pageTitle) {
    return !setArray.has(pageTitle);
}

function getIdeButtons() {
    ideButtons = document.getElementById('ide-top-btns')
    console.log("IdeButtons", ideButtons)
}

function handleFileNotFound(result) {
    var file = result.leetcode_timer_file;
    if (!file) {
        dataArray = [];
        setArray = new Set()
        chrome.storage.local.set({ "leetcode_timer_file": dataArray }).then(() => {
            console.log("Initial Doc Value set")
        })
    }
}

function ensureFilePresent() {
    chrome.storage.local.get(['leetcode_timer_file']).then((result) => {
        handleFileNotFound(result)
        var file = result.leetcode_timer_file;
        dataArray = file ? file : [];
        setArray = file ? new Set(file.map(item => item.questionTitle)) : new Set();
    })
}
// ------------------------------------------- Data model -----------------

function CSVDataModel(questionTitle, questionUrl, timeTaken, date) {
    return {
        "questionTitle": questionTitle,
        "questionUrl": questionUrl,
        "timeTaken": timeTaken,
        "date": date
    }
}