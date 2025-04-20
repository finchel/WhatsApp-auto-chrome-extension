// Create a more robust floating display that's less likely to be affected by page styles
function createFloatingDisplay() {
  let display = document.getElementById('name-extractor-display');
  
  // If the display already exists, remove it and create a new one
  // This helps if there were any issues with the previous instance
  if (display) {
    display.remove();
  }
  
  // Create a new display element with more robust styling
  display = document.createElement('div');
  display.id = 'name-extractor-display';
  
  // Use !important to override any possible conflicting styles
  display.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background-color: #4285F4 !important;
    color: white !important;
    padding: 10px 15px !important;
    border-radius: 4px !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
    z-index: 9999999 !important;
    font-family: Arial, sans-serif !important;
    font-size: 16px !important;
    font-weight: bold !important;
    opacity: 0 !important;
    transition: opacity 0.3s !important;
    pointer-events: auto !important;
    display: flex !important;
    align-items: center !important;
    flex-direction: column !important;
  `;
  
  // Create content container
  const content = document.createElement('span');
  content.id = 'name-extractor-content';
  content.style.cssText = `
    margin-right: 10px !important;
    color: white !important;
    font-size: 16px !important;
  `;
  
  // Add clipboard notification
  const clipboard = document.createElement('span');
  clipboard.id = 'name-extractor-clipboard';
  clipboard.style.cssText = `
    font-size: 12px !important;
    margin-top: 5px !important;
    color: white !important;
    opacity: 0.8 !important;
  `;
  clipboard.textContent = 'Personalized message copied to clipboard!';
  
  // Create close button
  const closeButton = document.createElement('span');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    cursor: pointer !important;
    font-size: 20px !important;
    font-weight: bold !important;
    color: white !important;
    position: absolute !important;
    top: 5px !important;
    right: 10px !important;
  `;
  
  closeButton.addEventListener('click', function(e) {
    e.stopPropagation();
    display.style.opacity = '0';
  });
  
  display.appendChild(content);
  display.appendChild(clipboard);
  display.appendChild(closeButton);
  document.body.appendChild(display);
  
  // Add a simple click function to help with debugging
  display.addEventListener('click', function() {
    console.log('Name display clicked');
  });
  
  return display;
}

// Initialize the display as soon as the script loads
const display = createFloatingDisplay();

// Function to copy text to clipboard
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    console.log('Attempting to copy to clipboard:', text);
    
    // The new Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          console.log('Text copied to clipboard successfully using Clipboard API');
          resolve(true);
        })
        .catch(err => {
          console.error('Error copying text using Clipboard API', err);
          // Fall back to execCommand method
          tryExecCommandCopy(text, resolve);
        });
    } else {
      // Fallback for browsers that don't support the Clipboard API
      tryExecCommandCopy(text, resolve);
    }
  });
}

// Helper function for execCommand copy fallback
function tryExecCommandCopy(text, resolve) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style.padding = '0';
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';
  textArea.style.background = 'transparent';
  document.body.appendChild(textArea);
  
  try {
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful) {
      console.log('Text copied to clipboard successfully using execCommand');
      resolve(true);
    } else {
      console.error('Unable to copy text to clipboard using execCommand');
      resolve(false);
    }
  } catch (err) {
    document.body.removeChild(textArea);
    console.error('Error copying text using execCommand', err);
    resolve(false);
  }
}

// Global variable to hold the current template and a fallback for RTL text
let currentTemplate = "Dear <n>, happy holidays and I wish you well";
// Hebrew default template for RTL support
let rtlDefaultTemplate = "חג שמח <n> יקרה!";

// Function to detect if text is RTL (Hebrew, Arabic, etc.)
function isRTL(text) {
  // Check for Hebrew or Arabic characters
  return /[\u0590-\u05FF\u0600-\u06FF]/.test(text);
}

// Store the template in local storage for recovery from extension context invalidation
function storeTemplateLocally(template) {
  try {
    localStorage.setItem('name-extractor-template', template);
    console.log('Template stored in local storage:', template);
  } catch (error) {
    console.error('Error storing template in local storage:', error);
  }
}

// Get template from local storage (as backup if chrome.storage fails)
function getLocalTemplate() {
  try {
    const template = localStorage.getItem('name-extractor-template');
    if (template) {
      console.log('Retrieved template from local storage:', template);
      return template;
    }
  } catch (error) {
    console.error('Error getting template from local storage:', error);
  }
  return null;
}

