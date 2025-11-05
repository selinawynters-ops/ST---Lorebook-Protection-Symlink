# SillyTavern Lorebook Permission System - API Reference

This document provides comprehensive API documentation for integrating with and extending the SillyTavern Lorebook Permission System.

## Overview

The permission system exposes several APIs for different purposes:

- **Middleware API**: For integrating with SillyTavern's request handling
- **Admin API**: For administrative functions and management
- **User API**: For user-facing permission queries
- **Extension API**: For third-party integrations and custom functionality

## Middleware API

### PermissionMiddleware Class

The main middleware class that handles permission validation for lorebook access requests.

#### Constructor

```javascript
new PermissionMiddleware(config, userManager, symlinkManager)
```

**Parameters:**
- `config` (Object): Configuration object containing system settings
- `userManager` (Object): User management instance for authentication and user data
- `symlinkManager` (Object): Symlink management instance for filesystem operations

**Example:**
```javascript
const middleware = new PermissionMiddleware(
    require('./config/permissions-config.yaml'),
    new UserManager(),
    new SymlinkManager(config)
);
```

#### Methods

##### checkLorebookAccess(req, res, next)

Express.js middleware function for checking lorebook access permissions.

**Parameters:**
- `req` (Object): Express request object
- `res` (Object): Express response object  
- `next` (Function): Express next function

**Usage:**
```javascript
app.use('/api/lorebooks/:characterId', permissionMiddleware.checkLorebookAccess);
```

**Response Headers:**
- `X-Permission-Granted`: Reason for permission grant
- `X-Permission-Source`: Source of permission decision (cache/check)

**Response Codes:**
- `200`: Permission granted, request continues
- `403`: Permission denied with error details
- `429`: Rate limit exceeded
- `500`: System error

##### checkLorebookPermission(userId, characterId, action)

Core permission validation logic.

**Parameters:**
- `userId` (String): Unique user identifier
- `characterId` (String): Unique character identifier
- `action` (String): Action type ('read', 'write', 'delete', 'admin')

**Returns:**
```javascript
{
    allowed: boolean,
    reason: string,
    code: string
}
```

**Example:**
```javascript
const result = await middleware.checkLorebookPermission('user123', 'character456', 'read');
if (result.allowed) {
    // Proceed with access
} else {
    console.log('Access denied:', result.reason);
}
```

## SymlinkManager API

### SymlinkManager Class

Manages symbolic links for lorebook access control.

#### Constructor

```javascript
new SymlinkManager(config)
```

**Parameters:**
- `config` (Object): Configuration object with filesystem settings

#### Methods

##### createUserSymlink(userId, characterId)

Creates a user-specific symlink to a character's lorebook.

**Parameters:**
- `userId` (String): User identifier
- `characterId` (String): Character identifier

**Returns:**
```javascript
{
    success: boolean,
    path?: string,
    character?: Object,
    error?: string
}
```

**Example:**
```javascript
const result = await symlinkManager.createUserSymlink('user123', 'character456');
if (result.success) {
    console.log('Symlink created at:', result.path);
} else {
    console.error('Failed to create symlink:', result.error);
}
```

##### validateSymlink(symlinkPath)

Validates a symlink's integrity and security.

**Parameters:**
- `symlinkPath` (String): Path to the symlink to validate

**Returns:**
```javascript
{
    valid: boolean,
    target?: string,
    size?: number,
    modified?: Date,
    reason?: string
}
```

##### validateUserSymlink(userId, characterId)

Validates and repairs a user's symlink to a character lorebook.

**Parameters:**
- `userId` (String): User identifier
- `characterId` (String): Character identifier

**Returns:**
```javascript
{
    valid: boolean,
    target?: string,
    reason?: string
}
```

##### repairUserSymlinks(userId)

Repairs all broken symlinks for a specific user.

**Parameters:**
- `userId` (String): User identifier

**Returns:**
```javascript
{
    success: boolean,
    totalChecked: number,
    alreadyValid: number,
    repaired: number,
    failed: number,
    details: Array
}
```

