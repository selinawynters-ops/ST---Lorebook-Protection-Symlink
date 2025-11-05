# SillyTavern Lorebook Permission System - Architecture

## Overview

The SillyTavern Lorebook Permission System implements a sophisticated access control mechanism using symbolic links to restrict lorebook access to authorized users only. This document provides a detailed technical overview of the system architecture, implementation details, and design decisions.

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    SillyTavern Server                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   User Request  │  │  Permission     │  │  File System│ │
│  │   (Lorebook     │──▶│  Middleware     │──▶│  Access     │ │
│  │   Access)       │  │  Validation     │  │  (Symlinks)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                        │                      │
│           ▼                        ▼                      ▼
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  User Identity  │  │  Permission     │  │  Protected  │ │
│  │  Validation     │  │  Matrix         │  │  Lorebooks  │ │
│  │                 │  │  (Owner/Admin)  │  │  (Original  │ │
│  │                 │  │                 │  │   Files)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Permission Middleware
- **Location**: `src/javascript/permission-middleware.js`
- **Purpose**: Intercepts all lorebook access requests and validates permissions
- **Key Functions**:
  - User authentication verification
  - Ownership validation for lorebooks
  - Administrator privilege checking
  - Access request logging and auditing

#### 2. Symlink Manager
- **Location**: `src/javascript/symlink-manager.js`
- **Purpose**: Manages symbolic link creation, validation, and maintenance
- **Key Functions**:
  - Creates user-specific symlinks to protected lorebooks
  - Validates symlink integrity and permissions
  - Handles symlink cleanup and repair
  - Monitors filesystem changes

#### 3. Admin Interface
- **Location**: `src/html/admin-interface.html`, `src/javascript/admin-interface.js`
- **Purpose**: Provides web-based administration for permission management
- **Key Functions**:
  - Visual permission management interface
  - User account administration
  - Lorebook protection status monitoring
  - Audit log viewing and management

#### 4. User Permission Validator
- **Location**: `src/javascript/user-permissions.js`
- **Purpose**: Validates user permissions against the permission matrix
- **Key Functions**:
  - User role verification
  - Character ownership checking
  - Permission inheritance handling
  - Temporary access grant management

## Permission Model

### Permission Tiers

#### Level 1: Owner Access
- **Definition**: Original creator of the character
- **Scope**: Full access to all lorebook content for their characters
- **Implementation**: Automatic permission based on character card metadata
- **Validation**: Checks character card `creator` field against authenticated user

#### Level 2: Administrator Access
- **Definition**: Server administrators
- **Scope**: Read-only access to all protected lorebooks for moderation
- **Implementation**: Configured in `config/admin-accounts.json`
- **Validation**: Checks user handle against administrator list

#### Level 3: Denied Access
- **Definition**: All other users
- **Scope**: No access to protected lorebook content
- **Implementation**: Default behavior for non-authorized users
- **Validation**: Returns 403 Forbidden for access attempts

### Permission Matrix

| User Type | Own Characters | Others' Characters | System Lorebooks | Admin Functions |
|-----------|----------------|-------------------|------------------|-----------------|
| Owner     | ✅ Full Access  | ❌ No Access       | ❌ No Access     | ❌ No Access    |
| Admin     | ✅ Read-Only    | ✅ Read-Only       | ✅ Read-Only     | ✅ Full Access  |
| Regular   | ❌ No Access    | ❌ No Access       | ❌ No Access     | ❌ No Access    |

## File System Structure

### Directory Layout

```
sillytavern/
├── data/                          # Standard SillyTavern data
│   ├── default-user/             # Default user directory
│   ├── user1/                    # Regular user directories
│   └── user2/
├── public/                       # Public content
│   └── characters/               # Character definitions
│       ├── character1/
│       │   ├── character.json
│       │   └── lorebook.json     # Original lorebook file
│       └── character2/
├── protected-lorebooks/          # Permission-controlled area
│   ├── user1/                    # User's accessible lorebooks
│   │   ├── character1/           # Symlink to original
│   │   │   └── lorebook.json -> ../../public/characters/character1/lorebook.json
│   │   └── character3/           # User's own character
│   │       └── lorebook.json -> ../../public/characters/character3/lorebook.json
│   └── admin-access/             # Administrator access
│       └── all-characters/       # Symlinks to all lorebooks
│           ├── character1/
│           └── character2/
└── config/                       # Configuration files
    ├── permissions-config.yaml
    └── admin-accounts.json
```

