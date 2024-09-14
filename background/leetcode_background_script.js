const CSV_FILE_NAME = 'leetcode_timer.csv';
chrome.runtime.onStartup.addListener(function(){
    
})
chrome.tabs.onActivated.addListener((tab) => {
    chrome.storage.local.get(CSV_FILE_NAME).then((result)=>{
        var file = result.CSV_FILE_NAME;
        if(!file){
            var data = ConvertRawArrayToCSV(csvHeadings);
            console.log([data])
            const file_blob = new Blob([data], {type: 'text/csv;charset=utf-8,'})
            chrome.storage.local.set(CSV_FILE_NAME, file_blob)
        }
        console.log(result.CSV_FILE_NAME)
        console.log("running")
    })
    chrome.tabs.get(tab.tabId, function(tab){
        var pageTitle = tab.title
        var pageUrl = tab.url
        if(checkLeetcodePage(pageUrl)){

        }
    })
  });

// Add all the check conditions in this file
function checkLeetcodePage(url){
    if(url.includes("https://leetcode.com/problems/")){
        return true;
    }
    return false;
}

// ------------------------------------ Converting the data oprations --------------

function ConvertDataModelArrayToCSV(data){
    let csvContent = ''
    csvContent += data.questionTitle + ',\n';
    csvContent+=data.questionUrl + ',\n';
    csvContent += data.timeTaken + ',\n';
    csvContent += data.date + ',\n';

    return csvContent;
}

function ConvertRawArrayToCSV(data){
    let csvContent = ''

    data.forEach(element => {
        csvContent += element + ',\n';
    });
    return csvContent;
}

// ------------------------------------------- Data model -----------------

const csvHeadings = ['Question Title', 'Question Url', 'Time Taken', 'Date']

function CSVDataModel(questionTitle, questionUrl, timeTaken, date){
    var data = {}

    data.questionTitle = questionTitle;
    data.questionUrl = questionUrl;
    data.timeTaken = timeTaken;
    data.date = date;

    return data;
}