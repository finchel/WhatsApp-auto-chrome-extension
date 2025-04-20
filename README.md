# WhatsApp-auto-chrome-extension

A Chrome extension that extracts first names from WhatsApp Web chats and creates personalized messages using customizable templates.

## Installation Instructions

### From GitHub
1. Clone this repository or download it as a ZIP file
2. Extract the ZIP file (if downloaded as ZIP)

### Installing the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top-right corner
3. Click "Load unpacked" button in the top-left
4. Select the folder containing the extension files
5. The extension should now appear in your extensions list

### Enabling/Disabling the Extension

1. To temporarily disable: Click the toggle switch on the extension card
2. To re-enable: Click the toggle switch again
3. To remove: Click the "Remove" button on the extension card

## How to Use

1. Go to https://web.whatsapp.com/ and log in
2. Click the extension icon in your browser toolbar to open the popup
3. Enter your template message in the text field
   - Use `<n>` as a placeholder for the first name
   - Example: "Hey <n>, hope you're doing well!"
4. Click on any chat in WhatsApp Web
5. The extension will:
   - Extract the first name
   - Show a blue popup with the name
   - Copy a personalized message to your clipboard with the name inserted

## Template Tips

- Your template will be saved automatically between browser sessions
- Hebrew/RTL text is supported
- If you forget to include the `<n>` placeholder, the extension will show a warning

## Troubleshooting

If the extension stops working:
1. Go to `chrome://extensions/`
2. Find "First Name Extractor for WhatsApp"
3. Click the refresh/reload icon
4. Refresh the WhatsApp Web page

## Privacy Note

This extension:
- Only runs on https://web.whatsapp.com/
- Does not collect or transmit any data
- All templates are stored locally in your browser

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU GPL v3. Contributions and improvements are welcome!
