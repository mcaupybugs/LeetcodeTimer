var dataArray = [];
var setArray = new Set();
chrome.runtime.onStartup.addListener(function () {
    chrome.storage.local.get(['leetcode_timer_file']).then((result) => {
        var file = result.leetcode_timer_file;
        if (!file) {
            dataArray = [];
            setArray = new Set()
            chrome.storage.local.set({ "leetcode_timer_file": dataArray }).then(() => {
                console.log("The value is set")
            })
        }
        dataArray = file ? file : [];
        setArray = file ? new Set(file.map(item => item.questionTitle)) : new Set();
        console.log(setArray)
        console.log(dataArray)
    })
})
chrome.tabs.onActivated.addListener((tab) => {
    chrome.tabs.get(tab.tabId, function (tab) {
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

// ------------------------------------------- Data model -----------------

function CSVDataModel(questionTitle, questionUrl, timeTaken, date) {
    return {
        "questionTitle": questionTitle,
        "questionUrl": questionUrl,
        "timeTaken": timeTaken,
        "date": date
    }
}