# SillyTavern Lorebook Protection Symlink Extension

🔐 **A dynamic SillyTavern extension that provides secure symlink-based protection for character lorebooks, automatically adapting to your server's directory name (e.g., "ST-- Lorebook Protection Symlink").**

## ⚡ Quick Installation (Via SillyTavern)

### Method 1: Install Extension Function (Recommended)

1. **Download the extension ZIP**: `sillytavern-lorebook-admin-extension.zip`
2. **Open SillyTavern** in your browser
3. **Go to Settings** → **Extensions** → **Install Extension**
4. **Upload the ZIP file** and click "Install"
5. **Enable the extension** in the extensions list
6. **Restart SillyTavern** to activate all features

### Method 2: Manual Installation

1. **Extract the ZIP** to your SillyTavern `extensions` directory:
   ```bash
   # Extract to extensions folder
   unzip sillytavern-lorebook-admin-extension.zip -d public/scripts/extensions/third-party/lorebook-admin/
   ```
2. **Restart SillyTavern** to load the extension

## 🎯 Dynamic Server Name Feature

### Automatic Server Name Detection

The extension automatically detects and adapts to your SillyTavern server's custom name:

#### **For "ST--" Directory:**
- Extension shows as: **"ST-- Lorebook Protection Symlink"**
- Button displays: **"🔐 ST-- Lorebook Protection Symlink"**
- Console logs: **"[ST-- Lorebook Protection Symlink] ..."**

#### **For Custom Server Directories:**
- **"MyTavern"** → **"MyTavern Lorebook Protection Symlink"**
- **"RoleplayHub"** → **"RoleplayHub Lorebook Protection Symlink"**
- **"AIServer"** → **"AIServer Lorebook Protection Symlink"**

#### **Detection Methods:**
1. **SillyTavern Directory Name** - Primary source (from index file path)
2. **Script Source Path** - Detects from script.js loading path
3. **Window Location** - From URL path directory
4. **Document Title** - Secondary source
5. **Meta Tags** - Custom server configuration
6. **Domain Name** - From hostname

#### **Fallback:**
If no custom name is detected, it defaults to **"SillyTavern Lorebook Protection Symlink"**.

## 🎯 Features

### 🔒 Security Features
- **SillyTavern-Only Access**: Restricts lorebook access to only through SillyTavern
- **Creator/Owner Control**: Only character creators can manage their lorebooks
- **Administrator Override**: Server admins have full access control
- **Access Logging**: Comprehensive audit trail of all access attempts
- **Real-time Validation**: Instant permission checking and enforcement

### 🎛️ Management Features
- **Slash Commands**: `/lorebook-permissions` for quick management
- **Web Interface**: Visual permission management through SillyTavern UI
- **Bulk Operations**: Grant/revoke permissions for multiple users
- **Permission Statistics**: View access patterns and usage statistics
- **User-Friendly Alerts**: Clear permission status indicators

### 🔧 Technical Features
- **Zero Configuration**: Works out of the box with sensible defaults
- **Performance Optimized**: Caching and efficient permission checking
- **Responsive Design**: Works on all SillyTavern supported screen sizes
- **Cross-Platform**: Compatible with Windows, macOS, and Linux
- **Theme Integration**: Adapts to your SillyTavern theme automatically

## 📋 Requirements

- **SillyTavern 1.0.0+** (any recent version)
- **Administrator access** (for initial setup)
- **File system permissions** (for permission data storage)

## 🚀 Getting Started

### 1. Installation

After installing the extension via SillyTavern's extension manager:

1. **Navigate to Settings** → **Extensions**
2. **Enable "SillyTavern Lorebook Admin"**
3. **Restart SillyTavern** to activate the extension

### 2. Initial Setup

The first time you run SillyTavern after installation:

1. **Open any character** → **Character Settings**
2. **Click "🔐 Lorebook Permissions"** button
3. **Configure initial permissions** for your characters
4. **Save settings** to activate permission enforcement

### 3. Basic Usage

#### For Character Creators:
- Your lorebooks are **automatically restricted** to you
- Use the permission dialog to **grant access** to specific users
- **Monitor access** through the permission status indicator

#### For Server Administrators:
- Access the **admin panel** from Settings
- **Manage all permissions** across all characters
- **View access logs** and security statistics
- **Configure global settings** for the permission system

#### For Regular Users:
- **Access only lorebooks** you have permission for
- **Request access** from character creators or administrators
- **See clear status** indicators for accessibility

## 💻 Usage Examples

### Slash Commands

```bash
# List all permissions (admin only)
/lorebook-permissions action=list

# Check your access to a character
/lorebook-permissions action=check character="My Character"

# Grant permission to a user (admin only)
/lorebook-permissions action=grant user="username" character="My Character"

# Revoke permission from a user (admin only)
/lorebook-permissions action=revoke user="username" character="My Character"
```

