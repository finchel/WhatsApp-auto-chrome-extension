// =============================================================================
// WhatsApp Personalized Hebrew Message Extension - Content Script
// =============================================================================

let nameDictionary = {};
let userNames = {};
let templateMale = '<name> היקר, מאחל לך חג פסח שמח ושקט!';
let templateFemale = '<name> היקרה, מאחלת לך חג פסח שמח ושקט!';
let lastClickTime = 0;
const DEBOUNCE_MS = 1000;

// =============================================================================
// Initialization
// =============================================================================

async function initialize() {
  try {
    const resp = await fetch(chrome.runtime.getURL('names.json'));
    nameDictionary = await resp.json();
    console.log(`[WA-Msg] Loaded ${Object.keys(nameDictionary).length} names from dictionary`);
  } catch (err) {
    console.error('[WA-Msg] Failed to load names.json:', err);
  }

  try {
    const stored = await chrome.storage.local.get(['userNames', 'templateMale', 'templateFemale']);
    userNames = stored.userNames || {};
    if (stored.templateMale) templateMale = stored.templateMale;
    if (stored.templateFemale) templateFemale = stored.templateFemale;
    console.log(`[WA-Msg] Loaded ${Object.keys(userNames).length} user-saved names`);
  } catch (err) {
    console.error('[WA-Msg] Failed to load from storage:', err);
  }

  // Listen for template/name changes from popup
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.templateMale) templateMale = changes.templateMale.newValue;
    if (changes.templateFemale) templateFemale = changes.templateFemale.newValue;
    if (changes.userNames) userNames = changes.userNames.newValue || {};
  });

  // Attach click listener (capture phase)
  document.addEventListener('click', handleChatClick, true);
  console.log('[WA-Msg] Extension initialized');
}

// =============================================================================
// Name Lookup
// =============================================================================

function isHebrew(text) {
  return /[\u0590-\u05FF]/.test(text);
}

function isPhoneNumber(text) {
  return /^\+?\d[\d\s\-()]+$/.test(text.trim());
}

function stripEmojis(text) {
  return text.replace(/[\u{1F600}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}✅️⭐❤️]/gu, '').trim();
}

function extractFirstName(fullName) {
  const cleaned = stripEmojis(fullName).trim();
  if (!cleaned) return null;
  // For single-word names, use the whole thing
  const parts = cleaned.split(/\s+/);
  return parts[0];
}

function lookupName(firstName) {
  const key = firstName.toLowerCase().trim();
  // User names take priority over built-in dictionary
  return userNames[key] || nameDictionary[key] || null;
}

// =============================================================================
// Hebrew Name Gender Detection
// =============================================================================

// Common Hebrew names that are exceptions to suffix rules
const HEBREW_GENDER_OVERRIDES = {
  // Males ending in ה that would be guessed as female
  'משה': 'm', 'אריה': 'm', 'עזרא': 'm', 'זכריה': 'm', 'עובדיה': 'm',
  'נחמיה': 'm', 'ישעיה': 'm', 'ירמיה': 'm', 'הושע': 'm', 'יונה': 'm',
  'סימחה': 'm', 'שמחה': 'm',
  // Females that might be guessed wrong
  'נועם': 'f', 'ענת': 'f', 'רות': 'f', 'ליאת': 'f', 'אורית': 'f',
  'מיכל': 'f', 'יעל': 'f', 'רחל': 'f', 'אביגיל': 'f', 'עדי': 'f',
  'שי': 'm', 'גיא': 'm', 'בועז': 'm', 'עמית': 'm', 'רועי': 'm',
  // Unisex - default to most common usage
  'טל': 'm', 'חן': 'f', 'שחר': 'm', 'ליאור': 'm', 'עומר': 'm',
  'רותם': 'f', 'אגם': 'f', 'הלל': 'm', 'ארז': 'm', 'נועה': 'f',
};

function guessHebrewGender(hebrewName) {
  const name = hebrewName.trim();

  // Check overrides first
  if (HEBREW_GENDER_OVERRIDES[name]) return HEBREW_GENDER_OVERRIDES[name];

  // Also check user-saved names (they might have Hebrew keys)
  const userEntry = userNames[name];
  if (userEntry) return userEntry.gender;

  // Suffix-based heuristics for Hebrew names
  // Strong female indicators
  if (name.endsWith('ית')) return 'f';  // דורית, שלומית, רונית
  if (name.endsWith('לה')) return 'f';  // יעלה, גילה
  if (name.endsWith('לי')) return 'f';  // טלי, נטלי, רותלי
  if (name.endsWith('ני')) return 'f';  // רוני, דני (ambiguous but more common female)
  if (name.endsWith('רה')) return 'f';  // שרה, דבורה, אורה
  if (name.endsWith('נה')) return 'f';  // דינה, רינה, חנה
  if (name.endsWith('קה')) return 'f';  // רבקה, מלכה, ריקה
  if (name.endsWith('לה')) return 'f';  // גילה, דליה
  if (name.endsWith('פה')) return 'f';  // יפה
  if (name.endsWith('צה')) return 'f';  // רצה
  if (name.endsWith('תה')) return 'f';  // ...
  if (name.endsWith('פת')) return 'f';  // רקפת
  if (name.endsWith('דה')) return 'f';  // עידה

  // Names ending in ה are often female (but with exceptions caught above)
  if (name.endsWith('ה') && name.length > 2) return 'f';

  // Default to masculine
  return 'm';
}

