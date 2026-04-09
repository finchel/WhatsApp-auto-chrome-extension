# Lessons Learned

## 2026-03-29 — v2.0 Development

### web_accessible_resources is REQUIRED for content script fetch
Chrome Extensions expert incorrectly said content scripts can access extension resources without `web_accessible_resources`. They cannot — `fetch(chrome.runtime.getURL('names.json'))` returns `net::ERR_FAILED` without the manifest entry. Always include it.

### WhatsApp DOM uses grid/row, not listitem
As of March 2026, chat list is `[role="grid"][aria-label="Chat list"]` with `[role="row"]` children. NOT `role="listitem"`. Verify selectors on live DOM before coding.

### WhatsApp uses Lexical editor — execCommand doesn't handle newlines
Message input has `data-lexical-editor="true"`. `execCommand('insertText')` works for single-line text but **drops newlines**. `execCommand('insertLineBreak')` also fails silently in Lexical. The working approach is a synthetic `ClipboardEvent('paste')` with a `DataTransfer` containing `text/plain` — Lexical's paste handler correctly converts `\n` to line breaks.

### Synthetic events: ClipboardEvent works, InputEvent doesn't
Dispatching `InputEvent('beforeinput', { inputType: 'insertFromPaste' })` does NOT trigger Lexical's paste handling — the event fires but nothing gets inserted. `ClipboardEvent('paste')` with `clipboardData` set via `DataTransfer` works because Lexical listens for native paste events and reads from `clipboardData`.

### aria-label strings are locale-dependent
Don't check for "type a message" — check for "to group"/"to channel" (and Hebrew equivalents "לקבוצה"/"לערוץ") to filter. Negative checks are more robust than positive checks.

### innerHTML with DOM-sourced data = XSS
Contact names from WhatsApp could contain HTML/script tags. Always use textContent or createElement, never innerHTML with dynamic data. This applies to toast, overlay, and popup name list.

### Consider the user's real workflow, not just the happy path
User's actual flow is two-pass: click all chats to paste greetings, then click again to review and send. Without a draft-detection guard (`input.innerText.trim().length > 0`), the greeting gets pasted twice. Always think through repeat interactions.

### Content script re-injection on extension reload
When an extension is reloaded via chrome://extensions, old content scripts die but the page keeps stale code in memory. The new content script only injects on fresh page loads. To avoid requiring a manual WhatsApp refresh, `background.js` can re-inject `content.js` into matching tabs on `runtime.onInstalled`.

### Read context/lessons.md BEFORE acting on security audit recommendations
When running automated security analysis (e.g., exploitation-validator), the LLM may recommend removing `web_accessible_resources` because "content scripts don't need it." This is WRONG — the project already documented (lesson #1 above) that WAR IS required for `fetch(chrome.runtime.getURL())` in content scripts. Always cross-check audit recommendations against existing lessons before applying fixes. This mistake led to a commit that had to be immediately reverted.

### VULN-006 (WAR fingerprinting) is a known acceptable trade-off
The WAR declaration for names.json is required for functionality and scoped to `web.whatsapp.com/*` only. Extension fingerprinting via WAR is an accepted trade-off. Don't try to "fix" this again.

### Most WhatsApp chats have profile photos
Only 5/70 chats had default `data-icon` (group-refreshed/contact-refreshed). Cannot rely on sidebar icons to distinguish 1:1 from group. Use aria-label on message input instead.