##### cleanupUserSymlinks(userId)

Removes all symlinks for a user.

**Parameters:**
- `userId` (String): User identifier

**Returns:**
```javascript
{
    success: boolean,
    message: string
}
```

##### getSymlinkStats()

Returns statistics about the symlink system.

**Returns:**
```javascript
{
    totalUsers: number,
    totalSymlinks: number,
    validSymlinks: number,
    invalidSymlinks: number,
    cacheSize: number
}
```

## Admin API

The admin API provides endpoints for managing the permission system.

### Authentication

All admin API endpoints require administrator authentication. Include the admin session token in the request headers:

```
Authorization: Bearer <admin-session-token>
X-Admin-User: <admin-username>
```

### Endpoints

#### GET /admin/api/status

Get the current status of the permission system.

**Response:**
```javascript
{
    status: "active" | "inactive" | "error",
    version: "1.0.0",
    uptime: 3600,
    stats: {
        totalUsers: 25,
        protectedCharacters: 150,
        activeSymlinks: 300,
        recentAccess: {
            total: 1250,
            granted: 1200,
            denied: 50
        }
    }
}
```

#### GET /admin/api/characters

Retrieve all characters and their protection status.

**Query Parameters:**
- `page` (Number): Page number for pagination (default: 1)
- `limit` (Number): Items per page (default: 50)
- `search` (String): Search term for character names
- `protected` (Boolean): Filter by protection status

**Response:**
```javascript
{
    characters: [
        {
            id: "character123",
            name: "Character Name",
            creator: "user456",
            hasLorebook: true,
            lorebookProtected: true,
            created: "2023-01-01T00:00:00Z",
            modified: "2023-12-01T00:00:00Z"
        }
    ],
    pagination: {
        page: 1,
        limit: 50,
        total: 150,
        pages: 3
    }
}
```

#### POST /admin/api/characters/{characterId}/protect

Protect a character's lorebook.

**Request Body:**
```javascript
{
    protected: true,
    creator: "user456"
}
```

**Response:**
```javascript
{
    success: true,
    message: "Character lorebook protected successfully"
}
```

#### DELETE /admin/api/characters/{characterId}/protect

Remove protection from a character's lorebook.

**Response:**
```javascript
{
    success: true,
    message: "Character lorebook protection removed"
}
```

#### GET /admin/api/users

Retrieve all users and their permissions.

**Query Parameters:**
- `page` (Number): Page number for pagination
- `limit` (Number): Items per page
- `role` (String): Filter by user role

**Response:**
```javascript
{
    users: [
        {
            id: "user123",
            username: "username",
            role: "user" | "admin",
            status: "active" | "inactive",
            created: "2023-01-01T00:00:00Z",
            lastLogin: "2023-12-01T00:00:00Z",
            permissions: ["own-character-access"]
        }
    ],
    pagination: {
        page: 1,
        limit: 50,
        total: 25,
        pages: 1
    }
}
```

#### POST /admin/api/users

Create a new user account.

**Request Body:**
```javascript
{
    username: "newuser",
    role: "user",
    permissions: ["own-character-access"],
    password: "securepassword"
}
```

**Response:**
```javascript
{
    success: true,
    user: {
        id: "newuser123",
        username: "newuser",
        role: "user",
        status: "active",
        created: "2023-12-01T00:00:00Z"
    }
}
```

#### PUT /admin/api/users/{userId}

Update user permissions and settings.

**Request Body:**
```javascript
{
    role: "admin",
    permissions: ["full-access", "user-management"],
    status: "active"
}
```

**Response:**
```javascript
{
    success: true,
    user: {
        id: "user123",
        role: "admin",
        permissions: ["full-access", "user-management"]
    }
}
```

#### GET /admin/api/audit

Retrieve audit log entries.

