# SillyTavern Lorebook Permission System - Troubleshooting Guide

This guide provides solutions to common issues and problems that may arise when using the SillyTavern Lorebook Permission System.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Permission Problems](#permission-problems)
3. [Symlink Issues](#symlink-issues)
4. [Performance Issues](#performance-issues)
5. [Configuration Problems](#configuration-problems)
6. [Integration Issues](#integration-issues)
7. [Security Issues](#security-issues)
8. [Debugging Tools](#debugging-tools)

## Installation Issues

### Permission System Not Loading

**Problem**: The permission system doesn't load after SillyTavern startup.

**Symptoms**:
- Permission system appears disabled
- Admin interface returns 404 errors
- No permission checks are performed

**Possible Causes and Solutions**:

#### 1. Server Plugins Not Enabled
**Check**: Verify `enableServerPlugins: true` in your SillyTavern `config.yaml`.

```yaml
# config.yaml
enableServerPlugins: true
serverPlugins:
  - "./src/javascript/permission-middleware.js"
```

**Solution**: Add the above configuration to your SillyTavern config file and restart the server.

#### 2. Missing JavaScript Dependencies
**Check**: Look for missing module errors in the console.

```bash
# Check if dependencies are installed
npm list fs-extra
npm list winston
```

**Solution**: Install missing dependencies:

```bash
npm install fs-extra winston
```

#### 3. Incorrect File Paths
**Check**: Verify file paths in your configuration.

```bash
# Check if permission middleware exists
ls -la src/javascript/permission-middleware.js
```

**Solution**: Ensure all files are in their correct locations according to the repository structure.

### Configuration Files Not Found

**Problem**: Permission system can't find configuration files.

**Symptoms**:
- Error: "Configuration file not found"
- System using default settings
- Configuration changes not taking effect

**Solutions**:

#### 1. Check File Locations
```bash
# Verify config directory exists
ls -la config/

# Check configuration files
ls -la config/permissions-config.yaml
ls -la config/admin-accounts.json
```

#### 2. Verify File Permissions
```bash
# Check file permissions
ls -la config/permissions-config.yaml
# Should be readable by the SillyTavern process

# Fix permissions if needed
chmod 640 config/permissions-config.yaml
chmod 640 config/admin-accounts.json
```

#### 3. Validate Configuration Syntax
```bash
# Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('config/permissions-config.yaml'))"

# Validate JSON syntax
python3 -c "import json; json.load(open('config/admin-accounts.json'))"
```

## Permission Problems

### Users Can't Access Their Own Characters

**Problem**: Character creators cannot access their own protected lorebooks.

**Symptoms**:
- Access denied messages for character owners
- 403 Forbidden errors when accessing lorebooks
- Audit logs showing "Unauthorized access" for owners

**Troubleshooting Steps**:

#### 1. Verify Character Ownership
```bash
# Check character.json for creator field
cat public/characters/character-id/character.json | grep creator

# Should show something like:
# "creator": "username"
```

**Solution**: Ensure the character's `creator` field matches the exact username of the user account.

#### 2. Check User Account Status
```bash
# Verify user exists in SillyTavern
# Check the users directory in your SillyTavern data folder
ls -la data/default-user/users/
```

**Solution**: Ensure the user account exists and is active in SillyTavern.

#### 3. Validate Symlink Creation
```bash
# Check if symlink exists
ls -la protected-lorebooks/username/character-id/

# Verify symlink points to correct target
readlink protected-lorebooks/username/character-id/lorebook.json
```

**Solution**: Recreate the symlink using the admin interface or repair script.

#### 4. Check Permission Matrix
```javascript
// Debug permission check
const result = await permissionMiddleware.checkLorebookPermission('username', 'character-id', 'read');
console.log('Permission result:', result);
```

### Administrator Access Issues

**Problem**: Administrators cannot access all protected lorebooks.

**Symptoms**:
- Admin users getting access denied
- Admin interface showing "Insufficient privileges"
- Can't view or manage other users' characters

**Solutions**:

#### 1. Verify Admin Account Configuration
```bash
# Check admin-accounts.json
cat config/admin-accounts.json

# Should contain the admin username with appropriate permissions
```

#### 2. Check Admin User List in Config
```yaml
# permissions-config.yaml
users:
  adminUsers:
    - admin
    - your-admin-username
```

#### 3. Validate Admin Session
```javascript
// Check admin session validation
const isAdmin = await userManager.isAdmin('admin-username');
console.log('Is admin:', isAdmin);
```

### Permission Checks Always Failing

**Problem**: All permission checks return denied, even for valid access.

**Symptoms**:
- No users can access any protected lorebooks
- Even admins get denied access
- System appears to be in "fail closed" mode

**Solutions**:

#### 1. Check Strict Mode Setting
```yaml
# permissions-config.yaml
permissions:
  strictMode: true  # This causes failures when permission system has errors
```

**Temporary Solution**: Set `strictMode: false` to identify the underlying issue.

#### 2. Check System Logs
```bash
# Look for error messages
tail -f logs/permissions.log

# Check for recent errors
grep -i error logs/permissions.log | tail -10
```

#### 3. Validate Configuration
```bash
# Run configuration validation
node scripts/validate-config.js
```

## Symlink Issues

### Broken Symlinks

**Problem**: Symlinks are broken or point to non-existent files.

**Symptoms**:
- Access denied due to "Symlink validation failed"
- `readlink` commands fail
- Lorebook content not accessible even with correct permissions

**Diagnostics**:

#### 1. Find Broken Symlinks
```bash
# Find all broken symlinks
find protected-lorebooks -type l ! -exec test -e {} \;

# Check specific symlink
ls -la protected-lorebooks/username/character-id/lorebook.json
```

#### 2. Validate Symlink Targets
```bash
# Check if target file exists
readlink protected-lorebooks/username/character-id/lorebook.json
ls -la $(readlink protected-lorebooks/username/character-id/lorebook.json)
```

**Solutions**:

#### 1. Repair Broken Symlinks
```bash
# Use the repair script
./scripts/repair-symlinks.sh --user username

# Or use admin interface
# Navigate to Users -> Repair Symlinks
```

#### 2. Recreate All Symlinks
```bash
# Backup and recreate
./scripts/backup-config.sh
rm -rf protected-lorebooks/*
npm restart
```

### Symlink Permission Denied

**Problem**: Symlinks exist but access is denied due to filesystem permissions.

**Symptoms**:
- "Permission denied" errors when accessing symlinks
- File exists but can't be read
- Admin interface shows valid symlinks but access fails

**Diagnostics**:

#### 1. Check File Permissions
```bash
# Check symlink permissions
ls -la protected-lorebooks/username/character-id/lorebook.json

# Check target file permissions
ls -la public/characters/character-id/lorebook.json
```

#### 2. Check Directory Permissions
```bash
# Check parent directory permissions
ls -la protected-lorebooks/username/
ls -la protected-lorebooks/
```

**Solutions**:

#### 1. Fix File Permissions
```bash
# Set appropriate permissions (640 for files, 750 for directories)
chmod 640 protected-lorebooks/username/character-id/lorebook.json
chmod 750 protected-lorebooks/username/
chmod 750 protected-lorebooks/

# Fix ownership if needed
chown -R sillytavern-user:sillytavern-group protected-lorebooks/
```

#### 2. Check SELinux/AppArmor
```bash
# Check SELinux context (if enabled)
ls -laZ protected-lorebooks/

# Check AppArmor status
sudo apparmor_status
```

### Symlink Creation Fails

**Problem**: System cannot create new symlinks.

**Symptoms**:
- Errors when protecting new characters
- Admin interface shows "Symlink creation failed"
- Manual symlink creation fails

**Solutions**:

#### 1. Check Filesystem Support
```bash
# Check if filesystem supports symlinks
test -L /tmp && echo "Symlinks supported" || echo "Symlinks not supported"

# Check available disk space
df -h .
```

#### 2. Verify Write Permissions
```bash
# Test creating a symlink
ln -s /tmp/test symlink-test
ls -la symlink-test
rm symlink-test
```

#### 3. Check Path Length
```bash
# Long paths can cause issues
# Check maximum path length
getconf PATH_MAX / .

# Keep paths under 255 characters
```

## Performance Issues

### Slow Permission Checks

**Problem**: Permission validation is taking too long.

**Symptoms**:
- Slow lorebook loading times
- High CPU usage during permission checks
- Timeouts in admin interface

**Diagnostics**:

#### 1. Monitor Performance
```javascript
// Add timing to permission checks
console.time('permission-check');
const result = await checkLorebookPermission(userId, characterId, action);
console.timeEnd('permission-check');
```

#### 2. Check Cache Performance
```bash
# Monitor cache size and hit rate
grep -i cache logs/permissions.log | tail -20
```

**Solutions**:

#### 1. Optimize Cache Settings
```yaml
# permissions-config.yaml
performance:
  symlinkCacheSize: 5000          # Increase cache size
  cacheRefreshInterval: 7200      # Reduce refresh frequency
  enableParallelValidation: true  # Enable parallel processing
  maxConcurrentOperations: 10     # Increase concurrent operations
```

#### 2. Optimize Filesystem
```bash
# Use faster filesystem for protected-lorebooks
# Consider SSD storage or RAM disk for high-performance setups

# Optimize directory structure
find protected-lorebooks -type d -empty -delete
```

#### 3. Monitor Resource Usage
```bash
# Monitor memory usage
top -p $(pgrep -f "sillytavern")

# Monitor disk I/O
iotop -o
```

### High Memory Usage

**Problem**: Permission system is using excessive memory.

**Symptoms**:
- Out of memory errors
- System becoming unresponsive
- High memory usage shown in monitoring

**Solutions**:

#### 1. Reduce Cache Size
```yaml
# permissions-config.yaml
performance:
  symlinkCacheSize: 500          # Reduce cache size
  memoryLimit: "256MB"           # Set memory limit
```

#### 2. Clear Cache Regularly
```javascript
// Clear cache periodically
setInterval(() => {
    permissionMiddleware.clearCache();
}, 3600000); // Every hour
```

#### 3. Monitor Memory Usage
```bash
# Monitor memory usage over time
watch -n 5 'ps aux | grep sillytavern'

# Generate memory report
node scripts/memory-usage.js
```

## Configuration Problems

### Invalid YAML Configuration

**Problem**: YAML configuration file has syntax errors.

**Symptoms**:
- Permission system fails to start
- Configuration errors in logs
- Default settings being used

**Diagnostics**:

#### 1. Validate YAML Syntax
```bash
# Check YAML syntax
python3 -c "import yaml; yaml.safe_load(open('config/permissions-config.yaml'))"

# Or use yamllint if available
yamllint config/permissions-config.yaml
```

#### 2. Check for Common Issues
```bash
# Look for indentation issues
cat -A config/permissions-config.yaml | grep -n " "

# Check for tab characters
grep -P "\t" config/permissions-config.yaml
```

**Solutions**:

#### 1. Fix Indentation
```yaml
# Use spaces, not tabs
# Be consistent with indentation levels
permissions:
  enabled: true          # 2 spaces
  strictMode: true       # 2 spaces
```

#### 2. Use Configuration Validator
```bash
# Validate configuration
node scripts/validate-config.js
```

### Configuration Changes Not Applied

**Problem**: Changes to configuration files don't take effect.

**Symptoms**:
- Old settings still being used
- Requires server restart for every change
- Configuration appears to be cached

**Solutions**:

#### 1. Check Configuration Reload
```javascript
// Force configuration reload
await permissionSystem.reloadConfiguration();
```

#### 2. Verify File Watching
```yaml
# permissions-config.yaml
# Enable configuration hot reload
watchConfigFiles: true
configReloadInterval: 60  # seconds
```

#### 3. Clear Configuration Cache
```bash
# Clear any cached configuration
rm -f ./cache/config-*.json
npm restart
```

## Integration Issues

### SillyTavern Integration Fails

**Problem**: Permission system doesn't integrate with SillyTavern properly.

**Symptoms**:
- Permission middleware not called
- SillyTavern ignores permission settings
- API endpoints not registered

**Solutions**:

#### 1. Verify Plugin Registration
```javascript
// Check if plugin is loaded
console.log('Loaded plugins:', global.plugins);
```

#### 2. Check Middleware Registration
```javascript
// Verify middleware is registered
app._router.stack.forEach((middleware, i) => {
    if (middleware.name === 'permissionMiddleware') {
        console.log('Permission middleware found at layer', i);
    }
});
```

#### 3. Test API Endpoints
```bash
# Test permission endpoint
curl -X GET "http://localhost:8000/api/lorebooks/permissions/test"

# Check response headers
curl -I "http://localhost:8000/api/lorebooks/permissions/test"
```

### User Account Integration Issues

**Problem**: Permission system can't access SillyTavern user accounts.

**Symptoms**:
- "User not found" errors
- Can't validate user authentication
- Permission checks fail for valid users

**Solutions**:

#### 1. Check User Directory Structure
```bash
# Verify user data directory
ls -la data/default-user/
ls -la data/username/

# Check if multi-user mode is enabled
grep enableUserAccounts config.yaml
```

#### 2. Verify User Management
```javascript
// Test user manager
const user = await userManager.getUser('username');
console.log('User found:', user);
```

#### 3. Check Authentication
```bash
# Test user authentication
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

## Security Issues

### Unauthorized Access Detected

**Problem**: Users are accessing content they shouldn't be able to.

**Symptoms**:
- Audit logs showing suspicious access patterns
- Security alerts triggered
- Content appearing accessible to unauthorized users

**Immediate Actions**:

#### 1. Enable Emergency Lockdown
```yaml
# permissions-config.yaml
permissions:
  enabled: true
  strictMode: true
  emergencyLockdown: true  # Disable all access except admins
```

#### 2. Review Audit Logs
```bash
# Look for suspicious patterns
grep "access-denied" logs/security-events.log | tail -50

# Check for multiple failed attempts
grep "UNAUTHORIZED" logs/security-events.log | tail -20
```

#### 3. Verify Symlink Security
```bash
# Check for dangerous symlinks
find protected-lorebooks -type l -exec ls -la {} \; | grep -v "\.\./"

# Check for symlinks pointing outside allowed directories
find protected-lorebooks -type l -exec readlink {} \; | grep "^/"
```

**Investigation Steps**:

#### 1. Check User Permissions
```bash
# Review user accounts and roles
node scripts/list-users.js --detailed
```

#### 2. Validate Permission Matrix
```javascript
// Test permission matrix
const testCases = [
    {user: 'regular1', character: 'owned-char', expected: true},
    {user: 'regular1', character: 'other-char', expected: false},
    {user: 'admin', character: 'any-char', expected: true}
];

for (const test of testCases) {
    const result = await checkLorebookPermission(test.user, test.character, 'read');
    console.log(`${test.user} -> ${test.character}: ${result.allowed} (expected: ${test.expected})`);
}
```

#### 3. Check Filesystem Permissions
```bash
# Verify no world-readable files
find protected-lorebooks -type f -perm /o+r

# Check directory permissions
find protected-lorebooks -type d -perm /o+x
```

## Debugging Tools

### Diagnostic Script

Create a comprehensive diagnostic script:

```bash
#!/bin/bash
# diagnostic.sh - Comprehensive system diagnostics

echo "=== SillyTavern Permission System Diagnostic ==="
echo "Timestamp: $(date)"
echo

# 1. System Information
echo "1. System Information:"
echo "   OS: $(uname -a)"
echo "   Node.js: $(node --version)"
echo "   NPM: $(npm --version)"
echo

# 2. File System Check
echo "2. File System Check:"
echo "   Protected lorebooks directory:"
ls -la protected-lorebooks/ 2>/dev/null || echo "   Not found"
echo "   Config files:"
ls -la config/ 2>/dev/null || echo "   Not found"
echo

# 3. Permission System Status
echo "3. Permission System Status:"
if pgrep -f "sillytavern" > /dev/null; then
    echo "   SillyTavern process: Running"
    echo "   PID: $(pgrep -f "sillytavern")"
else
    echo "   SillyTavern process: Not running"
fi
echo

# 4. Symlink Analysis
echo "4. Symlink Analysis:"
total_symlinks=$(find protected-lorebooks -type l 2>/dev/null | wc -l)
valid_symlinks=$(find protected-lorebooks -type l -exec test -e {} \; 2>/dev/null | wc -l)
broken_symlinks=$((total_symlinks - valid_symlinks))

echo "   Total symlinks: $total_symlinks"
echo "   Valid symlinks: $valid_symlinks"
echo "   Broken symlinks: $broken_symlinks"
echo

# 5. Recent Log Analysis
echo "5. Recent Log Analysis:"
if [ -f logs/permissions.log ]; then
    echo "   Recent errors:"
    grep -i error logs/permissions.log | tail -5
    echo "   Recent access denied:"
    grep "access.*denied" logs/permissions.log | tail -5
else
    echo "   No log file found"
fi
echo

echo "=== Diagnostic Complete ==="
```

### Debug Mode

Enable debug mode for detailed logging:

```yaml
# permissions-config.yaml
debug:
  enabled: true
  logLevel: "debug"
  verbosePermissions: true
  logAllRequests: true
  logSymlinkOperations: true
```

### Permission Testing Script

```javascript
// test-permissions.js - Test permission system
const { PermissionMiddleware } = require('./src/javascript/permission-middleware');

async function testPermissions() {
    const middleware = new PermissionMiddleware(config, userManager, symlinkManager);
    
    const testCases = [
        { user: 'admin', character: 'any-character', expected: true },
        { user: 'owner1', character: 'character1', expected: true },
        { user: 'owner1', character: 'character2', expected: false },
        { user: 'user1', character: 'character1', expected: false }
    ];
    
    console.log('Testing permission system...');
    
    for (const test of testCases) {
        try {
            const result = await middleware.checkLorebookPermission(test.user, test.character, 'read');
            const status = result.allowed === test.expected ? '✓' : '✗';
            console.log(`${status} ${test.user} -> ${test.character}: ${result.allowed} (${result.reason})`);
        } catch (error) {
            console.log(`✗ ${test.user} -> ${test.character}: ERROR - ${error.message}`);
        }
    }
}

testPermissions().catch(console.error);
```

This troubleshooting guide should help resolve most common issues with the SillyTavern Lorebook Permission System. For additional support, check the logs, enable debug mode, and consult the GitHub issues page.