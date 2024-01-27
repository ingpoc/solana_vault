chrome.runtime.onInstalled.addListener(() => {
    // Initialize your password storage here
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPasswords') {
        // Fetch passwords from storage and send them to the popup script
    }
});
