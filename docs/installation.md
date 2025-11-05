# SillyTavern Lorebook Permission System - Installation Guide

This guide provides step-by-step instructions for installing and configuring the SillyTavern Lorebook Permission System on your server.

## Prerequisites

### System Requirements

#### Minimum Requirements
- **Operating System**: Linux (Ubuntu 18.04+), macOS (10.14+), or Windows (10+)
- **Node.js**: Version 16.0 or higher
- **SillyTavern**: Version 1.15.0 or higher with multi-user mode enabled
- **Disk Space**: 100MB additional space for permission system files
- **Memory**: 512MB additional RAM for permission management processes

#### Recommended Requirements
- **Operating System**: Linux (Ubuntu 20.04+ LTS) for optimal performance
- **Node.js**: Version 18.0 or higher
- **SillyTavern**: Latest stable version
- **Disk Space**: 1GB for backups and logs
- **Memory**: 2GB additional RAM for high-traffic servers

### Permissions Required

#### Linux/macOS
- Write access to SillyTavern installation directory
- Ability to create symbolic links (chmod permissions)
- sudo access for system-level configuration (optional)

#### Windows
- Administrator privileges for symlink creation
- Write access to SillyTavern installation directory
- Windows 10/11 with developer mode enabled (for symlink support)

## Installation Methods

### Method 1: Automated Setup Script (Recommended)

#### Linux/macOS Installation

1. **Download the Repository**
   ```bash
   cd /path/to/your/sillytavern
   git clone https://github.com/your-org/sillytavern-lorebook-permissions.git
   cd sillytavern-lorebook-permissions
   ```

2. **Run the Setup Script**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Follow the Interactive Prompts**
   - Enter your SillyTavern installation path
   - Configure administrator accounts
   - Choose security settings
   - Set up backup preferences

4. **Verify Installation**
   ```bash
   ./scripts/validate-permissions.sh
   ```

#### Windows Installation

1. **Download the Repository**
   ```powershell
   cd C:\path\to\your\sillytavern
   git clone https://github.com/your-org/sillytavern-lorebook-permissions.git
   cd sillytavern-lorebook-permissions
   ```

2. **Run the Setup Script**
   ```batch
   scripts\setup.bat
   ```

3. **Follow the Windows Setup Wizard**
   - Select SillyTavern installation directory
   - Configure Windows-specific settings
   - Set up administrator accounts
   - Enable Windows Defender exclusions if needed

### Method 2: Manual Installation

#### Step 1: File Structure Setup

1. **Create Directory Structure**
   ```bash
   mkdir -p sillytavern-lorebook-permissions/{docs,src/{javascript,css,html},scripts,config,examples,tests}
   ```

2. **Copy Source Files**
   ```bash
   cp -r src/* /path/to/sillytavern/src/
   cp -r config/* /path/to/sillytavern/config/
   cp -r scripts/* /path/to/sillytavern/scripts/
   ```

#### Step 2: Configuration

1. **Edit Main Configuration**
   ```yaml
   # config/permissions-config.yaml
   permissions:
     enabled: true
     strictMode: true
   
   filesystem:
     symlinkBasePath: "./protected-lorebooks"
     originalLorebookPath: "./public/characters"
   
   users:
     adminUsers:
       - your-admin-username
   ```

2. **Configure Administrator Accounts**
   ```json
   // config/admin-accounts.json
   {
     "administrators": [
       {
         "username": "admin",
         "role": "super-admin",
         "permissions": ["full-access", "user-management"]
       }
     ]
   }
   ```

#### Step 3: SillyTavern Integration

1. **Update SillyTavern Configuration**
   ```yaml
   # In your SillyTavern config.yaml
   enableUserAccounts: true
   enableServerPlugins: true
   serverPlugins:
     - "./src/javascript/permission-middleware.js"
   ```

2. **Install Node.js Dependencies**
   ```bash
   npm install fs-extra path-extra winston
   ```

## Configuration

### Basic Configuration

#### Enabling the Permission System

1. **Edit permissions-config.yaml**
   ```yaml
   permissions:
     enabled: true
     strictMode: true  # Recommended for production
   
   security:
     enableAuditLogging: true
     logLevel: "info"
   ```

2. **Restart SillyTavern**
   ```bash
   npm restart
   ```

#### Setting Up Administrators

1. **Edit admin-accounts.json**
   ```json
   {
     "administrators": [
       {
         "username": "server-admin",
         "role": "super-admin",
         "permissions": ["full-access", "user-management", "system-config"]
       },
       {
         "username": "moderator",
         "role": "moderator",
         "permissions": ["read-only-access", "user-view"]
       }
     ]
   }
   ```

### Advanced Configuration

#### Filesystem Settings

```yaml
filesystem:
  symlinkBasePath: "./protected-lorebooks"
  originalLorebookPath: "./public/characters"
  backupPath: "./backups/protected-lorebooks"
  createBackups: true
  backupRetention: 30  # days
  compressionEnabled: true
```

#### Performance Tuning

```yaml
performance:
  symlinkCacheSize: 1000
  cacheRefreshInterval: 3600  # seconds
  enableParallelValidation: true
  maxConcurrentOperations: 5
  memoryLimit: "512MB"
```

#### Security Hardening

```yaml
security:
  enableAuditLogging: true
  logLevel: "warn"
  maxLogFileSize: "50MB"
  logRetentionDays: 90
  enableRateLimiting: true
  maxAccessAttempts: 5
  lockoutDuration: 900  # seconds
  ipWhitelist:
    - "127.0.0.1"
    - "::1"
```