**Query Parameters:**
- `page` (Number): Page number
- `limit` (Number): Items per page
- `type` (String): Filter by log type
- `result` (String): Filter by result ('granted', 'denied')
- `userId` (String): Filter by user
- `characterId` (String): Filter by character
- `fromDate` (String): ISO date string for start date
- `toDate` (String): ISO date string for end date

**Response:**
```javascript
{
    entries: [
        {
            timestamp: "2023-12-01T12:00:00Z",
            type: "access_attempt",
            userId: "user123",
            characterId: "character456",
            result: "granted",
            reason: "Owner access",
            severity: "info",
            ipAddress: "192.168.1.100"
        }
    ],
    pagination: {
        page: 1,
        limit: 100,
        total: 5000,
        pages: 50
    }
}
```

#### POST /admin/api/symlinks/repair

Repair all broken symlinks in the system.

**Request Body:**
```javascript
{
    userId?: string, // Optional: repair for specific user only
    dryRun: boolean // Optional: simulate repair without making changes
}
```

**Response:**
```javascript
{
    success: true,
    totalChecked: 25,
    repaired: 3,
    failed: 1,
    details: [
        {
            userId: "user123",
            characterId: "character456",
            wasValid: false,
            repairResult: {
                success: true,
                path: "/protected-lorebooks/user123/character456/lorebook.json"
            }
        }
    ]
}
```

#### POST /admin/api/backup

Create a backup of the permission system configuration and data.

**Request Body:**
```javascript
{
    includeSymlinks: boolean,
    includeConfig: boolean,
    includeAuditLogs: boolean,
    compression: "none" | "gzip" | "zip"
}
```

**Response:**
```javascript
{
    success: true,
    backupId: "backup_20231201_120000",
    downloadUrl: "/admin/api/backups/backup_20231201_120000/download",
    size: 1048576,
    createdAt: "2023-12-01T12:00:00Z"
}
```

## User API

The user API provides endpoints for regular users to query their permissions.

### Endpoints

#### GET /api/user/permissions

Get current user's permissions and accessible characters.

**Authentication Required:** User session token

**Response:**
```javascript
{
    userId: "user123",
    permissions: ["own-character-access"],
    accessibleCharacters: [
        {
            id: "character456",
            name: "My Character",
            hasLorebook: true,
            lorebookProtected: true,
            owner: true
        }
    ],
    adminAccess: false
}
```

#### GET /api/user/characters/{characterId}/access

Check if the current user can access a specific character's lorebook.

**Authentication Required:** User session token

**Response:**
```javascript
{
    allowed: boolean,
    reason: string,
    code: string,
    character: {
        id: "character456",
        name: "Character Name",
        hasLorebook: true,
        lorebookProtected: true,
        isOwner: boolean
    }
}
```

## Extension API

The extension API allows third-party developers to integrate with the permission system.

### Events

The permission system emits events that can be listened to by extensions.

#### access-granted

Emitted when a user is granted access to a lorebook.

```javascript
// Listen for access granted events
permissionSystem.on('access-granted', (event) => {
    console.log('Access granted:', {
        userId: event.userId,
        characterId: event.characterId,
        reason: event.reason,
        timestamp: event.timestamp
    });
});
```

**Event Data:**
```javascript
{
    type: "access-granted",
    userId: string,
    characterId: string,
    reason: string,
    timestamp: string,
    ipAddress: string
}
```

#### access-denied

Emitted when access to a lorebook is denied.

```javascript
// Listen for access denied events
permissionSystem.on('access-denied', (event) => {
    // Implement custom security monitoring
    if (event.code === 'UNAUTHORIZED') {
        securityMonitor.recordSuspiciousActivity(event);
    }
});
```

#### character-protected

Emitted when a character's lorebook is protected.

```javascript
// Listen for character protection events
permissionSystem.on('character-protected', (event) => {
    console.log('Character protected:', {
        characterId: event.characterId,
        creator: event.creator,
        protectedBy: event.protectedBy
    });
});
```

### Hooks

Extensions can register hooks to modify permission system behavior.

#### beforePermissionCheck

Called before permission validation occurs.