### Symlink Strategy

#### User-Specific Symlinks
- Each user gets a dedicated directory in `protected-lorebooks/`
- Only symlinks to their own characters' lorebooks are created
- Symlinks are created dynamically on user login

#### Administrator Symlinks
- Administrators get access to all lorebooks
- Separate directory structure to prevent conflicts
- Read-only permissions enforced at filesystem level

#### Symlink Validation
- Regular integrity checks ensure symlinks point to valid targets
- Automatic repair for broken symlinks
- Audit trail for symlink creation and modification

## Implementation Details

### JavaScript Components

#### Permission Middleware (permission-middleware.js)

```javascript
/**
 * Permission checking middleware for lorebook access
 * Intercepts API calls and validates user permissions
 */
class PermissionMiddleware {
    constructor(config, userManager, symlinkManager) {
        this.config = config;
        this.userManager = userManager;
        this.symlinkManager = symlinkManager;
        this.auditLogger = new AuditLogger();
    }

    async checkLorebookAccess(userId, characterId, action = 'read') {
        // Validate user authentication
        const user = await this.userManager.getUser(userId);
        if (!user) {
            this.auditLogger.logAccess(userId, characterId, 'denied', 'user_not_found');
            return { allowed: false, reason: 'User not found' };
        }

        // Check administrator privileges
        if (await this.userManager.isAdmin(userId)) {
            this.auditLogger.logAccess(userId, characterId, 'granted', 'admin_access');
            return { allowed: true, reason: 'Administrator access' };
        }

        // Verify character ownership
        const isOwner = await this.userManager.isOwner(userId, characterId);
        if (isOwner) {
            this.auditLogger.logAccess(userId, characterId, 'granted', 'owner_access');
            return { allowed: true, reason: 'Owner access' };
        }

        // Default deny
        this.auditLogger.logAccess(userId, characterId, 'denied', 'unauthorized');
        return { allowed: false, reason: 'Unauthorized access' };
    }

    async createSymlinkForUser(userId, characterId) {
        const accessResult = await this.checkLorebookAccess(userId, characterId, 'create_symlink');
        if (!accessResult.allowed) {
            throw new Error('Unauthorized to create symlink');
        }

        return await this.symlinkManager.createUserSymlink(userId, characterId);
    }
}
```

#### Symlink Manager (symlink-manager.js)

```javascript
/**
 * Manages symbolic links for lorebook access control
 */
class SymlinkManager {
    constructor(config) {
        this.config = config;
        this.basePath = config.symlinkBasePath || './protected-lorebooks';
        this.originalPath = config.originalLorebookPath || './public/characters';
    }

    async createUserSymlink(userId, characterId) {
        const userDir = path.join(this.basePath, userId);
        const characterDir = path.join(userDir, characterId);
        const sourceFile = path.join(this.originalPath, characterId, 'lorebook.json');
        const targetFile = path.join(characterDir, 'lorebook.json');

        // Create directories if they don't exist
        await fs.mkdir(userDir, { recursive: true });
        await fs.mkdir(characterDir, { recursive: true });

        // Remove existing symlink if present
        try {
            await fs.unlink(targetFile);
        } catch (error) {
            // Symlink doesn't exist, which is fine
        }

        // Create new symlink
        await fs.symlink(sourceFile, targetFile);

        return { success: true, path: targetFile };
    }

    async validateSymlink(symlinkPath) {
        try {
            const stats = await fs.lstat(symlinkPath);
            if (!stats.isSymbolicLink()) {
                return { valid: false, reason: 'Not a symbolic link' };
            }

            const target = await fs.readlink(symlinkPath);
            const targetExists = await fs.access(target).then(() => true).catch(() => false);

            return { valid: targetExists, target, exists: targetExists };
        } catch (error) {
            return { valid: false, reason: error.message };
        }
    }

    async cleanupUserSymlinks(userId) {
        const userDir = path.join(this.basePath, userId);
        try {
            await fs.rm(userDir, { recursive: true, force: true });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
```

