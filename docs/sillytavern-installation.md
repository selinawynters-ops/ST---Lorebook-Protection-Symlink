# SillyTavern Lorebook Permission System - Installation Guide

## Overview

This guide explains how to install and configure the SillyTavern Lorebook Permission System, which ensures that character lorebooks can only be accessed by their creators/owners and server administrators through the SillyTavern application.

## Prerequisites

- SillyTavern installed and running
- Node.js 14+ (for the permission system)
- Administrator access to the server
- Basic understanding of file permissions and directories

## Installation Steps

### Step 1: Extract the ZIP Package

Extract the `sillytavern-lorebook-permissions.zip` file to your SillyTavern installation directory:

```bash
# Navigate to your SillyTavern directory
cd /path/to/sillytavern

# Extract the permission system
unzip sillytavern-lorebook-permissions.zip
```

### Step 2: Install Dependencies

Navigate to the permission system directory and install required packages:

```bash
cd sillytavern-lorebook-permissions
npm install
```

### Step 3: Configure SillyTavern Integration

Edit the configuration file to match your SillyTavern setup:

```bash
# Copy the example configuration
cp config/sillytavern-integration.yaml config/sillytavern-integration.yaml.local

# Edit the configuration
nano config/sillytavern-integration.yaml.local
```

**Important Configuration Options:**

```yaml
sillytavern:
  # Update these URLs to match your SillyTavern instance
  allowed_origins:
    - "http://localhost:8000"    # Change if you use different port
    - "http://127.0.0.1:8000"
    - "https://your-sillytavern-domain.com"  # Add your domain if remote

access_restrictions:
  # Keep these enabled for security
  allow_internal_only: true
  block_direct_filesystem: true

filesystem_security:
  # Set this to your SillyTavern data directory
  base_directory: "./sillytavern-data"
```

### Step 4: Initialize the Permission System

Run the initialization script:

```bash
# For Linux/macOS
chmod +x scripts/setup.sh
./scripts/setup.sh

# For Windows
.\scripts\setup.ps1
```

This script will:
- Create necessary directories
- Set up initial configuration
- Create default admin accounts
- Initialize the permission database

### Step 5: Integrate with SillyTavern

#### Option A: Automatic Integration (Recommended)

Edit your SillyTavern's `server.js` file and add these lines at the top:

```javascript
// Add after other require statements
const SillyTavernIntegration = require('./sillytavern-lorebook-permissions/src/javascript/sillytavern-integration');

// Initialize the permission system
const permissionSystem = new SillyTavernIntegration();

// Integrate with your Express app
permissionSystem.integrateWithSillyTavern(app);
```

#### Option B: Manual Integration

If you prefer manual integration, add the following middleware to your SillyTavern routes:

```javascript
const SillyTavernAccessMiddleware = require('./sillytavern-lorebook-permissions/src/javascript/sillytavern-access-middleware');

// Create middleware instance
const accessMiddleware = new SillyTavernAccessMiddleware();

// Apply to lorebook routes
app.use('/api/lorebooks', accessMiddleware.checkSillyTavernAccess.bind(accessMiddleware));
app.use('/api/characters', accessMiddleware.checkSillyTavernAccess.bind(accessMiddleware));
```

### Step 6: Restart SillyTavern

Restart your SillyTavern instance to load the permission system:

```bash
# Stop SillyTavern
# Ctrl+C or kill the process

# Restart SillyTavern
node server.js
```

### Step 7: Verify Installation

Test the installation by accessing the admin interface:

1. Open SillyTavern in your browser
2. Navigate to: `http://localhost:8000/sillytavern-lorebook-permissions/src/html/admin-interface.html`
3. Log in with your admin credentials (default: admin/admin123 - CHANGE IMMEDIATELY)

## Security Configuration

### Enable API Key Authentication (Optional)

For additional security, enable API key authentication:

1. Edit `config/sillytavern-integration.yaml`:
```yaml
sillytavern:
  require_api_key: true
```

2. Set the environment variable:
```bash
export SILLYTAVERN_API_KEY="your-secure-api-key-here"
```

### Configure Session Security

Set a secure session secret:

```bash
export SILLYTAVERN_SESSION_SECRET="your-random-session-secret-here"
```

### File System Permissions

Ensure proper file permissions:

```bash
# Linux/macOS
chmod 750 sillytavern-data
chmod 640 sillytavern-data/permissions/*.json
chmod 640 config/*.yaml
```

## Usage Guide

### For Character Creators

1. **Create a Character**: Create your character as usual in SillyTavern
2. **Access Your Lorebook**: Your lorebook is automatically restricted to you
3. **Grant Access**: Use the admin interface to grant access to specific users

### For Server Administrators

1. **Access Admin Interface**: Navigate to the admin interface through SillyTavern
2. **Manage Permissions**: View, grant, and revoke access to character lorebooks
3. **Monitor Access**: Check logs for access attempts and security events

### For Regular Users

1. **Access Allowed Lorebooks**: Users can only access lorebooks they have permission for
2. **Request Access**: Contact the character creator or server admin for access

## Troubleshooting

### Common Issues

**Issue: "Access Denied" errors**
- Check that you're accessing through SillyTavern, not directly
- Verify the allowed_origins configuration
- Check that your User-Agent includes "SillyTavern"

**Issue: Permission system not loading**
- Verify Node.js dependencies are installed
- Check the SillyTavern logs for integration errors
- Ensure file paths are correct in configuration

**Issue: Can't access admin interface**
- Verify you're logged in as an administrator
- Check the admin-accounts.json configuration
- Ensure you're accessing through SillyTavern

### Debug Mode

Enable debug logging by editing the configuration:

```yaml
logging:
  level: "debug"
  log_sillytavern_access: true
  log_blocked_attempts: true
```

### Getting Help

1. Check the logs in `sillytavern-data/logs/`
2. Review the troubleshooting guide
3. Check the test results with `node test-runner.js`
4. Verify your configuration against the examples

## Security Best Practices

1. **Change Default Credentials**: Always change the default admin password
2. **Use HTTPS**: Configure SillyTavern to use HTTPS in production
3. **Regular Updates**: Keep the permission system updated
4. **Monitor Logs**: Regularly check access logs for suspicious activity
5. **Backup Configuration**: Regularly backup your permission configurations

## Migration from Existing Setup

If you have existing lorebooks, use the migration script:

```bash
# Linux/macOS
./scripts/migrate-existing.sh

# Windows
.\scripts\migrate-existing.ps1
```

This will:
- Scan existing lorebooks
- Create permission entries based on file ownership
- Maintain existing access patterns

## Performance Considerations

- The permission system includes caching for improved performance
- Rate limiting prevents abuse
- Logging can be disabled in production for better performance
- Consider using Redis for distributed caching in multi-server setups

## Uninstallation

To remove the permission system:

1. Remove the integration code from SillyTavern's server.js
2. Delete the sillytavern-lorebook-permissions directory
3. Restart SillyTavern
4. Optionally backup the permission data first

## Support

For additional support:
- Check the documentation in the `docs/` directory
- Review the test suite for usage examples
- Check the configuration examples in `examples/`
- Enable debug logging for detailed error information