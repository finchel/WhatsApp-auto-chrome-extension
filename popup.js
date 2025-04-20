document.addEventListener('DOMContentLoaded', function() {
  const extractButton = document.getElementById('extractNames');
  const resultsDiv = document.getElementById('results');
  const templateText = document.getElementById('templateText');
  const templateWarning = document.getElementById('templateWarning');
  
  // Load saved template if it exists
  loadSavedTemplate();
  
  // Save template text when it changes
  templateText.addEventListener('input', function() {
    const template = templateText.value;
    saveTemplate(template);
    validateTemplate(template);
    
    // Notify background script about template update to sync with content scripts
    chrome.runtime.sendMessage({
      action: "templateUpdated",
      template: template
    });
    
    // Also update in chrome.storage for content scripts
    chrome.storage.local.set({ nameExtractorTemplate: template });
  });
  
  extractButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      
      chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        function: extractFirstNames,
      }, (injectionResults) => {
        const firstNames = injectionResults[0].result;
        displayResults(firstNames);
      });
    });
  });
  
  function displayResults(firstNames) {
    resultsDiv.innerHTML = '';
    
    if (firstNames.length === 0) {
      resultsDiv.textContent = 'No names found on this page.';
      return;
    }
    
    const namesList = document.createElement('ul');
    firstNames.forEach(name => {
      const listItem = document.createElement('li');
      listItem.textContent = name;
      namesList.appendChild(listItem);
    });
    
    resultsDiv.appendChild(namesList);
  }
  
  // Function to save template to localStorage
  function saveTemplate(template) {
    localStorage.setItem('nameExtractorTemplate', template);
  }
  
  // Function to load saved template from localStorage
  function loadSavedTemplate() {
    const savedTemplate = localStorage.getItem('nameExtractorTemplate');
    if (savedTemplate) {
      templateText.value = savedTemplate;
      validateTemplate(savedTemplate);
    } else {
      // Set a default template
      const defaultTemplate = "Dear <name>, happy holidays and I wish you well";
      templateText.value = defaultTemplate;
      saveTemplate(defaultTemplate);
    }
  }
  
  // Function to validate that template contains a name placeholder
  function validateTemplate(template) {
    if (!template.includes('<name>') && !template.includes('<n>')) {
      templateWarning.style.display = 'block';
      templateWarning.textContent = 'Please include the <name> placeholder in your template.';
    } else {
      templateWarning.style.display = 'none';
    }
  }
});

// This function will be injected into the page to extract all names
function extractFirstNames() {
  // This will hold all our found names
  const firstNames = [];
  
  // Pattern 1: Look for names in spans with class _ao3e
  const nameSpans = document.querySelectorAll('div.x78zum5 span._ao3e');
  
  nameSpans.forEach(span => {
    // Skip if this is not the right kind of element
    if (!span.textContent || span.textContent.trim() === '') return;
    
    const fullName = span.textContent.trim();
    
    // Skip elements inside message bubbles
    const parentDiv = span.closest('div._akbu');
    if (parentDiv) return;
    
    // Skip elements with dir="rtl" (Hebrew text)
    if (span.getAttribute('dir') === 'rtl') return;
    
    // Skip spans containing "Status" or "Photo" or other non-name indicators
    if (fullName.includes('Status') || fullName.includes('Photo')) return;
    
    // Skip text that has more than 3 words (likely not a name)
    const wordCount = fullName.split(' ').filter(word => word.length > 0).length;
    if (wordCount > 3) return;
    
    // Get the first name (first word)
    const firstName = fullName.split(' ')[0];
    if (firstName && firstName.length > 1) { // Ensure it's not just a single character
      firstNames.push(firstName);
    }
  });
  
  // Pattern 2: Look for names in title attributes
  const titleSpans = document.querySelectorAll('span[title][dir="auto"]');
  
  titleSpans.forEach(span => {
    if (!span.title || span.title.trim() === '') return;
    
    const fullName = span.title.trim();
    
    // Skip text that has more than 3 words (likely not a name)
    const wordCount = fullName.split(' ').filter(word => word.length > 0).length;
    if (wordCount > 3) return;
    
    // Get the first name (first word)
    const firstName = fullName.split(' ')[0];
    if (firstName && firstName.length > 1) {
      // Check if this name is already in our list
      if (!firstNames.includes(firstName)) {
        firstNames.push(firstName);
      }
    }
  });
  
  // Pattern 3: Look for names in list items
  const listItems = document.querySelectorAll('div[role="listitem"]');
  
  listItems.forEach(item => {
    // Try to find the name span inside the list item
    const nameSpan = item.querySelector('span[dir="auto"][title]') || 
                    item.querySelector('span.x1iyjqo2.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft.x1rg5ohu._ao3e');
    
    if (nameSpan) {
      let fullName = nameSpan.textContent.trim();
      
      // If it has a title attribute, use that instead
      if (nameSpan.title && nameSpan.title.includes(' ')) {
        fullName = nameSpan.title.trim();
      }
      
      // Skip if it doesn't look like a name
      if (fullName.includes('Status') || fullName.includes('Photo')) return;
      
      // Skip text that has more than 3 words (likely not a name)
      const wordCount = fullName.split(' ').filter(word => word.length > 0).length;
      if (wordCount > 3) return;
      
      // Get the first name (first word)
      const firstName = fullName.split(' ')[0];
      if (firstName && firstName.length > 1) {
        // Check if this name is already in our list
        if (!firstNames.includes(firstName)) {
          firstNames.push(firstName);
        }
      }
    }
  });
  
  return firstNames;
}