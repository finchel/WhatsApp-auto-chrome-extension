// Set default templates on install/update, and re-inject content script
chrome.runtime.onInstalled.addListener(async () => {
  chrome.storage.local.get(['templateMale', 'templateFemale'], (result) => {
    if (!result.templateMale) {
      chrome.storage.local.set({
        templateMale: '<name> היקר, מאחל לך חג פסח שמח ושקט!',
        templateFemale: '<name> היקרה, מאחלת לך חג פסח שמח ושקט!'
      });
    }
  });

  // Re-inject content script into already-open WhatsApp tabs
  try {
    const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
    for (const tab of tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      }).catch(() => {}); // ignore tabs that can't be injected
    }
  } catch (err) {
    console.error('[WA-Msg] Failed to re-inject content script:', err);
  }
});