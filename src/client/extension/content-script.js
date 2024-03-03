// contentScript.js
chrome.runtime.connect({ name: "contentScript" });

console.log('content script connected');
chrome.runtime.onStartup.addListener(function () {

    if (typeof window.solflare === 'undefined') {
        chrome.runtime.sendMessage({ message: 'Solflare wallet is not installed' });
    } else {
        chrome.runtime.sendMessage({ message: 'Solflare wallet is installed' });
    }
}
);
