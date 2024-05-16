// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Show the demo page once the extension is installed
chrome.runtime.onInstalled.addListener((_reason) => {
  console.log('Extension installed');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && /^http/.test(tab.url)) {
    // @ts-ignore
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content-script.js']
    });
  }
});