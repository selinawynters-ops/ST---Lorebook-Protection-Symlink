const fs = require('fs/promises');
const path = require('path');
const os = require('os');

let serverContext = null;

/**
 * Get the SillyTavern data root directory
 */
function getDataRoot() {
    // This will be provided by SillyTavern's plugin context
    return serverContext?.dataRoot || './data';
}

/**
 * Get extension settings from server context
 */
function getExtensionSettings() {
    if (!serverContext?.extensionSettings) {
        serverContext.extensionSettings = {};
    }
    if (!serverContext.extensionSettings['lorebook_acl']) {
        serverContext.extensionSettings['lorebook_acl'] = {};
    }
    return serverContext.extensionSettings;
}

/**
 * Save extension settings (mock for testing)
 */
function saveExtensionSettings() {
    // In real SillyTavern, this would persist settings
    console.log('Extension settings saved:', serverContext?.extensionSettings);
}

/**
 * Create a cross-platform symlink
 */
async function createSymlink(target, linkPath) {
    const isWindows = os.platform() === 'win32';
    
    try {
        // Check if link already exists
        try {
            const stats = await fs.lstat(linkPath);
            if (stats.isSymbolicLink()) {
                await fs.unlink(linkPath);
                console.log('Removed existing symlink:', linkPath);
            }
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }

        // Create the symlink
        if (isWindows) {
            // Use junction for Windows (doesn't require admin rights)
            const absoluteTarget = path.resolve(target);
            await fs.symlink(absoluteTarget, linkPath, 'junction');
        } else {
            // Standard symlink for Unix-like systems
            await fs.symlink(target, linkPath, 'file');
        }
        
        return true;
    } catch (err) {
        if (err.code === 'EPERM') {
            throw new Error('Permission denied. Windows requires admin rights or Developer Mode for symlinks.');
        }
        throw err;
    }
}

/**
 * Check if user has permission to access a lorebook
 */
function checkLorebookPermission(lorebookName, userHandle, isAdmin = false) {
    const settings = getExtensionSettings();
    const acl = settings['lorebook_acl'][lorebookName];
    
    if (!acl) {
        // No ACL defined, allow access
        return true;
    }
    
    // Admin always has access
    if (isAdmin) {
        return true;
    }
    
    // Creator has access
    if (acl.creator === userHandle) {
        return true;
    }
    
    // Check allowed users list
    return acl.allowedUsers && acl.allowedUsers.includes(userHandle);
}

/**
 * Initialize the plugin
 */
