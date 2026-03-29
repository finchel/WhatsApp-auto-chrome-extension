// Set default templates on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['templateMale', 'templateFemale'], (result) => {
    if (!result.templateMale) {
      chrome.storage.local.set({
        templateMale: '<name> היקר, מאחל לך חג פסח שמח ושקט!',
        templateFemale: '<name> היקרה, מאחלת לך חג פסח שמח ושקט!'
      });
    }
  });
});