### Permission Management UI

1. **Open character settings** → **Click "🔐 Lorebook Permissions"**
2. **Select character** from the dropdown
3. **Enter user ID** to grant/revoke access
4. **Click appropriate button** to execute action
5. **View current permissions** in the list below

### Admin Panel Access

1. **Go to Settings** → **Extensions**
2. **Click "⚙️ Permission Admin"** (admin users only)
3. **Navigate tabs**: Permissions, Logs, Statistics
4. **Perform bulk operations** as needed

## 🔧 Configuration

The extension works with default settings, but you can customize:

### Extension Settings
- **Enable/Disable** permission enforcement
- **Configure admin override** behavior
- **Set access logging** preferences
- **Adjust caching** parameters
- **Customize warning messages**

### Access Control Settings
- **Default permission level** for new characters
- **Permission inheritance** rules
- **Access timeout** settings
- **User authentication** method

## 🛡️ Security Features

### Multi-Layer Protection
1. **SillyTavern Context Validation**: Only works within SillyTavern
2. **User Authentication**: Validates user identity
3. **Permission Database**: Secure storage of access rules
4. **Access Logging**: Comprehensive audit trail
5. **Real-time Monitoring**: Instant violation detection

### Access Control Types
- **Owner Access**: Full control for character creators
- **Read Access**: View-only permissions for granted users
- **Admin Access**: Override capabilities for server administrators
- **Denied Access**: Explicit blocking for unauthorized users

## 📊 Monitoring & Logging

### Access Logs
- **Timestamp**: When access was attempted
- **User Information**: Who attempted access
- **Character Details**: Which lorebook was accessed
- **Access Result**: Success or failure
- **Client Information**: Browser and IP details

### Statistics Dashboard
- **Total Permissions**: Number of active permission rules
- **Access Attempts**: Count of successful/denied attempts
- **User Activity**: Most active users and characters
- **Security Events**: Suspicious access patterns

## 🔍 Troubleshooting

### Common Issues

**Extension not loading:**
- Ensure SillyTavern is version 1.0.0+
- Check browser console for errors
- Verify installation in extensions directory

**Permissions not working:**
- Confirm extension is enabled in settings
- Check if you're logged in as the correct user
- Verify character ownership settings

**Can't access admin panel:**
- Ensure you have administrator privileges
- Check admin user configuration
- Verify server-side authentication

### Debug Mode

Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('lorebook-permission-system_debug', 'true');
```

### Reset Extension

To reset all extension data:
```javascript
localStorage.removeItem('lorebook-permission-system_permissions');
localStorage.removeItem('lorebook-permission-system_access_logs');
localStorage.removeItem('lorebook-permission-system_settings');
```

## 📝 API Reference

### Public Functions

```javascript
// Check if user has access to character lorebook
LorebookPermissionSystem.checkPermission(characterId);

// Grant permission to user
LorebookPermissionSystem.grantPermission(userId, characterId);

// Revoke permission from user
LorebookPermissionSystem.revokePermission(userId, characterId);

// List all permissions
LorebookPermissionSystem.listPermissions();

// Verify access attempt
LorebookPermissionSystem.verifyLorebookAccess(data);
```

### Events

The extension emits these events for integration:
- `permissionGranted`: When access is granted
- `permissionRevoked`: When access is revoked
- `accessDenied`: When unauthorized access is attempted
- `permissionUpdated`: When permissions are modified

## 🔄 Updates

### Automatic Updates
- Extension checks for updates on SillyTavern restart
- Updates are applied automatically if enabled
- Configuration is preserved during updates

### Manual Updates
1. Download latest extension ZIP
2. Install via SillyTavern extension manager
3. Existing settings are automatically migrated

## 🤝 Support

### Getting Help
1. **Check this README** for common solutions
2. **Review browser console** for error messages
3. **Enable debug mode** for detailed logging
4. **Visit SillyTavern documentation** for extension guidance

### Bug Reports
- Include SillyTavern version
- Provide browser console errors
- Describe steps to reproduce
- Include extension settings if relevant

### Feature Requests
- Post requests to SillyTavern forums
- Describe use case and benefits
- Consider implementation complexity
- Provide mockups if UI-related

## 📄 License

This extension is released under **AGPL-3.0 License**. See LICENSE file for details.

## 🙏 Credits

- **SillyTavern Development Team** - Extension framework
- **Community Contributors** - Testing and feedback
- **Security Advisors** - Access control expertise

---

**🔐 Remember**: This extension ensures your character lorebooks remain secure and accessible only to authorized users through SillyTavern's trusted interface.

**⚠️ Important**: Always keep your SillyTavern installation updated and monitor access logs regularly for security.