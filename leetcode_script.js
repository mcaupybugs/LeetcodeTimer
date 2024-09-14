document.getElementsByClassName('reset-button')[0].addEventListener('click', () => {
    console.log("button clicked")
    chrome.storage.local.remove(['leetcode_timer_file']).then((result) => {
        console.log("Cleared the data");
    })
})