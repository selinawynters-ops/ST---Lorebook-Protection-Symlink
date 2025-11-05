# 🏗️ Architecture Documentation

## Overview

The ST-- Lorebook Protection Symlink extension is built using proper SillyTavern extension architecture, based on the RPG Companion extension framework. This ensures compatibility, maintainability, and integration with SillyTavern's core systems.

## 📁 File Structure

```
sillytavern-lorebook-protection/
├── manifest.json              # Extension metadata
├── index.js                   # Main extension logic
├── template.html              # Admin interface template
├── style.css                  # Complete styling system
└── docs/                      # Documentation files
    ├── README.md
    ├── INSTALLATION.md
    ├── ARCHITECTURE.md
    ├── API.md
    └── TROUBLESHOOTING.md
```

## 🏛️ Core Architecture

### Extension Bootstrap
```javascript
// Entry point - index.js
import { getContext, renderExtensionTemplateAsync } from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';

// Main initialization
async function initExtension() {
    // Load settings
    // Detect server name
    // Add extension settings
    // Initialize UI
    // Register event listeners
}
```

### SillyTavern Integration
- **Event Source Integration**: Listens to SillyTavern events
- **Context Access**: Uses SillyTavern's context system
- **Template System**: Renders UI using SillyTavern's template engine
- **Settings Persistence**: Integrates with SillyTavern's settings system

## 🎯 Component Architecture

### 1. Settings Management (`extensionSettings`)
```javascript
let extensionSettings = {
    enabled: true,
    panelPosition: 'right',
    permissions: {},
    accessLogs: [],
    securityLevel: 'medium',
    autoCleanup: true,
    notificationEnabled: true
};
```

### 2. Server Detection (`detectServerName()`)
```javascript
function detectServerName() {
    // Method 1: Path analysis (/ST--/public/script.js)
    // Method 2: URL path extraction
    // Method 3: Window configuration checking
    // Method 4: Document title parsing
    // Method 5: Meta tag detection
    // Method 6: Domain name conversion
    // Fallback: "SillyTavern"
}
```

### 3. UI System
- **Toggle Panel**: Collapsible right-side interface
- **Template System**: HTML template with SillyTavern integration
- **Responsive Design**: Mobile and desktop compatibility
- **Theme Integration**: Adapts to SillyTavern themes

### 4. Permission System
```javascript
// Permission structure
{
    "character_id": {
        "owner": "user_id",
        "allowedUsers": ["user1", "user2"],
        "created": "2024-01-15T10:00:00Z"
    }
}
```

## 🔧 Event System

### SillyTavern Event Integration
```javascript
// Character changed event
eventSource.on(event_types.CHARACTER_UPDATED, onCharacterChanged);

// Chat loaded event
eventSource.on(event_types.CHAT_LOADED, onChatLoaded);

// Message sent event
eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
```

### Custom Event Handlers
- **onCharacterChanged**: Updates permission lists
- **onChatLoaded**: Refreshes character data
- **onMessageSent**: Logs access attempts

## 🎨 UI Architecture

### Template System
- **renderExtensionTemplateAsync()**: SillyTavern's template rendering
- **Dynamic Content**: Server name injection
- **Modular Components**: Reusable UI sections

### CSS Architecture
```css
/* Main Panel */
.lorebook-protection-panel
├── .lorebook-toggle-btn
├── .lorebook-panel-container
│   ├── .lorebook-panel-header
│   └── .lorebook-panel-body
│       ├── .lorebook-section
│       ├── .permission-form
│       └── .character-list
```

### Responsive Design
- **Mobile First**: Small screen optimization
- **Breakpoints**: 768px, 1024px, 1920px
- **Touch Support**: Mobile gesture compatibility

## 🔐 Security Architecture

### Multi-Layer Protection
1. **Network Layer**: Origin validation, referer checking
2. **Application Layer**: Permission verification, user authentication
3. **Filesystem Layer**: Symlink validation, path traversal protection
4. **Monitoring Layer**: Access logging, security event tracking

### Permission Flow
```javascript
function checkPermission(characterId, userId) {
    // 1. Check owner access
    if (permissions.owner === userId) return true;
    
    // 2. Check allowed users
    if (permissions.allowedUsers.includes(userId)) return true;
    
    // 3. Check admin override
    if (context.user && context.user.admin) return true;
    
    // 4. Deny access
    return false;
}
```

