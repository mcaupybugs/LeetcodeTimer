chrome.tabs.onActivated.addListener((tab) => {
    // Query the current active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTab = tabs[0];
      console.log(activeTab)
      console.log("Active Tab URL: ", activeTab.url);
      console.log("Active Tab Title: ", activeTab.title);
    });
  });