# Ilias Helper Extension

The **Ilias Helper** extension automates the login process for ILIAS-based university platforms, allowing users to stay logged in while navigating between pages. This eliminates the need to repeatedly log in, providing a smoother and more efficient user experience.

## Features

- **Automated Login:** Once logged in, the extension handles subsequent logins automatically.
- **Multiple University Support:** Supports multiple ILIAS platforms by allowing different login configurations for various universities.
- **Login Overlay:** Displays an overlay during login to provide feedback to the user.
- **Visibility-Based Login:** Automatically logs you in if the page becomes visible after being idle for a while.

## Installation

[Add the extension to chromium based browsers](https://chrome)

or

1. Download or clone this repository.
2. Go to `chrome://extensions/` in your Chrome browser.
3. Enable **Developer Mode** in the top right corner.
4. Click on **Load unpacked** and select the folder containing the extension files.
5. The extension will now be active and ready to use.

## Usage

1. **Open the Popup:**
   - The extension provides a simple username/password prompt in the popup. 
   
2. **Configure University Login:**
   - The extension uses a lookup table of known ILIAS login pages to automatically identify and use the correct login form.
   - You can add more universities to the `KNOWN_LOGIN_SITES` object in `content.js` if your institution is not supported.

## How It Works

### Background

The extension stores your **username** and **password** securely in the browser's local storage. When you visit a supported ILIAS page, the extension automatically detects the login form and fills in your credentials.

The content script checks if the current page matches any known login URL in the `KNOWN_LOGIN_SITES` object. If a match is found, it uses the corresponding login form data (e.g., field names for username and password) to submit the form.

### Login Logic

- When the page is loaded, the extension checks the login URL and form data.
- If the credentials are available, it submits the form automatically.
- If the login is successful, a **success badge** is displayed; otherwise, an error badge appears.
  
You can find the relevant data structure for known login sites in the `KNOWN_LOGIN_SITES` object in `content.js`.

### Multi-University Support

The extension supports multiple universities, each with its own login URL and form field names. For each university, you can define the URL and the form field identifiers (e.g., `usernameField` and `passwordField`).

The extension will check if the current site's hostname matches any entry in the `KNOWN_LOGIN_SITES` and use the corresponding login data.

### Example:

If the extension detects that the page is hosted on `ilias3.uni-stuttgart.de`, it will use the login URL and form fields for the University of Stuttgart. If the page is hosted on `ilias.your-university.de`, it will use the corresponding login data for that institution.

### Handling Inactivity

The extension also includes a mechanism that checks if the tab has been inactive for a set amount of time (30 minutes). If the tab is inactive, a login overlay will appear, indicating that the extension is logging you in.

## Security Considerations

While the extension stores your credentials in the browser’s local storage, which isn't the most secure, it's a common method for storing extension data. Keep in mind that if someone gains control of your browser, they can access this data, but if they can view this data they will most likely also have access to the browsers password manager so you have to know for yourself if you find this okey.

## Known Issues

- If the login form's structure changes, the extension may fail to log in automatically. If you encounter this issue, please inspect the network traffic on the login page and submit a bug report with the necessary details (URL, form field names, etc.).

## Contribution

Feel free to fork this project and submit pull requests. If you encounter any issues or have suggestions, please open an issue on the GitHub repository.

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
