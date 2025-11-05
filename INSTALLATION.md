# 📦 Installation Guide

## Prerequisites

- SillyTavern latest version installed
- Server administrator access (recommended)
- Basic understanding of SillyTavern interface

## 🚀 Quick Installation

### Step 1: Download the Extension
1. Download the latest release: `sillytavern-lorebook-protection-final.zip`
2. Verify the file integrity (optional but recommended)

### Step 2: Install in SillyTavern
1. **Open SillyTavern**
2. Navigate to **Settings** → **Extensions**
3. Click the **"Install Extension"** button
4. **Select** the downloaded ZIP file
5. Wait for the installation to complete
6. **Restart** SillyTavern to ensure proper loading

### Step 3: Enable the Extension
1. After restarting, go to **Settings** → **Extensions**
2. Find **"ST-- Lorebook Protection Symlink"** in the extensions list
3. **Check** the "Enable Lorebook Protection" checkbox
4. The extension is now active!

## ⚙️ Initial Configuration

### Basic Setup
1. **Choose Security Level**:
   - **Low**: Basic protection (recommended for small servers)
   - **Medium**: Standard protection (recommended for most users)
   - **High**: Maximum security (recommended for large servers)

2. **Enable Notifications** (optional):
   - Check "Enable notifications" for user feedback
   - Toast notifications will appear for permission changes

### Access the Admin Panel
1. Look for the **🔐 toggle button** on the right side of SillyTavern
2. Click to expand the admin panel
3. Alternatively, use the "Open Admin Panel" button in Extension settings

## 🔧 First Time Setup

### Configure Server Detection
The extension automatically detects your server name:
- From directory path (e.g., `/ST--/` → "ST--")
- From domain name (e.g., `mytavern.com` → "Mytavern")
- From document title
- Falls back to "SillyTavern"

### Test Basic Functionality
1. **Open** the admin panel
2. **Select** a character from the dropdown
3. **Enter** a test user ID
4. **Grant** permission to test the system
5. **Verify** the permission appears in the character list

## 📋 Configuration Options

### Extension Settings
| Setting | Description | Default |
|---------|-------------|---------|
| Enable Lorebook Protection | Toggle extension on/off | Enabled |
| Security Level | Protection strength | Medium |
| Enable Notifications | Show toast notifications | Enabled |
| Auto Cleanup | Automatically clean old logs | Enabled |

### Admin Panel Settings
- **Panel Position**: Right side (fixed)
- **Character Refresh**: Manual or automatic
- **Log Retention**: 1000 most recent entries
- **Export Format**: JSON

## 🎯 Post-Installation Checklist

### ✅ Verification Steps
- [ ] Extension appears in Extensions list
- [ ] Toggle "Enable Lorebook Protection" works
- [ ] 🔐 Panel button is visible on right side
- [ ] Panel expands/collapses correctly
- [ ] Character dropdown is populated
- [ ] Grant/revoke permissions work
- [ ] Access logs are created
- [ ] Export/Import functions work

### 🔍 Troubleshooting
If any steps fail:
1. Check browser console for errors
2. Verify SillyTavern version compatibility
3. Restart SillyTavern and try again
4. See TROUBLESHOOTING.md for detailed solutions

## 🔄 Updating the Extension

### Automatic Updates
1. Download the new version ZIP file
2. Install over the existing extension
3. Settings and permissions are preserved
4. Restart SillyTavern

### Manual Update
1. Disable the extension in Extensions settings
2. Install the new version
3. Re-enable the extension
4. Verify all settings are correct

## 🗑️ Uninstallation

### Safe Removal
1. **Export** your permission data first (recommended)
2. **Disable** the extension in Extensions settings
3. **Restart** SillyTavern
4. The extension is now removed

### Clean Removal
To completely remove all data:
1. Follow safe removal steps
2. Clear browser localStorage for the extension
3. Manually delete any created symlinks (advanced)

## 📱 Mobile Installation

### Mobile Browser Setup
1. Access SillyTavern through mobile browser
2. Installation process is identical to desktop
3. Admin panel adapts to mobile screen size
4. Touch-optimized controls

### Tablet Support
- Panel adjusts for tablet screens
- Touch gestures supported
- Responsive design maintained

## 🔐 Security Setup

### Recommended Security Configuration
For production environments:

1. **Set Security Level to High**
   - Maximum access logging
   - Enhanced validation
   - Advanced monitoring

2. **Enable All Notifications**
   - Never miss permission changes
   - Complete audit trail

3. **Regular Data Backups**
   - Export permissions weekly
   - Store backups securely

4. **Monitor Access Logs**
   - Review unauthorized attempts
   - Track permission changes

### Admin Account Setup
1. **Identify admin users**
2. **Grant admin privileges** through server configuration
3. **Test admin override** functionality
4. **Document admin procedures**

## 🎛️ Advanced Configuration

### Custom Server Names
If auto-detection fails:
```javascript
// Set custom server name in browser console
localStorage.setItem('sillytavern-lorebook-protection_server_name', 'MyCustomServer');
```

### Permission Templates
Create permission templates for bulk operations:
```json
{
    "template_name": {
        "allowedUsers": ["user1", "user2"],
        "securityLevel": "medium"
    }
}
```

### API Integration
For programmatic access:
```javascript
// Check permissions
LorebookProtectionSystem.checkPermission(characterId, userId);

// Export settings
LorebookProtectionSystem.exportPermissionData();

// Show admin panel
LorebookProtectionSystem.showPermissionModal();
```

## 📞 Getting Help

### Support Resources
- **Documentation**: Read all available .md files
- **GitHub Issues**: Report bugs and request features
- **Community**: Join discussions in the repository

### Common Installation Issues
| Issue | Solution |
|-------|----------|
| Panel not visible | Check if extension is enabled |
| Characters not loading | Verify SillyTavern context is available |
| Permissions not saving | Check browser localStorage permissions |
| Import/Export fails | Verify file format and browser permissions |

## ✅ Success Confirmation

Once installation is complete, you should see:
- ✅ Extension in Extensions list
- ✅ 🔐 Toggle panel button on right side
- ✅ Working admin interface
- ✅ Character management capabilities
- ✅ Access logging functionality
- ✅ Export/import features

Your SillyTavern lorebook protection system is now ready to use!