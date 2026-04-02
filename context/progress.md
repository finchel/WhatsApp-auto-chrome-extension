# Progress — WhatsApp Holiday Greeter

## Last Session: 2026-04-01/02

### Completed
- [x] Full v2.0 rewrite of extension (content.js, popup.html, popup.js, manifest.json, background.js)
- [x] Created 776-entry names.json (English→Hebrew with gender)
- [x] Verified WhatsApp Web DOM selectors via live Chrome MCP inspection
- [x] Gender-aware templates (male/female)
- [x] Hebrew name gender detection (suffix heuristics + override table)
- [x] Unknown name overlay with save to chrome.storage
- [x] Group/channel skip via aria-label
- [x] Import/export saved names
- [x] Custom icon (green speech bubble)
- [x] Security hardening (3 XSS fixes, input validation, CSP, console sanitization)
- [x] Privacy policy page (docs/privacy.html)
- [x] Landing page with walkthrough (docs/index.html)
- [x] PayPal donation link + GitHub Issues link in popup
- [x] All committed and pushed to https://github.com/finchel/WhatsApp-auto-chrome-extension

### Pending — Chrome Web Store Submission
- [ ] Enable GitHub Pages on repo (docs/ folder, main branch)
- [ ] Verify PayPal.me URL is correct (paypal.me/finchel)
- [ ] Capture 3-5 screenshots at 1280x800
- [ ] Optional: create 440x280 promo tile
- [ ] Change manifest version to "1.0.0"
- [ ] Register CWS developer account ($5)
- [ ] Create ZIP (manifest.json, background.js, content.js, popup.html, popup.js, names.json, images/)
- [ ] Submit with English+Hebrew descriptions, privacy policy URL, screenshots

### Recently Fixed (2026-04-01)
- [x] Multiline messages now preserve line breaks (ClipboardEvent paste approach)
- [x] Two-pass workflow: skip insertion when editor has a draft

### Known Issues / Polish
- Icon text "ברכה" not readable at 16px (expected — too small)
- Some common Israeli names may still be missing from dictionary (user can add via overlay)
- Landing page CTA button href is "#" — needs Chrome Web Store URL once published
- Extension reload requires manual WhatsApp Web refresh (could add auto re-injection in background.js)
- Git push auth: DanielFinchel account lacks push access to finchel/WhatsApp-auto-chrome-extension

### Blocked On
- Nothing — ready to proceed with store submission when user returns