### Configuration System

#### permissions-config.yaml

```yaml
# SillyTavern Lorebook Permission System Configuration

# Core Settings
permissions:
  enabled: true
  strictMode: true  # Fail closed if permission system fails
  
# Filesystem Configuration
filesystem:
  symlinkBasePath: "./protected-lorebooks"
  originalLorebookPath: "./public/characters"
  backupPath: "./backups/protected-lorebooks"
  createBackups: true

# User Management
users:
  adminUsers:
    - admin
    - server-operator
    - moderator
  ownerField: "creator"  # Field in character.json that identifies owner
  
# Security Settings
security:
  enableAuditLogging: true
  logLevel: "info"
  maxLogFileSize: "10MB"
  logRetentionDays: 30
  enableRateLimiting: true
  maxAccessAttempts: 10
  lockoutDuration: 300  # seconds

# Performance Settings
performance:
  symlinkCacheSize: 1000
  cacheRefreshInterval: 3600  # seconds
  enableParallelValidation: true
  maxConcurrentOperations: 5

# Integration Settings
sillytavern:
  enableMiddleware: true
  apiEndpoint: "/api/lorebooks/permissions"
  webhookUrl: ""  # Optional webhook for permission events
  customHeaders:
    X-Permission-System: "SillyTavern-Lorebook-Permissions"
```

## Security Considerations

### Threat Model

#### Potential Attack Vectors
1. **Direct Filesystem Access**: Users bypassing the application to access files directly
2. **Symlink Manipulation**: Malicious creation or modification of symlinks
3. **Privilege Escalation**: Attempting to gain administrator access
4. **Information Disclosure**: Accessing lorebook content through alternate paths

#### Mitigation Strategies
1. **Filesystem Permissions**: Enforce OS-level permissions on protected directories
2. **Path Validation**: Strict validation of all file paths and symlink targets
3. **Access Logging**: Comprehensive audit logging of all access attempts
4. **Regular Validation**: Periodic checks of symlink integrity and permissions

### Access Control Implementation

#### Multi-Layer Security
1. **Application Layer**: Permission middleware validates user requests
2. **Filesystem Layer**: OS permissions enforce access restrictions
3. **Network Layer**: Optional additional network-level controls
4. **Monitoring Layer**: Continuous monitoring and alerting

#### Permission Inheritance
- User permissions inherit from SillyTavern's user management system
- Administrator privileges are explicitly configured
- Temporary access grants are time-limited and audited

## Performance Optimization

### Caching Strategy
- **Symlink Metadata Cache**: Caches symlink validation results
- **Permission Cache**: Caches user permission checks
- **Character Metadata Cache**: Caches character ownership information

### Lazy Loading
- Symlinks are created on-demand when users access characters
- Permission validation uses cached results when possible
- Background processes handle maintenance tasks

### Scalability Considerations
- Designed for servers with up to 1000 concurrent users
- Handles up to 10,000 protected lorebooks efficiently
- Minimal impact on regular SillyTavern performance

## Integration Points

### SillyTavern API Integration
- Hooks into existing lorebook API endpoints
- Seamless integration with character management
- Compatible with existing user authentication

### Extension API
- Provides hooks for custom permission logic
- Allows third-party extensions to integrate with permission system
- Event-driven architecture for real-time permission updates

### Database Integration
- Optional integration with external user directories
- Support for LDAP/Active Directory authentication
- Custom permission storage backends

This architecture provides a robust, secure, and scalable foundation for implementing lorebook permissions in SillyTavern while maintaining compatibility with existing systems and workflows.