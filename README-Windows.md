# Lorebook ACL Panel - Windows Installation Guide

## 🛡️ Overview

The Lorebook ACL Panel is a modern, neumorphic interface for managing access control to lorebooks in SillyTavern. This extension provides:

-   **🎨 Neumorphic Design**: Modern soft UI with beautiful shadows and gradients
-   **🪟 Floating Interface**: Modal overlay with backdrop blur and smooth animations
-   **🌓 Theme Support**: Automatic adaptation to dark and light themes
-   **⌨️ Keyboard Shortcuts**: Ctrl+Shift+L to toggle the ACL panel
-   **📱 Responsive Design**: Mobile-friendly with adaptive layouts
-   **🔄 Real-time Updates**: Live ACL status and permission management

## 📋 System Requirements

-   **Windows 10/11** (recommended)
-   **SillyTavern** installed
-   **Administrator privileges** (for symlink functionality)
-   **Developer Mode** (recommended for full symlink support)

## 🚀 Quick Installation

### Method 1: Automated Installation (Recommended)

1.  **Download the extension package**
2.  **Run the Windows installer**:
    
    ```batch
    install-windows.bat
    ```
    
3.  **Follow the on-screen instructions**
4.  **Restart SillyTavern**

### Method 2: Manual Installation

1.  **Navigate to your SillyTavern directory**
2.  **Create extension folders**:
    
    ```
    SillyTavern\extensions\lorebook-acl\
    SillyTavern\server\extensions\lorebook-acl\
    ```
    
3.  **Copy the files**:
    -   **Client files** → `SillyTavern\extensions\lorebook-acl\`:
        -   `index.js`
        -   `manifest.json`
        -   `style.css`
        -   `ui-index.js`
    -   **Server files** → `SillyTavern\server\extensions\lorebook-acl\`:
        -   `server-index.js` → rename to `index.js`
        -   `server-manifest.json`

## ⚙️ Windows Configuration

### Enable Developer Mode (for Symlink Support)

1.  **Open Windows Settings** (Win + I)
2.  **Go to** `Update & Security` → `For developers`
3.  **Select** `Developer mode`
4.  **Restart SillyTavern**

### Alternative: Run as Administrator

If Developer Mode is not available:

1.  **Right-click** on SillyTavern executable
2.  **Select** "Run as administrator"
3.  **Accept** the UAC prompt

## 🎮 How to Use

### Accessing the ACL Panel

1.  **In SillyTavern**, go to the **World Info** tab
2.  **Click** the **"🛡️ ACL Panel"** button
3.  **Or use** the keyboard shortcut: **Ctrl+Shift+L**

### Features Overview

#### 📤 Share Lorebook

-   Select a shared lorebook from the dropdown
-   Enter target user handle
-   Specify symlink name (must end with `.json`)
-   Click "Create Symlink"

#### 🔓 Grant Access

-   Enter lorebook name
-   Enter user handle to grant access to
-   Click "Grant Access"

#### 📋 View ACL Status

-   Click "Refresh" to update the list
-   View all access control entries
-   See status indicators for each lorebook

## 🧪 Testing the Interface

### Desktop Test Interface

A desktop shortcut is created during installation. Double-click it to:

-   Test the neumorphic UI
-   Verify theme switching
-   Test all button interactions
-   View demo notifications

### Browser Test

Open `test-acl-panel.html` in your browser to test the interface without SillyTavern.

## 📁 File Structure

```
SillyTavern/
├── extensions/
│   └── lorebook-acl/
│       ├── index.js          # Client-side logic
│       ├── manifest.json     # Extension metadata
│       ├── style.css         # Neumorphic styles
│       └── ui-index.js       # UI components
├── server/
│   └── extensions/
│       └── lorebook-acl/
│           ├── index.js          # Server-side logic
│           └── server-manifest.json
└── data/
    └── shared/
        └── worlds/           # Shared lorebooks directory
```

## 🔧 Troubleshooting

### Common Issues

#### ❌ "Permission denied" when creating symlinks

**Solution**: Enable Developer Mode or run SillyTavern as administrator

#### ❌ ACL Panel button not visible

**Solution**:

1.  Check that extension files are in the correct directory
2.  Restart SillyTavern
3.  Clear browser cache (Ctrl+F5)

#### ❌ Styles not loading correctly

**Solution**:

1.  Verify `style.css` is in the extensions folder
2.  Check browser console for CSS errors
3.  Ensure SillyTavern is using a modern browser

#### ❌ API calls failing

**Solution**:

1.  Check server extension files are installed correctly
2.  Verify server logs for errors
3.  Restart SillyTavern server

### Debug Mode

Enable console logging by opening browser developer tools (F12) and checking the Console tab.

## 🎨 Customization

### Theme Colors

The interface automatically adapts to SillyTavern's theme. You can customize colors by modifying `style.css`:

```css
:root {
    --acl-primary-color: #3b82f6;
    --acl-success-color: #10b981;
    --acl-warning-color: #f59e0b;
    --acl-error-color: #ef4444;
}
```

### Panel Size

Adjust the floating panel size in `style.css`:

```css
.lorebook-acl-panel {
    width: 600px;  /* Adjust width */
    max-height: 80vh;  /* Adjust height */
}
```

## 📞 Support

### Getting Help

1.  **Check the Console**: Open browser dev tools (F12) for error messages
2.  **Verify Installation**: Ensure all files are in correct locations
3.  **Test Separately**: Use `test-acl-panel.html` to isolate UI issues
4.  **Restart**: Sometimes a simple restart fixes issues

### Reporting Issues

When reporting issues, please include:

-   Windows version
-   SillyTavern version
-   Browser version
-   Console error messages
-   Steps to reproduce

## 🔄 Updates

### Updating the Extension

1.  **Download the new version**
2.  **Run the installer** or **replace files manually**
3.  **Restart SillyTavern**

### Preserving Settings

Extension settings are stored in SillyTavern's data directory and are preserved during updates.

## 📄 License

This extension is open-source and available under the same license as SillyTavern.

* * *

**Enjoy your enhanced lorebook management experience! 🎉**