# Lessons Learned

## 2026-03-29 — v2.0 Development

### web_accessible_resources is REQUIRED for content script fetch
Chrome Extensions expert incorrectly said content scripts can access extension resources without `web_accessible_resources`. They cannot — `fetch(chrome.runtime.getURL('names.json'))` returns `net::ERR_FAILED` without the manifest entry. Always include it.

### WhatsApp DOM uses grid/row, not listitem
As of March 2026, chat list is `[role="grid"][aria-label="Chat list"]` with `[role="row"]` children. NOT `role="listitem"`. Verify selectors on live DOM before coding.

### WhatsApp uses Lexical editor
Message input has `data-lexical-editor="true"`. Despite this, `execCommand('insertText')` still works and correctly activates the Send button.

### aria-label strings are locale-dependent
Don't check for "type a message" — check for "to group"/"to channel" (and Hebrew equivalents "לקבוצה"/"לערוץ") to filter. Negative checks are more robust than positive checks.

### innerHTML with DOM-sourced data = XSS
Contact names from WhatsApp could contain HTML/script tags. Always use textContent or createElement, never innerHTML with dynamic data. This applies to toast, overlay, and popup name list.

### Most WhatsApp chats have profile photos
Only 5/70 chats had default `data-icon` (group-refreshed/contact-refreshed). Cannot rely on sidebar icons to distinguish 1:1 from group. Use aria-label on message input instead.
