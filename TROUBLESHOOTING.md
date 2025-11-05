# 🔧 Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Installation Issues

#### Extension Not Appearing in Extensions List
**Symptoms:**
- Extension doesn't show up after installation
- "Install Extension" seems to fail silently

**Solutions:**
1. **Check ZIP file integrity:**
   ```bash
   # Verify the ZIP file contains:
   # - manifest.json
   # - index.js
   # - template.html
   # - style.css
   ```

2. **Verify SillyTavern version:**
   - Ensure you're using the latest SillyTavern version
   - Check for extension compatibility updates

3. **Clear browser cache:**
   - Clear all browser data
   - Restart SillyTavern
   - Try installation again

4. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for JavaScript errors during installation
   - Note any error messages for support

#### Extension Shows but Won't Enable
**Symptoms:**
- Extension appears in list but checkbox won't stay checked
- Settings reset after page refresh

**Solutions:**
1. **Check localStorage permissions:**
   - Ensure browser allows localStorage access
   - Try in incognito/private mode to test

2. **Verify manifest.json:**
   ```json
   {
       "display_name": "ST-- Lorebook Protection Symlink",
       "loading_order": 100,
       "requires": [],
       "js": "index.js",
       "css": "style.css"
   }
   ```

3. **Check file permissions:**
   - Ensure all files are readable by SillyTavern
   - Verify file paths are correct in manifest

### UI Issues

#### Toggle Panel Not Visible
**Symptoms:**
- No 🔐 button visible on right side
- Panel cannot be opened

**Solutions:**
1. **Check extension is enabled:**
   - Go to Settings → Extensions
   - Ensure "Enable Lorebook Protection" is checked

2. **Verify CSS loading:**
   - Check browser Network tab for style.css
   - Look for 404 errors on CSS file

3. **Check for JavaScript errors:**
   ```javascript
   // In browser console, check for:
   console.log(window.LorebookProtectionSystem);
   // Should return the API object, not undefined
   ```

4. **Force panel visibility:**
   ```javascript
   // Temporary fix for debugging
   $('#lorebook-protection-panel').css('transform', 'translateX(0)');
   ```

#### Panel Not Expanding/Collapsing
**Symptoms:**
- Panel visible but toggle button doesn't work
- Click has no effect

**Solutions:**
1. **Check event listeners:**
   - Verify jQuery is loaded
   - Check for JavaScript errors

2. **Manual toggle test:**
   ```javascript
   // Test toggle functionality manually
   const panel = $('#lorebook-protection-panel');
   panel.toggleClass('expanded');
   ```

3. **CSS animation conflicts:**
   - Check for other extensions overriding CSS
   - Try disabling other extensions temporarily

### Permission Issues

#### Character Dropdown Empty
**Symptoms:**
- No characters appear in selection dropdown
- "No characters found" message

**Solutions:**
1. **Check SillyTavern context:**
   ```javascript
   // In browser console:
   console.log(getContext());
   // Should return SillyTavern context object
   ```

2. **Verify character data:**
   ```javascript
   // Check if characters are loaded:
   const context = getContext();
   console.log(context.characters?.length || 0);
   ```

3. **Wait for full page load:**
   - Characters might not be loaded immediately
   - Try refreshing the page

4. **Check character IDs:**
   - Ensure characters have valid IDs
   - Verify character data structure

#### Permission Changes Not Saving
**Symptoms:**
- Grant/revoke permissions appear to work but reset after refresh
- Settings don't persist

**Solutions:**
1. **Check localStorage quota:**
   ```javascript
   // Check available storage:
   console.log('Storage used:', JSON.stringify(localStorage).length);
   console.log('Storage quota:', navigator.storage?.quota || 'Unknown');
   ```

2. **Clear corrupted data:**
   ```javascript
   // Reset extension data:
   localStorage.removeItem('sillytavern-lorebook-protection_settings');
   localStorage.removeItem('sillytavern-lorebook-protection_permissions');
   localStorage.removeItem('sillytavern-lorebook-protection_logs');
   ```

3. **Check for storage blockers:**
   - Disable browser extensions that block localStorage
   - Try in different browser profile

#### Access Control Not Working
**Symptoms:**
- Users can access lorebooks without permission
- Permission checking seems ineffective

**Solutions:**
1. **Verify permission check logic:**
   ```javascript
   // Test permission checking:
   const result = LorebookProtectionSystem.checkPermission('test_char', 'test_user');
   console.log('Permission check result:', result);
   ```

2. **Check server name detection:**
   ```javascript
   // Verify server name is detected correctly:
   console.log('Server name:', LorebookProtectionSystem.getServerName());
   ```

3. **Validate permission data:**
   ```javascript
   // Check stored permission data:
   const settings = LorebookProtectionSystem.settings();
   console.log('Permission data:', settings.permissions);
   ```

### Data Issues

#### Export/Import Not Working
**Symptoms:**
- Export button doesn't download file
- Import fails with error message

**Solutions:**
1. **Check file format:**
   ```json
   // Valid import format:
   {
       "version": "1.0.0",
       "timestamp": "2024-01-15T10:00:00Z",
       "serverName": "ST--",
       "settings": { ... }
   }
   ```

