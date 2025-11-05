# 📚 API Reference

## Overview

The ST-- Lorebook Protection Symlink extension provides a comprehensive API for managing lorebook permissions, accessing extension data, and integrating with external systems.

## 🔌 Global API

The extension exposes a global API object for debugging and external integration:

```javascript
window.LorebookProtectionSystem
```

## 📋 Core API Methods

### Permission Management

#### `checkPermission(characterId, userId)`
Checks if a user has permission to access a character's lorebook.

**Parameters:**
- `characterId` (string): The ID of the character
- `userId` (string): The ID of the user requesting access

**Returns:**
- `boolean`: `true` if access is granted, `false` otherwise

**Example:**
```javascript
const hasAccess = LorebookProtectionSystem.checkPermission('character_123', 'user_456');
if (hasAccess) {
    console.log('Access granted');
} else {
    console.log('Access denied');
}
```

#### `grantPermission(characterId, userId)`
Grants permission to a user for a specific character.

**Parameters:**
- `characterId` (string): The ID of the character
- `userId` (string): The ID of the user to grant access to

**Returns:**
- `string`: Success or error message

**Example:**
```javascript
const result = LorebookProtectionSystem.grantPermission('character_123', 'user_456');
console.log(result); // "Permission granted to user_456"
```

#### `revokePermission(characterId, userId)`
Revokes permission from a user for a specific character.

**Parameters:**
- `characterId` (string): The ID of the character
- `userId` (string): The ID of the user to revoke access from

**Returns:**
- `string`: Success or error message

**Example:**
```javascript
const result = LorebookProtectionSystem.revokePermission('character_123', 'user_456');
console.log(result); // "Permission revoked from user_456"
```

### Settings and Configuration

#### `settings()`
Returns current extension settings.

**Returns:**
- `object`: Current extension settings

**Example:**
```javascript
const settings = LorebookProtectionSystem.settings();
console.log(settings.securityLevel); // "medium"
console.log(settings.enabled); // true
```

#### `updateSettings(newSettings)`
Updates extension settings with new values.

**Parameters:**
- `newSettings` (object): New settings to merge with existing settings

**Returns:**
- `boolean`: `true` if update successful

**Example:**
```javascript
const success = LorebookProtectionSystem.updateSettings({
    securityLevel: 'high',
    notificationEnabled: false
});
```

### UI Management

#### `showPermissionModal()`
Opens the permission management modal interface.

**Example:**
```javascript
LorebookProtectionSystem.showPermissionModal();
```

#### `hidePermissionModal()`
Closes the permission management modal interface.

**Example:**
```javascript
LorebookProtectionSystem.hidePermissionModal();
```

#### `togglePanel()`
Toggles the admin panel visibility.

**Example:**
```javascript
LorebookProtectionSystem.togglePanel();
```

### Data Management

#### `exportPermissionData()`
Exports all permission data as downloadable JSON file.

**Example:**
```javascript
LorebookProtectionSystem.exportPermissionData();
// Downloads file: lorebook-protection-ServerName-timestamp.json
```

#### `importPermissionData(fileData)`
Imports permission data from JSON object.

**Parameters:**
- `fileData` (object): Permission data to import

**Returns:**
- `boolean`: `true` if import successful

**Example:**
```javascript
const importData = {
    version: "1.0.0",
    timestamp: "2024-01-15T10:00:00Z",
    serverName: "ST--",
    settings: {
        permissions: {
            "character_123": {
                owner: "admin",
                allowedUsers: ["user_456"]
            }
        }
    }
};

const success = LorebookProtectionSystem.importPermissionData(importData);
```

## 📊 Data Structures

### Permission Object
```javascript
{
    "characterId": {
        "owner": "string",           // User ID of the character owner
        "allowedUsers": ["string"],   // Array of allowed user IDs
        "created": "string",         // ISO timestamp of creation
        "modified": "string"         // ISO timestamp of last modification
    }
}
```

### Settings Object
```javascript
{
    "enabled": boolean,             // Extension enabled status
    "panelPosition": "string",      // Panel position (always "right")
    "permissions": object,          // Permission data structure
    "accessLogs": array,            // Access log entries
    "securityLevel": "string",      // "low", "medium", or "high"
    "autoCleanup": boolean,         // Automatic log cleanup
    "notificationEnabled": boolean  // Toast notification status
}
```

### Access Log Entry
```javascript
{
    "timestamp": "string",         // ISO timestamp
    "characterId": "string",       // Character ID
    "action": "string",           // Action description
    "type": "string",             // "access", "admin", "denied"
    "user": "string"              // User ID who performed action
}
```

## 🎯 Events

The extension listens to and emits various events:

### SillyTavern Events
```javascript
// Character updated
eventSource.on(event_types.CHARACTER_UPDATED, onCharacterChanged);

// Chat loaded
eventSource.on(event_types.CHAT_LOADED, onChatLoaded);

// Message sent
eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
```