## 💾 Data Architecture

### Storage System
```javascript
// LocalStorage keys
const STORAGE_KEYS = {
    SETTINGS: 'sillytavern-lorebook-protection_settings',
    PERMISSIONS: 'sillytavern-lorebook-protection_permissions',
    LOGS: 'sillytavern-lorebook-protection_logs'
};
```

### Data Persistence
- **Settings**: User configuration and preferences
- **Permissions**: Character access control data
- **Logs**: Access attempt history and audit trail

### Export/Import System
```javascript
// Export format
{
    "version": "1.0.0",
    "timestamp": "2024-01-15T10:00:00Z",
    "serverName": "ST--",
    "settings": { ... }
}
```

## 🔄 State Management

### Global State
```javascript
// Extension state variables
let extensionSettings = {};
let serverName = 'SillyTavern';
let $panelContainer = null;
```

### UI State
- **Panel Visibility**: Expanded/collapsed state
- **Selected Character**: Current character selection
- **Filter State**: Search and filter conditions

### Synchronization
- **Settings Sync**: Auto-save on changes
- **UI Updates**: Real-time interface updates
- **Event Handling**: Responsive to SillyTavern events

## 🎯 Integration Points

### SillyTavern Extension API
```javascript
// Core imports
import { getContext } from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';
import { characters, this_chid } from '../../../../script.js';
```

### Extension Settings Integration
```javascript
// Add to Extensions tab
function addExtensionSettings() {
    const settingsHtml = `...`;
    $('#extensions_settings2').append(settingsHtml);
}
```

### Template Integration
```javascript
// Load HTML template
const templateHtml = await renderExtensionTemplateAsync(extensionName, 'template');
$('body').append(templateHtml);
```

## 🧪 Testing Architecture

### Test Components
- **Unit Tests**: Individual function testing
- **Integration Tests**: SillyTavern API integration
- **UI Tests**: Interface functionality
- **Security Tests**: Permission system validation

### Debug Interface
```javascript
// Global debugging API
window.LorebookProtectionSystem = {
    checkPermission,
    settings: () => extensionSettings,
    showPermissionModal,
    exportPermissionData
};
```

## 📈 Performance Architecture

### Optimization Strategies
- **Lazy Loading**: Load data when needed
- **Caching**: Cache frequently accessed data
- **Debounced Saving**: Prevent excessive save operations
- **Efficient Rendering**: Optimize UI updates

### Memory Management
- **Event Cleanup**: Proper event listener removal
- **Cache Limits**: Restrict data storage size
- **Log Rotation**: Automatic log cleanup

## 🔧 Modular Design

### Core Modules
1. **Settings Module**: Configuration management
2. **UI Module**: Interface rendering and interaction
3. **Permission Module**: Access control logic
4. **Security Module**: Protection and validation
5. **Logging Module**: Audit and monitoring

### File Organization
```
src/
├── core/
│   ├── config.js      # Extension configuration
│   ├── state.js       # State management
│   ├── events.js      # Event handling
│   └── persistence.js # Data storage
├── systems/
│   ├── ui/
│   ├── security/
│   ├── permissions/
│   └── logging/
└── utils/
    ├── detection.js   # Server name detection
    ├── validation.js  # Security validation
    └── helpers.js     # Utility functions
```

## 🚀 Deployment Architecture

### Build Process
- **Development**: Source files with debugging
- **Production**: Minified and optimized
- **Package**: ZIP distribution format

### Version Management
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Backward Compatibility**: Maintain API stability
- **Migration Scripts**: Data format updates

## 🎛️ Configuration Architecture

### Settings Hierarchy
```
Default Settings
    ↓
User Settings (localStorage)
    ↓
Runtime Settings (in-memory)
    ↓
UI Display
```

### Configuration Validation
- **Type Checking**: Ensure valid data types
- **Range Validation**: Verify valid option ranges
- **Schema Validation**: Validate object structure

## 🔮 Future Architecture Considerations

### Scalability
- **Plugin System**: Extensible architecture
- **API Interface**: External integration support
- **Cloud Storage**: Remote configuration backup

### Enhancement Points
- **Advanced Security**: Multi-factor authentication
- **Analytics**: Usage statistics and insights
- **Automation**: Rule-based permission management

This architecture ensures the extension is maintainable, scalable, and properly integrated with SillyTavern's ecosystem while providing robust security and user-friendly features.