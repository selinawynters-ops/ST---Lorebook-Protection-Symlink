# SillyTavern Lorebook Permission System - Security Considerations

This document outlines the security model, potential vulnerabilities, and best practices for implementing the SillyTavern Lorebook Permission System in production environments.

## Security Model Overview

### Defense in Depth Strategy

The permission system implements a multi-layered security approach:

```
┌─────────────────────────────────────────────────────────────┐
│                      Network Layer                          │
│  • Firewall rules for API endpoints                         │
│  • Rate limiting on permission checks                       │
│  • IP whitelisting for admin functions                     │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│  • User authentication validation                           │
│  • Permission matrix enforcement                            │
│  • API endpoint protection                                  │
├─────────────────────────────────────────────────────────────┤
│                   Filesystem Layer                          │
│  • OS-level permission enforcement                          │
│  • Symbolic link access control                            │
│  • Directory permission restrictions                       │
├─────────────────────────────────────────────────────────────┤
│                     Monitoring Layer                        │
│  • Comprehensive audit logging                             │
│  • Real-time security alerts                               │
│  • Anomaly detection and response                          │
└─────────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Least Privilege**: Users only receive access to lorebooks they own or are explicitly granted
2. **Fail Securely**: System denies access when permission validation fails
3. **Complete Mediation**: Every lorebook access attempt is validated
4. **Economy of Mechanism**: Simple, auditable permission logic
5. **Open Design**: Security model is transparent and documented
6. **Separation of Duties**: Administrative and user access are distinctly separated

## Threat Analysis

### Threat Model

#### Asset Classification
- **High Value**: Protected lorebook content, character data
- **Medium Value**: User credentials, permission configuration
- **Low Value**: Access logs, system metadata

#### Threat Actors
1. **Malicious Internal Users**: Authorized users attempting unauthorized access
2. **External Attackers**: Unauthenticated users targeting the system
3. **Compromised Accounts**: Legitimate user credentials obtained by attackers
4. **System Administrators**: Insider threats with elevated privileges

#### Attack Vectors

##### 1. Direct Filesystem Access
**Description**: Bypassing the application to directly access protected files

**Impact**: High - Complete compromise of protected lorebooks

**Mitigation**:
```bash
# Set restrictive filesystem permissions
chmod 750 ./protected-lorebooks
chmod 640 ./protected-lorebooks/*/lorebook.json

# Use dedicated service account
useradd -r -s /bin/false sillytavern-perms
chown -R sillytavern-perms:sillytavern-perms ./protected-lorebooks
```

##### 2. Symlink Manipulation
**Description**: Creating or modifying symlinks to gain unauthorized access

**Impact**: High - Potential access to any file on the system

**Mitigation**:
```javascript
// Symlink validation in symlink-manager.js
async validateSymlinkTarget(sourcePath, targetPath) {
    const resolvedSource = path.resolve(sourcePath);
    const resolvedTarget = path.resolve(targetPath);
    
    // Ensure target is within allowed directories
    const allowedPaths = [
        path.resolve(this.config.originalLorebookPath),
        path.resolve(this.config.symlinkBasePath)
    ];
    
    return allowedPaths.some(allowed => 
        resolvedTarget.startsWith(allowed)
    );
}
```

##### 3. Privilege Escalation
**Description**: Attempting to gain administrator privileges

**Impact**: High - Full system compromise

**Mitigation**:
```yaml
# config/permissions-config.yaml
security:
  enableAdminSessionValidation: true
  adminSessionTimeout: 1800  # 30 minutes
  requireMFAForAdmin: true
  adminActionsRequireConfirmation: true
```

##### 4. Information Disclosure
**Description**: Accessing lorebook content through alternative paths

**Impact**: Medium - Unauthorized disclosure of protected content

**Mitigation**:
```javascript
// Path validation middleware
function validateLorebookPath(req, res, next) {
    const requestedPath = path.normalize(req.params.path);
    const basePath = path.normalize(config.protectedBasePath);
    
    if (!requestedPath.startsWith(basePath)) {
        return res.status(403).json({ error: 'Invalid path' });
    }
    
    next();
}
```

## Security Controls

### Authentication Controls

#### User Authentication
```javascript
// Enhanced authentication validation
class AuthenticationValidator {
    async validateUser(userId, sessionId) {
        // Check session validity
        const session = await this.sessionManager.getSession(sessionId);
        if (!session || session.userId !== userId) {
            throw new SecurityError('Invalid session');
        }
        
        // Check account status
        const user = await this.userManager.getUser(userId);
        if (user.status !== 'active') {
            throw new SecurityError('Account suspended');
        }
        
        // Check for concurrent sessions
        if (this.config.enforceSingleSession) {
            const activeSessions = await this.sessionManager.getActiveSessions(userId);
            if (activeSessions.length > 1) {
                await this.sessionManager.terminateOldSessions(userId);
            }
        }
        
        return user;
    }
}
```

#### Administrator Authentication
```yaml
# Enhanced admin security
security:
  admin:
    requireMFA: true
    sessionTimeout: 1800
    ipWhitelist:
      - "127.0.0.1"
      - "10.0.0.0/8"
      - "192.168.0.0/16"
    maxFailedAttempts: 3
    lockoutDuration: 900
```

### Authorization Controls

#### Permission Matrix Implementation
```javascript
// Robust permission checking
class PermissionMatrix {
    async checkAccess(userId, characterId, action) {
        const user = await this.getUser(userId);
        const character = await this.getCharacter(characterId);
        
        // Validate user status
        if (user.status !== 'active') {
            return { allowed: false, reason: 'User inactive' };
        }
        
        // Check administrator privileges
        if (await this.isAdmin(userId)) {
            return await this.checkAdminAccess(user, character, action);
        }
        
        // Check ownership
        if (character.creator === userId) {
            return await this.checkOwnerAccess(user, character, action);
        }
        
        // Default deny
        return { allowed: false, reason: 'Access denied' };
    }
    
    async checkAdminAccess(user, character, action) {
        if (!user.adminPermissions.includes(action)) {
            return { allowed: false, reason: 'Insufficient admin privileges' };
        }
        
        // Log administrative access
        await this.auditLogger.log({
            type: 'admin_access',
            userId: user.id,
            characterId: character.id,
            action,
            timestamp: new Date().toISOString()
        });
        
        return { allowed: true, reason: 'Administrator access' };
    }
}
```

#### Role-Based Access Control (RBAC)
```json
{
  "roles": {
    "super-admin": {
      "permissions": [
        "full-access",
        "user-management",
        "system-config",
        "audit-log-view"
      ]
    },
    "moderator": {
      "permissions": [
        "read-only-access",
        "user-view",
        "moderation-tools"
      ]
    },
    "user": {
      "permissions": [
        "own-character-access",
        "basic-operations"
      ]
    }
  }
}
```

### Filesystem Security

#### Directory Permission Structure
```bash
# Recommended filesystem permissions
./protected-lorebooks/      750  (sillytavern-perms:sillytavern-perms)
├── admin-access/           750  (sillytavern-perms:sillytavern-perms)
├── user1/                  700  (sillytavern-perms:user1)
│   └── character1/         700  (sillytavern-perms:user1)
│       └── lorebook.json   640  (sillytavern-perms:user1)
└── user2/                  700  (sillytavern-perms:user2)
    └── character2/         700  (sillytavern-perms:user2)
        └── lorebook.json   640  (sillytavern-perms:user2)
```

#### Symlink Security Validation
```javascript
// Comprehensive symlink security
class SymlinkSecurityValidator {
    async validateSymlink(symlinkPath) {
        const stats = await fs.lstat(symlinkPath);
        
        // Ensure it's a symbolic link
        if (!stats.isSymbolicLink()) {
            throw new SecurityError('Path is not a symbolic link');
        }
        
        // Get the target
        const target = await fs.readlink(symlinkPath);
        const resolvedTarget = path.resolve(path.dirname(symlinkPath), target);
        
        // Validate target is within allowed boundaries
        if (!this.isPathAllowed(resolvedTarget)) {
            throw new SecurityError('Symlink target outside allowed paths');
        }
        
        // Check target exists and is accessible
        const targetStats = await fs.stat(resolvedTarget);
        if (!targetStats.isFile()) {
            throw new SecurityError('Symlink target is not a file');
        }
        
        return { valid: true, target: resolvedTarget };
    }
    
    isPathAllowed(targetPath) {
        const allowedPaths = [
            path.resolve(this.config.originalLorebookPath),
            path.resolve(this.config.backupPath)
        ];
        
        return allowedPaths.some(allowed => 
            targetPath.startsWith(allowed)
        );
    }
}
```

### Network Security

#### API Endpoint Protection
```javascript
// API security middleware
const apiSecurity = {
    // Rate limiting
    rateLimit: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests
        message: 'Too many requests from this IP'
    }),
    
    // IP whitelisting for admin endpoints
    adminIpWhitelist: (req, res, next) => {
        const clientIP = req.ip;
        const allowedIPs = config.security.adminIpWhitelist;
        
        if (req.path.startsWith('/admin') && !allowedIPs.includes(clientIP)) {
            return res.status(403).json({ error: 'Admin access from this IP is not allowed' });
        }
        
        next();
    },
    
    // CORS configuration
    corsOptions: {
        origin: config.allowedOrigins,
        credentials: true,
        optionsSuccessStatus: 200
    }
};
```

#### HTTPS Enforcement
```yaml
# config/security.yaml
network:
  enforceHttps: true
  hstsEnabled: true
  hstsMaxAge: 31536000
  sslProtocols:
    - "TLSv1.3"
    - "TLSv1.2"
  ciphers:
    - "ECDHE-RSA-AES256-GCM-SHA384"
    - "ECDHE-RSA-AES128-GCM-SHA256"
```

## Monitoring and Auditing

### Comprehensive Audit Logging

#### Log Configuration
```javascript
// Advanced logging setup
const auditLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.metadata()
    ),
    transports: [
        new winston.transports.File({
            filename: 'logs/permissions.log',
            maxsize: 50 * 1024 * 1024, // 50MB
            maxFiles: 10
        }),
        new winston.transports.File({
            filename: 'logs/security-events.log',
            level: 'warn',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        })
    ]
});
```

#### Security Event Logging
```javascript
// Security event tracking
class SecurityEventLogger {
    logAccessAttempt(userId, characterId, result, reason) {
        const event = {
            timestamp: new Date().toISOString(),
            type: 'access_attempt',
            userId,
            characterId,
            result, // 'granted' or 'denied'
            reason,
            ipAddress: this.getClientIP(),
            userAgent: this.getUserAgent()
        };
        
        this.auditLogger.info('Access attempt', event);
        
        // Alert on suspicious activity
        if (result === 'denied' && this.isSuspicious(userId)) {
            this.sendSecurityAlert(event);
        }
    }
    
    logAdminAction(adminId, action, details) {
        const event = {
            timestamp: new Date().toISOString(),
            type: 'admin_action',
            adminId,
            action,
            details,
            ipAddress: this.getClientIP()
        };
        
        this.auditLogger.warn('Admin action', event);
    }
    
    isSuspicious(userId) {
        // Check for multiple failed attempts
        const recentFailures = this.getRecentFailedAttempts(userId, 5); // 5 minutes
        return recentFailures.length > 5;
    }
}
```

### Real-time Monitoring

#### Intrusion Detection
```javascript
// Real-time threat detection
class IntrusionDetector {
    constructor(config, alertManager) {
        this.config = config;
        this.alertManager = alertManager;
        this.suspiciousPatterns = new Map();
    }
    
    analyzeAccessAttempt(event) {
        // Detect brute force attempts
        this.detectBruteForce(event);
        
        // Detect unusual access patterns
        this.detectUnusualPatterns(event);
        
        // Detect privilege escalation attempts
        this.detectPrivilegeEscalation(event);
    }
    
    detectBruteForce(event) {
        const key = `${event.userId}:${event.ipAddress}`;
        const attempts = this.suspiciousPatterns.get(key) || [];
        
        attempts.push(event.timestamp);
        
        // Clean old attempts (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentAttempts = attempts.filter(time => time > oneHourAgo);
        
        this.suspiciousPatterns.set(key, recentAttempts);
        
        // Alert if too many attempts
        if (recentAttempts.length > this.config.maxFailedAttempts) {
            this.alertManager.sendAlert({
                type: 'brute_force_detected',
                userId: event.userId,
                ipAddress: event.ipAddress,
                attempts: recentAttempts.length
            });
        }
    }
}
```

### Security Alerts and Notifications

#### Alert Configuration
```yaml
# config/alerts.yaml
alerts:
  enabled: true
  channels:
    email:
      enabled: true
      smtp:
        host: "smtp.example.com"
        port: 587
        secure: true
        auth:
          user: "alerts@example.com"
          pass: "${SMTP_PASSWORD}"
      recipients:
        - "security@example.com"
    
    webhook:
      enabled: true
      url: "https://hooks.slack.com/services/..."
      headers:
        Authorization: "Bearer ${WEBHOOK_TOKEN}"
    
    syslog:
      enabled: false
      facility: "security"
      host: "logserver.example.com"
      port: 514
```

## Best Practices

### Operational Security

#### 1. Regular Security Audits
```bash
# Automated security audit script
#!/bin/bash

echo "Running security audit..."

# Check file permissions
echo "Checking file permissions..."
find ./protected-lorebooks -type f -perm /o+r -exec echo "WARNING: World-readable file: {}" \;

# Validate symlink integrity
echo "Validating symlinks..."
find ./protected-lorebooks -type l -exec ./scripts/validate-symlink.sh {} \;

# Check for suspicious log entries
echo "Analyzing security logs..."
grep -i "denied\|failed\|suspicious" ./logs/security-events.log | tail -20

# Review administrator activity
echo "Recent admin activity..."
grep -i "admin_action" ./logs/permissions.log | tail -10

echo "Security audit complete."
```

#### 2. Backup Security
```bash
# Secure backup procedures
#!/bin/bash

BACKUP_DIR="./secure-backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Create encrypted backup
tar -czf - ./protected-lorebooks ./config | \
    gpg --symmetric --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65536 \
    --output "$BACKUP_DIR/encrypted-backup.tar.gz.gpg"

# Set restrictive permissions
chmod 700 "$BACKUP_DIR"
chmod 600 "$BACKUP_DIR"/*

echo "Secure backup created: $BACKUP_DIR"
```

#### 3. Access Review Procedures
```javascript
// Automated access review
class AccessReviewManager {
    async generateAccessReport() {
        const report = {
            timestamp: new Date().toISOString(),
            administrators: await this.getAdminActivity(),
            userAccess: await this.getUserAccessPatterns(),
            protectedLorebooks: await this.getProtectedLorebooksCount(),
            suspiciousActivity: await this.getSuspiciousActivity()
        };
        
        await this.saveReport(report);
        return report;
    }
    
    async getAdminActivity() {
        return await this.db.query(`
            SELECT admin_id, COUNT(*) as action_count, MAX(timestamp) as last_action
            FROM admin_actions 
            WHERE timestamp > NOW() - INTERVAL '30 days'
            GROUP BY admin_id
        `);
    }
}
```

### Configuration Security

#### 1. Secure Configuration Management
```yaml
# Use environment variables for sensitive data
security:
  database:
    host: "${DB_HOST}"
    port: "${DB_PORT}"
    username: "${DB_USER}"
    password: "${DB_PASSWORD}"
  
  encryption:
    key: "${ENCRYPTION_KEY}"
    algorithm: "AES-256-GCM"
```

#### 2. Configuration Validation
```javascript
// Configuration security validator
class ConfigSecurityValidator {
    validateConfig(config) {
        const issues = [];
        
        // Check for hardcoded credentials
        if (config.password && config.password !== '${PASSWORD}') {
            issues.push('Hardcoded password detected in configuration');
        }
        
        // Validate file permissions
        if (config.permissions.mode === '777') {
            issues.push('Insecure file permissions detected');
        }
        
        // Check for debug mode in production
        if (config.debug === true && process.env.NODE_ENV === 'production') {
            issues.push('Debug mode enabled in production');
        }
        
        return issues;
    }
}
```

## Incident Response

### Security Incident Procedures

#### 1. Unauthorized Access Detection
```bash
# Immediate response script
#!/bin/bash

echo "Security incident response initiated..."

# Block suspicious IP
iptables -A INPUT -s "$SUSPICIOUS_IP" -j DROP

# Disable compromised accounts
node scripts/disable-account.js "$COMPROMISED_USER"

# Create forensic snapshot
cp -r ./protected-lorebooks ./forensic/$(date +%Y%m%d_%H%M%S)

# Send alert to security team
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"type": "security_incident", "details": "Unauthorized access detected"}'

echo "Immediate response actions completed."
```

#### 2. Forensic Data Collection
```javascript
// Forensic data collection
class ForensicCollector {
    async collectIncidentData(incidentId) {
        const data = {
            incidentId,
            timestamp: new Date().toISOString(),
            systemState: await this.captureSystemState(),
            logs: await this.collectRelevantLogs(),
            userSessions: await this.captureUserSessions(),
            fileSystem: await this.captureFileSystemState(),
            networkConnections: await this.captureNetworkState()
        };
        
        await this.saveForensicData(data);
        return data;
    }
    
    async captureSystemState() {
        return {
            processes: await this.exec('ps aux'),
            memory: await this.exec('free -h'),
            disk: await this.exec('df -h'),
            network: await this.exec('netstat -tuln')
        };
    }
}
```

This comprehensive security documentation provides a robust framework for implementing and maintaining secure lorebook permissions in SillyTavern environments.