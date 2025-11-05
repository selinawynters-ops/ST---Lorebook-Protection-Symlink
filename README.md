# 🔐 ST-- Lorebook Protection Symlink

A comprehensive SillyTavern extension for secure lorebook permission management using symlink-based access control.

## 📋 Overview

This extension provides enterprise-grade security for SillyTavern character lorebooks, restricting access to only character creators/owners and server administrators. Built using proper SillyTavern extension architecture based on the RPG Companion extension framework.

## ✨ Key Features

### 🔒 Security System
- **Symlink-based protection** for filesystem-level access control
- **Creator/owner control** - Only character creators can manage their lorebooks
- **Administrator override** - Server admins have full access control
- **Real-time permission validation** with instant checking
- **Multi-layer security** - Network, Application, and Filesystem protection
- **Access logging** - Complete audit trail of all access attempts

### 🎛️ Admin Interface
- **Toggle panel system** - Collapsible right-side panel (not floating icons)
- **Permission management** - Grant/revoke access per character
- **Character dashboard** - View all characters and permission status
- **Access logs** - Detailed monitoring and history
- **Search & filtering** - Find characters and permission states
- **Export/Import** - Backup and restore permission data

### 🎨 User Experience
- **Dynamic server naming** - Adapts to your SillyTavern installation
- **Mobile responsive** - Works on all screen sizes
- **Theme integration** - Matches SillyTavern's visual design
- **Smooth animations** - Professional micro-interactions
- **Toast notifications** - User-friendly feedback system

## 📦 Installation

### Prerequisites
- SillyTavern latest version
- Server administrator access (for full functionality)

### Installation Steps
1. **Download** the latest release: `sillytavern-lorebook-protection-final.zip`
2. **Install** in SillyTavern:
   - Open SillyTavern → Settings → Extensions
   - Click "Install Extension"
   - Upload the ZIP file
3. **Enable** the extension:
   - Check "Enable Lorebook Protection" in the Extensions tab
4. **Configure** security settings:
   - Set security level (Low/Medium/High)
   - Configure notifications
5. **Access** the admin panel:
   - Look for the 🔐 toggle panel on the right side
   - Or use the "Open Admin Panel" button in Extensions settings

## 🚀 Quick Start

### Basic Permission Management
1. **Open** the admin panel using the 🔐 toggle button
2. **Select** a character from the dropdown
3. **Enter** the user ID to grant access to
4. **Click** "Grant Access" to allow lorebook viewing
5. **Revoke** access anytime using the same interface

### Advanced Configuration
- **Security Levels**: Choose protection strength
- **Access Logging**: Monitor all permission changes
- **Data Export**: Backup permission configurations
- **Bulk Operations**: Manage multiple characters efficiently

## 📚 Documentation

### Core Files
- `index.js` - Main extension logic and SillyTavern integration
- `manifest.json` - Extension metadata and dependencies
- `template.html` - Admin interface template
- `style.css` - Complete styling and responsive design

### Documentation Files
- `README.md` - This main documentation file
- `INSTALLATION.md` - Detailed installation guide
- `ARCHITECTURE.md` - Technical implementation details
- `API.md` - Developer API reference
- `TROUBLESHOOTING.md` - Common issues and solutions

## 🔧 Configuration

### Extension Settings
```json
{
    "enabled": true,
    "panelPosition": "right",
    "securityLevel": "medium",
    "autoCleanup": true,
    "notificationEnabled": true
}
```

### Permission Structure
```json
{
    "permissions": {
        "character_id": {
            "owner": "user_id",
            "allowedUsers": ["user_id1", "user_id2"],
            "created": "2024-01-15T10:00:00Z"
        }
    }
}
```

## 🛡️ Security Features

### Access Control
- **Path traversal protection** - Prevents malicious file access
- **Origin validation** - Blocks unauthorized requests
- **Rate limiting** - Prevents abuse and brute force attempts
- **Audit logging** - Complete security event tracking

### Permission Levels
- **Low**: Basic protection with owner control
- **Medium**: Standard protection with access logging
- **High**: Maximum security with advanced monitoring

## 🎯 Usage Examples

### Granting Access
```javascript
// Through admin interface
1. Select character "Character Name"
2. Enter user ID "username123"
3. Click "Grant Access"
```

### Checking Permissions
```javascript
// Programmatically check access
const hasAccess = LorebookProtectionSystem.checkPermission('character_id', 'user_id');
```

## 🔄 Updates & Maintenance

### Automatic Updates
- Extension checks for configuration changes
- Seamless permission data migration
- Backward compatibility maintained

### Data Management
- **Export permissions**: JSON format for backup
- **Import permissions**: Restore from backup files
- **Clear logs**: Remove access history
- **Reset settings**: Return to default configuration

## 🐛 Troubleshooting

### Common Issues
- **Panel not visible**: Check if extension is enabled
- **Permissions not working**: Verify server name detection
- **Import/export errors**: Check file format and permissions

### Debug Mode
Enable console logging to troubleshoot issues:
```javascript
window.LorebookProtectionSystem.settings()
```

## 🤝 Contributing

### Development Setup
1. Clone this repository
2. Install dependencies
3. Make changes to extension files
4. Test in SillyTavern development environment
5. Submit pull request with detailed description

### Code Standards
- Follow SillyTavern extension guidelines
- Use proper event handling
- Maintain responsive design
- Include comprehensive error handling

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check all available documentation files
- **Community**: Join discussions in the repository

### Contact
- **Repository**: [selinawynters-ops/ST---Lorebook-Protection-Symlink](https://github.com/selinawynters-ops/ST---Lorebook-Protection-Symlink)
- **Issues**: [GitHub Issues](https://github.com/selinawynters-ops/ST---Lorebook-Protection-Symlink/issues)

## 🏆 Acknowledgments

Based on the RPG Companion SillyTavern extension architecture, ensuring proper integration and compatibility with SillyTavern's extension system.

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Compatibility**: SillyTavern Latest