2. **Browser download issues:**
   - Check browser download permissions
   - Try different browser
   - Check pop-up blocker settings

3. **File size limits:**
   - Ensure exported JSON isn't too large
   - Check browser file size limitations

#### Access Logs Not Recording
**Symptoms:**
- No entries appearing in access logs
- Log functionality seems disabled

**Solutions:**
1. **Check logging settings:**
   ```javascript
   // Verify logging is enabled:
   const settings = LorebookProtectionSystem.settings();
   console.log('Settings:', settings);
   ```

2. **Test log creation:**
   ```javascript
   // Manually trigger log entry:
   LorebookProtectionSystem.logAccessAttempt('test_char', 'Test log entry', 'test');
   ```

3. **Check log limits:**
   - Logs limited to 1000 entries
   - Older logs automatically purged

### Performance Issues

#### Extension Slowing Down SillyTavern
**Symptoms:**
- SillyTavern becomes sluggish after enabling extension
- High CPU usage when extension active

**Solutions:**
1. **Check for infinite loops:**
   - Monitor browser console for repeated messages
   - Look for runaway event listeners

2. **Optimize settings:**
   - Reduce log retention
   - Disable auto-cleanup if not needed
   - Lower security level if not required

3. **Disable conflicting extensions:**
   - Try disabling other extensions one by one
   - Check for JavaScript conflicts

#### Memory Usage Issues
**Symptoms:**
- Browser memory usage increases over time
- Page becomes unresponsive

**Solutions:**
1. **Clear extension data:**
   ```javascript
   // Clear all extension data:
   Object.keys(localStorage).forEach(key => {
       if (key.includes('sillytavern-lorebook-protection')) {
           localStorage.removeItem(key);
       }
   });
   ```

2. **Reduce log frequency:**
   - Lower the number of stored logs
   - Enable auto-cleanup more frequently

3. **Check for memory leaks:**
   - Monitor memory usage in browser dev tools
   - Look for growing object counts

### Theme and Styling Issues

#### Extension Not Matching Theme
**Symptoms:**
- Extension colors don't match SillyTavern theme
- Text hard to read in dark/light mode

**Solutions:**
1. **Check CSS variables:**
   ```css
   /* Verify theme variables are used: */
   background: var(--SmartThemeBodyColor);
   color: var(--SmartThemeTextColor);
   border-color: var(--SmartThemeBorderColor);
   ```

2. **Force theme refresh:**
   ```javascript
   // Manually trigger theme update:
   LorebookProtectionSystem.updateTheme();
   ```

3. **Check custom CSS conflicts:**
   - Disable custom CSS
   - Try default SillyTavern theme

### Mobile Issues

#### Extension Not Working on Mobile
**Symptoms:**
- Toggle button not visible on mobile
- Touch gestures not working

**Solutions:**
1. **Check responsive CSS:**
   - Verify mobile breakpoints are active
   - Test at different screen sizes

2. **Enable mobile debugging:**
   - Use browser mobile emulation
   - Check touch event listeners

3. **Adjust mobile settings:**
   - Increase touch target sizes
   - Disable hover effects on touch devices

## 🛠️ Advanced Troubleshooting

### Debug Mode

Enable comprehensive debugging:
```javascript
// Enable debug logging
localStorage.setItem('sillytavern-lorebook-protection_debug', 'true');

// Check debug state
console.log('Debug mode:', localStorage.getItem('sillytavern-lorebook-protection_debug'));
```

### Reset to Defaults

Complete extension reset:
```javascript
// 1. Remove all extension data
Object.keys(localStorage).forEach(key => {
    if (key.includes('sillytavern-lorebook-protection')) {
        localStorage.removeItem(key);
    }
});

// 2. Reload page
location.reload();
```

### Manual Installation

If automatic installation fails:
1. **Extract ZIP file manually**
2. **Copy files to SillyTavern extensions directory:**
   ```
   SillyTavern/extensions/sillytavern-lorebook-protection/
   ├── manifest.json
   ├── index.js
   ├── template.html
   └── style.css
   ```
3. **Restart SillyTavern**
4. **Enable in Extensions settings**

## 📞 Getting Help

### Report Issues

When reporting issues, include:
1. **SillyTavern version**
2. **Extension version**
3. **Browser information**
4. **Steps to reproduce**
5. **Browser console errors**
6. **Screenshots if relevant**

### Diagnostic Information

Collect diagnostic data:
```javascript
// Create diagnostic report
const diagnostic = {
    userAgent: navigator.userAgent,
    sillyTavernVersion: getContext().version || 'Unknown',
    extensionVersion: '1.0.0',
    settings: LorebookProtectionSystem.settings(),
    localStorage: Object.keys(localStorage).filter(k => k.includes('sillytavern-lorebook-protection')),
    permissions: Object.keys(LorebookProtectionSystem.settings().permissions)
};

console.log('Diagnostic report:', diagnostic);
```

### Community Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/selinawynters-ops/ST---Lorebook-Protection-Symlink/issues)
- **Documentation**: Check all available .md files
- **FAQ**: Review common questions and answers

This troubleshooting guide should resolve most common issues. For persistent problems, please provide detailed diagnostic information when seeking support.