### Custom Events
```javascript
// Permission granted
$(document).on('lorebook:permission:granted', function(event, data) {
    console.log('Permission granted:', data);
});

// Permission revoked
$(document).on('lorebook:permission:revoked', function(event, data) {
    console.log('Permission revoked:', data);
});

// Settings updated
$(document).on('lorebook:settings:updated', function(event, data) {
    console.log('Settings updated:', data);
});
```

## 🔒 Security API

### Access Validation
```javascript
// Validate character access
function validateCharacterAccess(characterId, userId) {
    const hasPermission = LorebookProtectionSystem.checkPermission(characterId, userId);
    
    if (!hasPermission) {
        // Log denied access
        logAccessAttempt(characterId, `Access denied for ${userId}`, 'denied');
        return false;
    }
    
    return true;
}
```

### Permission Checking Flow
```javascript
// Internal permission check logic
function checkPermission(characterId, userId) {
    const permissions = extensionSettings.permissions[characterId];
    const context = getContext();
    
    // 1. Owner check
    if (permissions?.owner === userId) {
        return true;
    }
    
    // 2. Allowed users check
    if (permissions?.allowedUsers?.includes(userId)) {
        return true;
    }
    
    // 3. Admin override
    if (context.user && context.user.admin) {
        return true;
    }
    
    // 4. Default denial
    return false;
}
```

## 🎨 UI API

### Modal Management
```javascript
// Show permission modal
LorebookProtectionSystem.showPermissionModal();

// Hide permission modal
LorebookProtectionSystem.hidePermissionModal();

// Update permission list
LorebookProtectionSystem.updatePermissionList();
```

### Notification System
```javascript
// Show notification (internal)
function showNotification(message, type = 'info') {
    // type: 'success', 'error', 'warning', 'info'
    // Automatically creates and displays toast notification
}
```

## 📈 Advanced Usage

### Batch Operations
```javascript
// Grant access to multiple users
function batchGrantPermissions(characterId, userIds) {
    const results = [];
    userIds.forEach(userId => {
        const result = LorebookProtectionSystem.grantPermission(characterId, userId);
        results.push({ userId, result });
    });
    return results;
}

// Check multiple character permissions
function batchCheckPermissions(characterIds, userId) {
    const results = {};
    characterIds.forEach(characterId => {
        results[characterId] = LorebookProtectionSystem.checkPermission(characterId, userId);
    });
    return results;
}
```

### Integration with Other Extensions
```javascript
// Example: Integration with character management extension
$(document).on('character:created', function(event, characterData) {
    // Automatically set owner permissions
    const userId = getCurrentUser();
    LorebookProtectionSystem.grantPermission(characterData.id, userId);
});

// Example: Integration with user management extension
$(document).on('user:deleted', function(event, userData) {
    // Remove user from all permissions
    const settings = LorebookProtectionSystem.settings();
    Object.keys(settings.permissions).forEach(characterId => {
        LorebookProtectionSystem.revokePermission(characterId, userData.id);
    });
});
```

## 🛠️ Debug API

### Get Internal State
```javascript
// Get current server name
console.log('Server:', LorebookProtectionSystem.getServerName());

// Get permission count
const settings = LorebookProtectionSystem.settings();
const permissionCount = Object.keys(settings.permissions).length;
console.log('Characters with permissions:', permissionCount);

// Get recent logs
const recentLogs = settings.accessLogs.slice(0, 10);
console.log('Recent access logs:', recentLogs);
```

### Force Refresh
```javascript
// Refresh character list
LorebookProtectionSystem.refreshCharacterList();

// Update UI
LorebookProtectionSystem.updateUI();

// Re-render permission list
LorebookProtectionSystem.updatePermissionList();
```

## 🔧 Configuration API

### Modify Extension Behavior
```javascript
// Set custom security level
LorebookProtectionSystem.updateSettings({
    securityLevel: 'high'
});

// Enable/disable features
LorebookProtectionSystem.updateSettings({
    autoCleanup: false,
    notificationEnabled: true
});

// Custom server name (for testing)
localStorage.setItem('sillytavern-lorebook-protection_server_name', 'TestServer');
```

## 📝 Error Handling

### Common Error Codes
```javascript
// Permission errors
"PERMISSION_DENIED" - User lacks required access
"CHARACTER_NOT_FOUND" - Character ID does not exist
"USER_NOT_FOUND" - User ID not recognized

// System errors
"STORAGE_ERROR" - LocalStorage access failed
"IMPORT_ERROR" - Data import failed
"EXPORT_ERROR" - Data export failed
```

### Error Handling Example
```javascript
try {
    const result = LorebookProtectionSystem.grantPermission(characterId, userId);
    if (result.startsWith('Error:')) {
        console.error('Permission grant failed:', result);
        // Handle error appropriately
    }
} catch (error) {
    console.error('Unexpected error:', error);
    // Handle unexpected errors
}
```

This API provides comprehensive access to all extension functionality while maintaining security and proper integration with SillyTavern's systems.