// Function to get saved template with fallback mechanisms
function getSavedTemplate() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['nameExtractorTemplate'], function(result) {
        if (chrome.runtime.lastError) {
          console.warn('Chrome storage error:', chrome.runtime.lastError);
          // Try fallback to localStorage
          const localTemplate = getLocalTemplate();
          if (localTemplate) {
            resolve(localTemplate);
          } else {
            // If we have no template, check if we need RTL default
            const documentDir = document.dir || document.documentElement.dir;
            if (documentDir === 'rtl') {
              resolve(rtlDefaultTemplate);
            } else {
              resolve(currentTemplate); // Use the current cached template
            }
          }
          return;
        }
        
        if (result.nameExtractorTemplate) {
          // Store the template locally as backup
          storeTemplateLocally(result.nameExtractorTemplate);
          resolve(result.nameExtractorTemplate);
        } else {
          // Try fallback to localStorage
          const localTemplate = getLocalTemplate();
          if (localTemplate) {
            resolve(localTemplate);
          } else {
            // If we have no template, check if we need RTL default
            const documentDir = document.dir || document.documentElement.dir;
            if (documentDir === 'rtl') {
              resolve(rtlDefaultTemplate);
            } else {
              resolve(currentTemplate); // Use the current cached template
            }
          }
        }
      });
    } catch (error) {
      console.warn('Error in getSavedTemplate:', error);
      // Try fallback to localStorage
      const localTemplate = getLocalTemplate();
      if (localTemplate) {
        resolve(localTemplate);
      } else {
        // If that fails too, use the cached template
        resolve(currentTemplate);
      }
    }
  });
}

// Function to show a name in the display and copy personalized message to clipboard
async function showName(name) {
  console.log('showName called with:', name);
  
  const contentElement = document.getElementById('name-extractor-content');
  if (!contentElement) {
    console.error('Content element not found');
    return;
  }
  
  contentElement.textContent = name;
  
  const display = document.getElementById('name-extractor-display');
  if (!display) {
    console.error('Display element not found');
    return;
  }
  
  // Make display visible
  display.style.opacity = '1';
  
  // Get template with fallbacks for extension context invalidation
  let template = currentTemplate; // Start with cached template
  
  try {
    // Try to get the latest template with our robust method
    const latestTemplate = await getSavedTemplate();
    if (latestTemplate) {
      template = latestTemplate;
      currentTemplate = latestTemplate; // Update our cache
    }
  } catch (error) {
    console.warn('Using fallback template due to error:', error);
  }
  
  console.log('Using template:', template);
  
  // Replace placeholder with actual name
  let personalizedMessage = template;
  
  if (template.includes('<n>')) {
    personalizedMessage = template.replace(/<n>/g, name);
    console.log('Replaced <n> placeholder');
  } else {
    console.warn('Template does not contain <n> placeholder. Adding name at the beginning.');
    // If no placeholder, add the name at the beginning
    personalizedMessage = name + ", " + template;
  }
  
  // Copy the personalized message to clipboard
  console.log('Personalized message to copy:', personalizedMessage);
  const clipboardSuccess = await copyToClipboard(personalizedMessage);
  
  // Update clipboard notification text based on success
  const clipboardElement = document.getElementById('name-extractor-clipboard');
  if (clipboardElement) {
    if (clipboardSuccess) {
      clipboardElement.textContent = 'Personalized message copied to clipboard!';
      clipboardElement.style.color = 'white';
    } else {
      clipboardElement.textContent = 'Failed to copy to clipboard. Please try again.';
      clipboardElement.style.color = '#ffcccc';
    }
  }
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    display.style.opacity = '0';
  }, 5000);
  
  // Try to notify background script, but don't fail if context is invalidated
  try {
    chrome.runtime.sendMessage({
      action: "nameClicked",
      name: name,
      message: personalizedMessage
    }, response => {
      if (chrome.runtime.lastError) {
        console.log('Error sending message to background (normal if extension reloaded):', 
                   chrome.runtime.lastError.message);
      }
    });
  } catch (error) {
    console.log('Could not send message to background (normal if extension reloaded):', error);
    // This is expected if the extension context is invalidated, so no need to handle further
  }
}

