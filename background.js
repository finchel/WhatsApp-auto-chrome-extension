// Background script to handle messages between content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward the message to the popup
  if (message.action === "nameClicked") {
    try {
      chrome.runtime.sendMessage(message).catch(err => {
        console.log('Error forwarding nameClicked message:', err.message);
      });
    } catch (error) {
      console.log('Error sending nameClicked message:', error.message);
    }
  }
  
  // Handle template requests from content script
  if (message.action === "getTemplate") {
    // Get template from localStorage and send it to content script
    chrome.storage.local.get(['nameExtractorTemplate'], function(result) {
      if (result.nameExtractorTemplate) {
        // Send template to the content script
        if (sender.tab && sender.tab.id) {
          try {
            chrome.tabs.sendMessage(sender.tab.id, {
              action: "updateTemplate",
              template: result.nameExtractorTemplate
            }).catch(err => {
              console.log(`Error sending template to tab ${sender.tab.id}:`, err.message);
            });
          } catch (error) {
            console.log(`Error sending template to tab ${sender.tab.id}:`, error.message);
          }
        }
      }
    });
    // Always send a response to avoid "The message port closed before a response was received" error
    sendResponse({status: "processing"});
    return true; // Keep the message channel open for the async response
  }
  
  // Handle template updates from popup
  if (message.action === "templateUpdated" && message.template) {
    // Save the template to storage
    chrome.storage.local.set({ nameExtractorTemplate: message.template });
    
    // Send the updated template to all content scripts in open tabs
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateTemplate",
            template: message.template
          }).catch(err => {
            // Ignore errors for tabs where content script isn't loaded
            console.log(`Could not update template in tab ${tab.id}`);
          });
        } catch (error) {
          // Catch any errors during message sending
          console.log(`Error sending message to tab ${tab.id}: ${error.message}`);
        }
      });
    });
  }
});

// When the extension is installed or updated
chrome.runtime.onInstalled.addListener(function(details) {
  // Set default template if it doesn't exist
  chrome.storage.local.get(['nameExtractorTemplate'], function(result) {
    if (!result.nameExtractorTemplate) {
      chrome.storage.local.set({
        nameExtractorTemplate: "Dear <n>, happy holidays and I wish you well"
      });
    }
  });
});