## Post-Installation Setup

### Creating Protected Lorebooks

1. **Access the Admin Interface**
   - Open SillyTavern in your browser
   - Navigate to the "Lorebook Permissions" admin panel
   - Log in with administrator credentials

2. **Protect Existing Lorebooks**
   - Click "Scan Existing Lorebooks"
   - Select lorebooks to protect
   - Click "Apply Protection"

3. **Verify Protection**
   - Test access with different user accounts
   - Check symlink creation in `./protected-lorebooks/`
   - Review audit logs

### User Account Setup

1. **Create User Accounts**
   ```bash
   # Using SillyTavern's user management
   # or via the admin interface
   ```

2. **Assign Character Ownership**
   ```json
   // In character.json files
   {
     "name": "Character Name",
     "description": "Character description",
     "creator": "username",  // This determines ownership
     "lorebook": {
       "protected": true
     }
   }
   ```

### Testing the Installation

#### Basic Functionality Test

1. **Test Owner Access**
   ```bash
   # Log in as character creator
   # Verify access to own lorebooks
   # Confirm denial of others' lorebooks
   ```

2. **Test Administrator Access**
   ```bash
   # Log in as administrator
   # Verify access to all protected lorebooks
   # Test admin interface functionality
   ```

3. **Test Permission Enforcement**
   ```bash
   # Log in as regular user
   # Confirm denied access to protected lorebooks
   # Verify audit logs capture attempts
   ```

#### Automated Validation

```bash
# Run the validation script
./scripts/validate-permissions.sh --full-test

# Expected output:
# ✓ Permission system enabled
# ✓ Configuration files valid
# ✓ Administrator accounts configured
# ✓ Symlink creation working
# ✓ File permissions correct
# ✓ Integration with SillyTavern successful
```

## Migration from Existing Setup

### Migrating Existing Lorebooks

1. **Backup Current Lorebooks**
   ```bash
   cp -r ./public/characters ./backups/characters-$(date +%Y%m%d)
   ```

2. **Run Migration Script**
   ```bash
   ./scripts/migrate-existing.sh --backup --protect-all
   ```

3. **Review Migration Results**
   ```bash
   cat ./logs/migration.log
   ```

### Updating Character Cards

1. **Add Creator Information**
   ```json
   // For each character.json
   {
     "name": "Character Name",
     "creator": "original-creator-username",
     "lorebook_protected": true
   }
   ```

2. **Validate Character Cards**
   ```bash
   node scripts/validate-characters.js
   ```

## Troubleshooting

### Common Installation Issues

#### Symlink Creation Fails

**Problem**: Permission denied when creating symlinks

**Solution**:
```bash
# Linux/macOS
sudo chmod 755 /path/to/sillytavern
sudo chown -R $USER:$USER /path/to/sillytavern/protected-lorebooks

# Windows
# Run PowerShell as Administrator
# Enable Developer Mode in Windows Settings
```

#### Configuration Not Loading

**Problem**: Permission system not enabled after restart

**Solution**:
1. Verify config.yaml syntax
2. Check file permissions on config files
3. Restart SillyTavern with --debug flag
4. Review startup logs for errors

#### User Access Issues

**Problem**: Users cannot access their own lorebooks

**Solution**:
1. Verify user accounts exist in SillyTavern
2. Check character.json creator fields
3. Validate symlink creation
4. Review permission matrix

### Performance Issues

#### Slow Lorebook Loading

**Problem**: Lorebook access is slow after installation

**Solution**:
```yaml
# Increase cache size in config
performance:
  symlinkCacheSize: 5000
  enableParallelValidation: true
  maxConcurrentOperations: 10
```

#### High Memory Usage

**Problem**: Permission system using excessive memory

**Solution**:
```yaml
# Limit memory usage
performance:
  memoryLimit: "256MB"
  cacheRefreshInterval: 7200
```

## Maintenance

### Regular Maintenance Tasks

1. **Log Rotation** (Weekly)
   ```bash
   ./scripts/rotate-logs.sh
   ```

2. **Symlink Validation** (Daily)
   ```bash
   ./scripts/validate-symlinks.sh --auto-repair
   ```

3. **Backup Creation** (Daily)
   ```bash
   ./scripts/backup-config.sh
   ```

4. **Security Audit** (Monthly)
   ```bash
   ./scripts/security-audit.sh
   ```

### Updates and Upgrades

1. **Update Permission System**
   ```bash
   git pull origin main
   npm update
   ./scripts/upgrade.sh
   ```

2. **Update SillyTavern Integration**
   ```bash
   # Update middleware files
   cp src/javascript/permission-middleware.js /path/to/sillytavern/
   ```

## Support

### Getting Help

1. **Check Documentation**: Review this guide and the troubleshooting section
2. **Review Logs**: Check `./logs/permissions.log` for error messages
3. **Run Diagnostics**: Use `./scripts/diagnose.sh` for system analysis
4. **Community Support**: Visit the SillyTavern Discord community
5. **Issue Reporting**: Create an issue on the GitHub repository

### Diagnostic Information

To provide effective support, include the following information:

- Operating system and version
- Node.js version
- SillyTavern version
- Permission system version
- Configuration files (redacted)
- Relevant log entries
- Steps to reproduce the issue

```bash
# Generate diagnostic report
./scripts/generate-diagnostic.sh > diagnostic-report.txt
```

This completes the installation guide. Your SillyTavern server should now have a fully functional lorebook permission system protecting character content while maintaining accessibility for authorized users.