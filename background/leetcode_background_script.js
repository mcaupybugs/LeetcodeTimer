var dataArray = [];
var setArray = new Set();
chrome.runtime.onStartup.addListener(function () {
    ensureFilePresent();
})

chrome.tabs.onActivated.addListener((tab) => {
    ensureFilePresent();
    chrome.tabs.get(tab.tabId, function (tab) {
        var pageTitle = tab.title
        var pageUrl = tab.url
        console.log(dataArray)
        console.log(setArray)
        if (checkLeetcodePage(pageUrl) && !setArray.has(pageTitle)) {
            dataArray.push(new CSVDataModel(pageTitle, pageUrl, "10", new Date().toDateString()))
            chrome.storage.local.set({ "leetcode_timer_file": dataArray })
        }
    })
});

chrome.tabs.onUpdated.addListener((tabId) => {
    chrome.tabs.get(tabId, function (tab) {
        var pageTitle = tab.title
        var pageUrl = tab.url
        if (checkLeetcodePage(pageUrl) && !setArray.has(pageTitle)) {
            dataArray.push(new CSVDataModel(pageTitle, pageUrl, "10", new Date().toDateString()))
            chrome.storage.local.set({ "leetcode_timer_file": dataArray })
        }
    })
});

// Add all the check conditions in this file
function checkLeetcodePage(url) {
    if (url.includes("https://leetcode.com/problems/")) {
        return true;
    }
    return false;
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