async function init(router, context) {
    serverContext = context;
    console.log('Lorebook ACL Plugin initialized');
    
    // Ensure shared worlds directory exists
    const sharedWorldsDir = path.join(getDataRoot(), 'shared', 'worlds');
    try {
        await fs.mkdir(sharedWorldsDir, { recursive: true });
        console.log('Created shared worlds directory:', sharedWorldsDir);
    } catch (err) {
        console.error('Failed to create shared worlds directory:', err);
    }
    
    // Create symlink endpoint
    router.post('/create-symlink', async (req, res) => {
        try {
            const { targetLorebook, linkName, targetUser } = req.body;
            const userHandle = req.user?.handle || 'default-user';
            const isAdmin = req.user?.isAdmin || false;
            
            console.log('Create symlink request:', { targetLorebook, linkName, targetUser, userHandle, isAdmin });
            
            // Validate inputs
            if (!targetLorebook || !linkName || !targetUser) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Check if requester is admin
            if (!isAdmin) {
                return res.status(403).json({ error: 'Only admins can create symlinks' });
            }
            
            const sharedLorebook = path.join(getDataRoot(), 'shared', 'worlds', targetLorebook);
            const targetUserWorldsDir = path.join(getDataRoot(), 'users', targetUser, 'worlds');
            const symlinkPath = path.join(targetUserWorldsDir, linkName);
            
            // Check if source lorebook exists
            try {
                await fs.access(sharedLorebook);
            } catch (err) {
                return res.status(404).json({ error: 'Source lorebook not found' });
            }
            
            // Ensure target user worlds directory exists
            await fs.mkdir(targetUserWorldsDir, { recursive: true });
            
            // Create the symlink
            await createSymlink(sharedLorebook, symlinkPath);
            
            // Register in ACL
            const settings = getExtensionSettings();
            settings['lorebook_acl'][linkName] = {
                creator: userHandle,
                createdAt: Date.now(),
                allowedUsers: [targetUser],
                isSymlink: true,
                originalPath: sharedLorebook,
                targetLorebook: targetLorebook
            };
            
            saveExtensionSettings();
            
            console.log('Symlink created successfully:', symlinkPath);
            res.json({ 
                success: true, 
                path: symlinkPath,
                message: `Symlink created for ${targetUser}` 
            });
            
        } catch (err) {
            console.error('Error creating symlink:', err);
            res.status(500).json({ error: err.message });
        }
    });
    
    // Check access endpoint
    router.post('/check-access', async (req, res) => {
        try {
            const { lorebookName } = req.body;
            const userHandle = req.user?.handle || 'default-user';
            const isAdmin = req.user?.isAdmin || false;
            
            console.log('Check access request:', { lorebookName, userHandle, isAdmin });
            
            const permitted = checkLorebookPermission(lorebookName, userHandle, isAdmin);
            const settings = getExtensionSettings();
            const acl = settings['lorebook_acl'][lorebookName];
            
            return res.json({ 
                permitted, 
                acl: acl || null,
                userHandle,
                isAdmin
            });
            
        } catch (err) {
            console.error('Error checking access:', err);
            return res.status(500).json({ error: err.message });
        }
    });
    
    // Grant access endpoint
    router.post('/grant-access', async (req, res) => {
        try {
            const { lorebookName, targetUser } = req.body;
            const userHandle = req.user?.handle || 'default-user';
            const isAdmin = req.user?.isAdmin || false;
            
            console.log('Grant access request:', { lorebookName, targetUser, userHandle, isAdmin });
            
            const settings = getExtensionSettings();
            const acl = settings['lorebook_acl'][lorebookName];
            
            if (!acl) {
                return res.status(404).json({ error: 'Lorebook not found in ACL' });
            }
            
            // Only admin or creator can grant access
            if (!isAdmin && acl.creator !== userHandle) {
                return res.status(403).json({ error: 'Permission denied' });
            }
            
            if (!acl.allowedUsers.includes(targetUser)) {
                acl.allowedUsers.push(targetUser);
                saveExtensionSettings();
            }
            
            return res.json({ success: true, acl });
            
        } catch (err) {
            console.error('Error granting access:', err);
            return res.status(500).json({ error: err.message });
        }
    });
    
    // List shared lorebooks endpoint
    router.get('/list-shared', async (req, res) => {
        try {
            const sharedWorldsDir = path.join(getDataRoot(), 'shared', 'worlds');
            
            try {
                const files = await fs.readdir(sharedWorldsDir);
                const lorebooks = files.filter(file => file.endsWith('.json'));
                return res.json({ lorebooks });
            } catch (err) {
                if (err.code === 'ENOENT') {
                    return res.json({ lorebooks: [] });
                } else {
                    throw err;
                }
            }
            
        } catch (err) {
            console.error('Error listing shared lorebooks:', err);
            return res.status(500).json({ error: err.message });
        }
    });
    
    // List ACL entries endpoint
    router.get('/list-acl', async (req, res) => {
        try {
            const userHandle = req.user?.handle || 'default-user';
            const isAdmin = req.user?.isAdmin || false;
            
            const settings = getExtensionSettings();
            const acl = settings['lorebook_acl'] || {};
            
            // Filter ACL based on permissions
            const filteredAcl = {};
            for (const [lorebookName, entry] of Object.entries(acl)) {
                if (isAdmin || entry.creator === userHandle || entry.allowedUsers.includes(userHandle)) {
                    filteredAcl[lorebookName] = entry;
                }
            }
            
            return res.json({ acl: filteredAcl });
            
        } catch (err) {
            console.error('Error listing ACL:', err);
            return res.status(500).json({ error: err.message });
        }
    });
}

/**
 * Plugin cleanup
 */
async function exit() {
    console.log('Lorebook ACL Plugin shutting down');
}

module.exports = {
    init,
    exit,
    info: {
        id: 'lorebook-acl',
        name: 'Lorebook Access Control',
        description: 'Symlink-based lorebook sharing with permission management'
    }
};
