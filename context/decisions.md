# Decisions Log

## Architecture
- **Two separate templates** (male/female) instead of inline gender markers — Hebrew gender affects multiple words
- **execCommand('insertText')** for Lexical editor insertion — verified working March 2026
- **DataTransfer paste** as fallback if execCommand ever breaks
- **Group detection via aria-label** on input — only reliable method (sidebar icons unreliable)
- **300ms delay** after click before checking input to let WhatsApp switch chats
- **Shadow DOM** for overlay and toast — style isolation from WhatsApp CSS
- **chrome.storage.onChanged** for popup→content sync — no background relay needed
- **web_accessible_resources required** for names.json — content scripts can't fetch without it

## Naming
- Extension name: "WhatsApp Holiday Greeter" (user chose English over Hebrew)
- Template placeholder: `<name>` (changed from `<n>` in v1)

## Security
- All user-controlled strings use textContent/createElement, never innerHTML
- escapeHtml() helper for the one remaining template interpolation
- Import validation: 100-char max per field, 10K entry cap
- Explicit CSP in manifest
- No sensitive data in console logs

## Monetization
- Start free with PayPal donation link
- Consider freemium later via Gumroad/LemonSqueezy for premium features
- No ads — would get rejected and destroy trust

## Publishing
- Privacy policy at docs/privacy.html (needs GitHub Pages enabled)
- Landing page at docs/index.html
- Feedback via GitHub Issues
- Trademark disclaimer required in store listing