// =============================================================================
// Message Building
// =============================================================================

function buildMessage(hebrewName, gender) {
  const effectiveGender = gender || 'm';
  const template = effectiveGender === 'f' ? templateFemale : templateMale;
  return template.replace(/<name>/g, () => hebrewName);
}

// =============================================================================
// WhatsApp DOM Interaction
// =============================================================================

function findMessageInput() {
  return document.querySelector('[data-lexical-editor="true"]')
    || document.querySelector('div[contenteditable="true"][data-tab="10"]')
    || document.querySelector('div[contenteditable="true"][role="textbox"]');
}

function waitForMessageInput(timeout = 3000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      const el = findMessageInput();
      if (el) {
        resolve(el);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Message input not found'));
        return;
      }

      setTimeout(check, 150);
    }

    check();
  });
}

function isOneOnOneChat(input) {
  const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
  console.log('[WA-Msg] Input aria-label:', ariaLabel);

  // English: "type a message to group X" / "to channel X"
  if (ariaLabel.includes('to group ') || ariaLabel.includes('to channel ')) return false;
  // Hebrew: "הקלד הודעה לקבוצה" (group) / "הקלד הודעה לערוץ" (channel)
  if (ariaLabel.includes('לקבוצה') || ariaLabel.includes('לערוץ')) return false;

  // If it's a contenteditable with role="textbox", it's a valid chat input
  // No need to verify the exact "type a message" string which varies by locale
  return true;
}

function insertIntoMessageInput(input, text) {
  input.focus();

  // Place cursor at end
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(input);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);

  // Primary: execCommand (verified working with WhatsApp's Lexical editor)
  const success = document.execCommand('insertText', false, text);

  if (!success) {
    console.warn('[WA-Msg] execCommand failed, using DataTransfer fallback');
    const dt = new DataTransfer();
    dt.setData('text/plain', text);

    const beforeInput = new InputEvent('beforeinput', {
      inputType: 'insertFromPaste',
      dataTransfer: dt,
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    if (input.dispatchEvent(beforeInput)) {
      const textNode = document.createTextNode(text);
      const r = sel.getRangeAt(0);
      r.deleteContents();
      r.insertNode(textNode);
      r.setStartAfter(textNode);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);

      input.dispatchEvent(new InputEvent('input', {
        inputType: 'insertFromPaste',
        dataTransfer: dt,
        bubbles: true,
        composed: true,
      }));
    }
  }

  return true;
}

// =============================================================================
// Click Handler
// =============================================================================

async function handleChatClick(event) {
  // Find the chat row
  const row = event.target.closest('[role="row"]');
  if (!row) return;

  // Must be inside the chat list grid
  const grid = row.closest('[role="grid"]');
  if (!grid) return;

  // Debounce rapid clicks
  const now = Date.now();
  if (now - lastClickTime < DEBOUNCE_MS) return;
  lastClickTime = now;

  // Extract contact name from the row
  const nameSpan = row.querySelector('span[title][dir="auto"]');
  if (!nameSpan) return;

  const fullName = nameSpan.getAttribute('title').trim();
  if (!fullName || fullName.length < 2) return;

  // Skip phone numbers
  if (isPhoneNumber(fullName)) {
    console.log('[WA-Msg] Skipping phone number contact');
    return;
  }

  const firstName = extractFirstName(fullName);
  if (!firstName || firstName.length < 2) return;

  console.log('[WA-Msg] Processing chat click');

  try {
    // Small delay to let WhatsApp start switching chats
    await new Promise(r => setTimeout(r, 300));

    // Wait for the chat to open and message input to appear
    const input = await waitForMessageInput();

    // Only process 1:1 chats
    if (!isOneOnOneChat(input)) {
      console.log('[WA-Msg] Skipping non-1:1 chat');
      return;
    }

    // Check if name is already Hebrew
    if (isHebrew(firstName)) {
      const gender = guessHebrewGender(firstName);
      const message = buildMessage(firstName, gender);
      insertIntoMessageInput(input, message);
      showToast(`✓ ${firstName} (${gender === 'f' ? 'נ' : 'ז'})`);
      return;
    }

    // Look up in dictionary
    const entry = lookupName(firstName);

    if (entry) {
      const message = buildMessage(entry.he, entry.gender);
      insertIntoMessageInput(input, message);
      showToast(`✓ ${firstName} → ${entry.he}`);
    } else {
      // Show overlay for unknown name
      showUnknownNameOverlay(firstName, (hebrewName, gender) => {
        if (hebrewName) {
          const message = buildMessage(hebrewName, gender);
          // Re-find input in case DOM changed
          const currentInput = document.querySelector('[data-lexical-editor="true"]')
            || document.querySelector('div[contenteditable="true"][data-tab="10"]');
          if (currentInput) {
            insertIntoMessageInput(currentInput, message);
            showToast(`✓ ${firstName} → ${hebrewName} (saved)`);
          }
        }
      });
    }
  } catch (err) {
    console.error('[WA-Msg] Error processing chat click:', err);
  }
}