```javascript
// Register a before permission check hook
permissionSystem.registerHook('beforePermissionCheck', async (context) => {
    // Add custom permission logic
    if (context.userId === 'special-user') {
        context.bypassPermissionCheck = true;
    }
    
    return context;
});
```

**Context Object:**
```javascript
{
    userId: string,
    characterId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    bypassPermissionCheck: boolean // Set to true to bypass standard checks
}
```

#### afterPermissionCheck

Called after permission validation is complete.

```javascript
// Register an after permission check hook
permissionSystem.registerHook('afterPermissionCheck', async (context, result) => {
    // Log permission decisions to external system
    await externalLogger.log({
        userId: context.userId,
        characterId: context.characterId,
        allowed: result.allowed,
        reason: result.reason
    });
    
    return result;
});
```

#### beforeSymlinkCreation

Called before a symlink is created.

```javascript
// Register a before symlink creation hook
permissionSystem.registerHook('beforeSymlinkCreation', async (context) => {
    // Validate symlink creation with external policy
    const policyResult = await policyEngine.validateSymlink(context);
    if (!policyResult.allowed) {
        throw new Error('Symlink creation blocked by policy: ' + policyResult.reason);
    }
    
    return context;
});
```

### Custom Permission Providers

Extensions can provide custom permission logic by implementing a permission provider.

```javascript
// Create a custom permission provider
class CustomPermissionProvider {
    async checkPermissions(userId, characterId, action) {
        // Implement custom permission logic
        const user = await this.getUser(userId);
        const character = await this.getCharacter(characterId);
        
        // Example: Allow access based on user subscription tier
        if (user.subscriptionTier === 'premium' && character.premiumContent) {
            return { allowed: true, reason: 'Premium user access' };
        }
        
        return null; // Fall back to default permission logic
    }
}

// Register the custom provider
permissionSystem.registerPermissionProvider(new CustomPermissionProvider());
```

## Configuration API

### Get Configuration

```javascript
// Get current configuration
const config = permissionSystem.getConfiguration();

// Get specific configuration section
const securityConfig = permissionSystem.getConfiguration('security');
```

### Update Configuration

```javascript
// Update configuration
await permissionSystem.updateConfiguration({
    security: {
        maxAccessAttempts: 15,
        enableRateLimiting: true
    }
});

// Update specific section
await permissionSystem.updateConfiguration('performance', {
    cacheSize: 2000
});
```

## Error Handling

### Error Types

The API uses specific error codes for different failure scenarios:

- `USER_NOT_FOUND`: User account does not exist
- `CHARACTER_NOT_FOUND`: Character does not exist
- `UNAUTHORIZED`: User lacks permission for the requested action
- `SYMLINK_ERROR`: Symlink creation or validation failed
- `RATE_LIMIT_EXCEEDED`: Too many access attempts
- `SYSTEM_ERROR`: Internal system error

### Error Response Format

```javascript
{
    error: "Error message",
    code: "ERROR_CODE",
    timestamp: "2023-12-01T12:00:00Z",
    requestId: "req_123456789"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **User endpoints**: 100 requests per minute per user
- **Admin endpoints**: 200 requests per minute per admin
- **Permission checks**: 50 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701388800
```

## Webhooks

The permission system can send webhook notifications for important events.

### Configure Webhook

```javascript
// Configure webhook in config.yaml
webhooks:
  url: "https://your-webhook-endpoint.com/permissions"
  events:
    - "access-denied"
    - "admin-action"
    - "character-protected"
  headers:
    Authorization: "Bearer your-webhook-token"
  retryAttempts: 3
  timeout: 5000
```

### Webhook Payload

```javascript
{
    eventType: "access-denied",
    timestamp: "2023-12-01T12:00:00Z",
    data: {
        userId: "user123",
        characterId: "character456",
        reason: "Unauthorized access",
        ipAddress: "192.168.1.100"
    }
}
```

This API reference provides comprehensive information for integrating with and extending the SillyTavern Lorebook Permission System.