// Initialize by trying to load the template from various sources
function initializeTemplates() {
  console.log('Initializing templates...');
  
  // First try chrome storage (will work if extension context is valid)
  try {
    chrome.storage.local.get(['nameExtractorTemplate'], function(result) {
      if (chrome.runtime.lastError) {
        console.warn('Chrome storage error during init:', chrome.runtime.lastError);
        loadFromLocalStorageFallback();
        return;
      }
      
      if (result.nameExtractorTemplate) {
        currentTemplate = result.nameExtractorTemplate;
        // Also save to localStorage for backup
        storeTemplateLocally(currentTemplate);
        console.log('Loaded template from chrome.storage:', currentTemplate);
      } else {
        loadFromLocalStorageFallback();
      }
    });
  } catch (error) {
    console.warn('Error accessing chrome storage:', error);
    loadFromLocalStorageFallback();
  }
  
  function loadFromLocalStorageFallback() {
    // Try to get from localStorage as fallback
    const localTemplate = getLocalTemplate();
    if (localTemplate) {
      currentTemplate = localTemplate;
      console.log('Loaded template from localStorage fallback:', currentTemplate);
    } else {
      // Choose appropriate default based on page direction
      const documentDir = document.dir || document.documentElement.dir;
      if (documentDir === 'rtl') {
        currentTemplate = rtlDefaultTemplate;
        console.log('Using RTL default template');
      } else {
        // Keep the existing default
        console.log('Using default template:', currentTemplate);
      }
    }
  }
}

// Run the initialization
initializeTemplates();

// Try to establish listener for messages if extension context is valid
try {
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Always send a response
    sendResponse({status: "received"});
    
    if (message.action === "updateTemplate" && message.template) {
      // Update both storage locations
      try {
        // Update chrome storage
        chrome.storage.local.set({ nameExtractorTemplate: message.template });
        // Also update localStorage for failsafe
        storeTemplateLocally(message.template);
        // Update our in-memory cache
        currentTemplate = message.template;
        console.log('Template updated in content script:', message.template);
      } catch (error) {
        console.log('Error saving template:', error);
      }
    }
    
    // Return true to allow async response
    return true;
  });
  
  // Request the template if we can
  chrome.runtime.sendMessage({ action: "getTemplate" }, response => {
    if (chrome.runtime.lastError) {
      console.log('Error requesting template (normal if extension reloaded):', 
                 chrome.runtime.lastError.message);
    }
  });
  
  console.log('Message listeners initialized');
} catch (error) {
  console.log('Could not establish message listeners (normal if extension reloaded):', error);
}

// Set up click listeners with more robust selectors
document.addEventListener('click', function(event) {
  // Try multiple methods to find name elements
  
  // Method 1: Direct click on a name span
  if (event.target.classList.contains('_ao3e') && event.target.getAttribute('dir') !== 'rtl') {
    const name = event.target.textContent.trim().split(' ')[0];
    if (name && name.length > 1) {
      showName(name);
      console.log('Method 1 found name:', name);
      return;
    }
  }
  
  // Method 2: Check for any element with a title that looks like a name
  const closestWithTitle = event.target.closest('[title]');
  if (closestWithTitle && closestWithTitle.title && closestWithTitle.title.includes(' ')) {
    const title = closestWithTitle.title.trim();
    if (title && !title.includes('Status') && !title.includes('Photo')) {
      const words = title.split(' ');
      if (words.length <= 3) {
        const name = words[0];
        if (name && name.length > 1) {
          showName(name);
          console.log('Method 2 found name:', name);
          return;
        }
      }
    }
  }
  
  // Method 3: List item with a name inside
  const listItem = event.target.closest('[role="listitem"]');
  if (listItem) {
    // Try different selectors to find the name
    const nameSpans = [
      ...listItem.querySelectorAll('span[dir="auto"][title]'),
      ...listItem.querySelectorAll('span._ao3e'),
      ...listItem.querySelectorAll('span.x1iyjqo2')
    ];
    
    for (const span of nameSpans) {
      let name = '';
      
      // Try title attribute first, then text content
      if (span.title && span.title.includes(' ')) {
        name = span.title.trim().split(' ')[0];
      } else if (span.textContent) {
        name = span.textContent.trim().split(' ')[0];
      }
      
      if (name && name.length > 1 && !name.includes('Status') && !name.includes('Photo')) {
        showName(name);
        console.log('Method 3 found name:', name);
        return;
      }
    }
  }
});

// Log that the script has loaded
console.log('First Name Extractor content script loaded and running with resilient mode');