// =============================================================================
// Security Helpers
// =============================================================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =============================================================================
// Toast Notification
// =============================================================================

function showToast(message) {
  // Remove existing toast
  const existing = document.getElementById('wa-msg-toast-host');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'wa-msg-toast-host';
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00a884;
        color: white;
        padding: 10px 18px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        z-index: 10000000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        direction: rtl;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
  `;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  shadow.appendChild(style);
  shadow.appendChild(toast);

  document.body.appendChild(host);

  // Fade in
  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  // Fade out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => host.remove(), 300);
  }, 3000);
}

// =============================================================================
// Unknown Name Overlay
// =============================================================================

function showUnknownNameOverlay(englishName, onComplete) {
  // Remove any existing overlay
  const existing = document.getElementById('wa-msg-overlay-host');
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = 'wa-msg-overlay-host';
  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      .backdrop {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.4);
        z-index: 9999999;
      }
      .overlay {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        z-index: 10000000;
        font-family: Arial, sans-serif;
        direction: rtl;
        min-width: 300px;
        text-align: right;
      }
      h3 {
        margin: 0 0 16px 0;
        color: #111b21;
        font-size: 16px;
      }
      .english-name {
        color: #00a884;
        font-weight: bold;
      }
      label {
        display: block;
        margin-bottom: 6px;
        color: #54656f;
        font-size: 14px;
      }
      input[type="text"] {
        width: 100%;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #d1d7db;
        border-radius: 8px;
        direction: rtl;
        margin-bottom: 12px;
        box-sizing: border-box;
        outline: none;
      }
      input[type="text"]:focus {
        border-color: #00a884;
      }
      .gender-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        font-size: 14px;
        color: #111b21;
      }
      .gender-row label {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        color: #111b21;
      }
      .buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-start;
      }
      button {
        padding: 8px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        font-weight: bold;
      }
      .save-btn {
        background: #00a884;
        color: white;
      }
      .save-btn:hover {
        background: #008f72;
      }
      .skip-btn {
        background: #f0f2f5;
        color: #54656f;
      }
      .skip-btn:hover {
        background: #e2e5e9;
      }
    </style>
    <div class="backdrop"></div>
    <div class="overlay">
      <h3>שם לא נמצא: <span class="english-name">${escapeHtml(englishName)}</span></h3>
      <label>שם בעברית:</label>
      <input type="text" id="hebrew-input" placeholder="הקלידו את השם בעברית" />
      <div class="gender-row">
        <label><input type="radio" name="gender" value="m" checked /> זכר</label>
        <label><input type="radio" name="gender" value="f" /> נקבה</label>
      </div>
      <div class="buttons">
        <button class="save-btn" id="save-btn">שמור והשתמש</button>
        <button class="skip-btn" id="skip-btn">דלג</button>
      </div>
    </div>
  `;

  document.body.appendChild(host);

  const hebrewInput = shadow.getElementById('hebrew-input');
  const saveBtn = shadow.getElementById('save-btn');
  const skipBtn = shadow.getElementById('skip-btn');
  const backdrop = shadow.querySelector('.backdrop');

  // Focus the input
  setTimeout(() => hebrewInput.focus(), 100);

  function cleanup() {
    host.remove();
  }

  saveBtn.addEventListener('click', async () => {
    const hebrewName = hebrewInput.value.trim();
    if (!hebrewName || hebrewName.length > 100) {
      hebrewInput.style.borderColor = '#dc3545';
      return;
    }
    const gender = shadow.querySelector('input[name="gender"]:checked').value;

    // Save to storage
    try {
      const stored = await chrome.storage.local.get('userNames');
      const names = stored.userNames || {};
      names[englishName.toLowerCase()] = { he: hebrewName, gender };
      await chrome.storage.local.set({ userNames: names });
      userNames = names; // Update local cache
    } catch (err) {
      console.error('[WA-Msg] Failed to save user name:', err);
    }

    cleanup();
    onComplete(hebrewName, gender);
  });

  skipBtn.addEventListener('click', () => {
    cleanup();
    onComplete(englishName, 'm'); // Use English name with default masculine
  });

  backdrop.addEventListener('click', () => {
    cleanup();
    onComplete(null, null); // Cancel
  });

  // Enter key saves
  hebrewInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
    if (e.key === 'Escape') backdrop.click();
  });
}

// =============================================================================
// Start
// =============================================================================

initialize();
