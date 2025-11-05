/**
 * SillyTavern Lorebook Admin Extension
 * This extension provides secure permission management for character lorebooks
 * ensuring only creators/owners and administrators can access them
 */

// Extension metadata
const MODULE_NAME = 'lorebook-permission-system';
const VERSION = '1.0.0';

// Dynamic server name detection
let serverName = 'SillyTavern'; // Default fallback

// Global extension state
let extensionSettings = null;
let permissionData = {};
let isAdmin = false;
let currentUserId = null;

/**
 * Initialize the extension
 */
async function init() {
    // Detect server name dynamically
    serverName = detectServerName();
    console.log(`[ST-- Lorebook Protection Symlink] Initializing extension v${VERSION}`);
    
    try {
        // Get SillyTavern context
        const context = SillyTavern.getContext();
        
        // Initialize settings
        initializeSettings(context);
        
        // Check if user is administrator
        await checkAdminStatus(context);
        
        // Register event listeners
        registerEventListeners(context);
        
        // Register slash commands
        registerSlashCommands(context);
        
        // Add UI elements
        addUIElements(context);
        
        // Initialize permission data
        await initializePermissionData(context);
        
        console.log(`[ST-- Lorebook Protection Symlink] Extension initialized successfully`);
        
    } catch (error) {
        console.error(`[ST-- Lorebook Protection Symlink] Initialization failed:`, error);
    }
}

/**
 * Initialize extension settings
 */
function initializeSettings(context) {
    const { extensionSettings: settings, saveSettingsDebounced } = context;
    
    // Define default settings
    const defaultSettings = Object.freeze({
        enabled: true,
        enforcePermissions: true,
        logAccessAttempts: true,
        adminOverrideEnabled: true,
        defaultPermissions: 'owner-only',
        showPermissionWarnings: true,
        cachePermissions: true,
        cacheTimeout: 300 // 5 minutes
    });
    
    // Initialize settings if they don't exist
    if (!settings[MODULE_NAME]) {
        settings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    
    // Ensure all default keys exist
    for (const key of Object.keys(defaultSettings)) {
        if (!Object.hasOwn(settings[MODULE_NAME], key)) {
            settings[MODULE_NAME][key] = defaultSettings[key];
        }
    }
    
    extensionSettings = settings[MODULE_NAME];
    
    // Save settings
    saveSettingsDebounced();
    
    console.log('[ST-- Lorebook Protection Symlink] Settings initialized:', extensionSettings);
}

/**
 * Check if current user is administrator
 */
async function checkAdminStatus(context) {
    try {
        // Get current user information
        const user = getCurrentUser(context);
        currentUserId = user?.id || 'anonymous';
        
        // Check admin status (this would integrate with your server-side permission system)
        isAdmin = await verifyAdminStatus(currentUserId);
        
        console.log(`[ST-- Lorebook Protection Symlink] User ${currentUserId} admin status: ${isAdmin}`);
        
    } catch (error) {
        console.error('[ST-- Lorebook Protection Symlink] Admin check failed:', error);
        isAdmin = false;
    }
}

/**
 * Register event listeners
 */
function registerEventListeners(context) {
    const { eventSource, event_types } = context;
    
    // Listen for character changes
    eventSource.on(event_types.CHARACTER_CHANGED, handleCharacterChanged);
    
    // Listen for chat changes
    eventSource.on(event_types.CHAT_CHANGED, handleChatChanged);
    
    // Listen for lorebook access attempts
    eventSource.on(event_types.LOREBOOK_LOADED, handleLorebookAccess);
    
    // Listen for settings updates
    eventSource.on(event_types.SETTINGS_UPDATED, handleSettingsUpdated);
    
    console.log('[ST-- Lorebook Protection Symlink] Event listeners registered');
}

/**
 * Register slash commands
 */
function registerSlashCommands(context) {
    // Register permission management commands
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'lorebook-permissions',
        callback: handlePermissionCommand,
        aliases: ['lp'],
        returns: 'permission management result',
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'action',
                description: 'permission action (grant, revoke, check, list)',
                typeList: ARGUMENT_TYPE.STRING,
                isRequired: true,
                enumList: ['grant', 'revoke', 'check', 'list']
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'user',
                description: 'target user ID',
                typeList: ARGUMENT_TYPE.STRING,
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'character',
                description: 'character ID or name',
                typeList: ARGUMENT_TYPE.STRING,
            })
        ],
        helpString: `
            <div>
                Manage lorebook protection for ${serverName}.
            </div>
            <div>
                <strong>Examples:</strong>
                <ul>
                    <li><pre><code>/lorebook-permissions action=list</code></pre> Lists all permissions</li>
                    <li><pre><code>/lorebook-permissions action=check character="My Character"</code></pre> Check permissions for a character</li>
                    <li><pre><code>/lorebook-permissions action=grant user="username" character="My Character"</code></pre> Grant permission to user</li>
                </ul>
            </div>
        `,
    }));
    
    console.log('[ST-- Lorebook Protection Symlink] Slash commands registered');
}

/**
 * Add UI elements to SillyTavern
 */
function addUIElements(context) {
    // Add permission management button to character settings
    addPermissionManagementButton();
    
    // Add admin panel if user is admin
    if (isAdmin) {
        addAdminPanel();
    }
    
    // Add permission status indicator
    addPermissionStatusIndicator();
    
    console.log('[ST-- Lorebook Protection Symlink] UI elements added');
}

/**
 * Detect server name from various sources
 * Used for dynamic interface elements ONLY (not extension manager display name)
 */
function detectServerName() {
    try {
        console.log('[ST-- Lorebook Protection Symlink] Detecting server name for dynamic interface...');
        
        // Method 1: Check for SillyTavern directory name from index file/path (NEW PRIORITY)
        // This detects renamed SillyTavern directories like "ST--", "MyTavern", etc.
        const currentPath = window.location.pathname;
        const scriptElements = document.querySelectorAll('script[src]');
        
        for (let script of scriptElements) {
            const src = script.src;
            if (src && (src.includes('script.js') || src.includes('index.html'))) {
                // Extract directory name from path
                const pathMatch = src.match(/\/([^\/]+)\/(script\.js|index\.html)/);
                if (pathMatch && pathMatch[1]) {
                    const dirName = pathMatch[1];
                    // Clean up directory name and remove common suffixes
                    let cleanName = dirName.replace(/-(st|sillytavern|public)$/i, '');
                    
                    // If it's a custom directory name (not "SillyTavern" or common defaults)
                    if (cleanName && cleanName !== 'SillyTavern' && cleanName !== 'public' && cleanName.length > 0) {
                        console.log(`[ST-- Lorebook Protection Symlink] Detected directory name for interface: ${cleanName}`);
                        return cleanName;
                    }
                }
            }
        }

        // Method 2: Check window.location for directory name
        if (currentPath && currentPath !== '/') {
            const pathParts = currentPath.split('/').filter(part => part.length > 0);
            if (pathParts.length > 0) {
                const dirName = pathParts[0];
                const cleanName = dirName.replace(/-(st|sillytavern|public)$/i, '');
                
                if (cleanName && cleanName !== 'SillyTavern' && cleanName !== 'public') {
                    console.log(`[ST-- Lorebook Protection Symlink] Detected path directory for interface: ${cleanName}`);
                    return cleanName;
                }
            }
        }

        // Method 3: Check for custom configuration in window object
        if (window.SillyTavern && window.SillyTavern.serverName) {
            console.log(`[ST-- Lorebook Protection Symlink] Using window config for interface: ${window.SillyTavern.serverName}`);
            return window.SillyTavern.serverName;
        }

        // Method 4: Check document title (secondary priority)
        const title = document.title;
        if (title && title !== 'SillyTavern') {
            // Extract server name from title (e.g., "DreamTavern - SillyTavern" -> "DreamTavern")
            const titleParts = title.split(/[-–—]/);
            if (titleParts.length > 1) {
                const serverPart = titleParts[0].trim();
                if (serverPart && serverPart !== 'SillyTavern') {
                    console.log(`[ST-- Lorebook Protection Symlink] Using title for interface: ${serverPart}`);
                    return serverPart;
                }
            }
            // If no separator, use full title if it's not "SillyTavern"
            if (title !== 'SillyTavern') {
                console.log(`[ST-- Lorebook Protection Symlink] Using full title for interface: ${title}`);
                return title;
            }
        }

        // Method 5: Check meta tags or custom server configuration
        const serverMeta = document.querySelector('meta[name="server-name"]');
        if (serverMeta && serverMeta.content) {
            console.log(`[ST-- Lorebook Protection Symlink] Using meta tag for interface: ${serverMeta.content}`);
            return serverMeta.content;
        }

        // Method 6: Check for custom branding in the UI
        const serverBranding = document.querySelector('.server-name, .custom-server-name, .branding-text');
        if (serverBranding && serverBranding.textContent.trim()) {
            console.log(`[ST-- Lorebook Protection Symlink] Using UI branding for interface: ${serverBranding.textContent.trim()}`);
            return serverBranding.textContent.trim();
        }

        // Method 7: Check hostname for custom domains
        const hostname = window.location.hostname;
        if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
            // Convert domain to name (e.g., dreamtavern.com -> DreamTavern)
            const domainName = hostname.replace(/\.(com|org|net|io|ai)$/, '');
            const serverNameFromDomain = domainName
                .split('.')[0]
                .replace(/[^a-zA-Z0-9-]/g, '')
                .replace(/^[a-z]/, c => c.toUpperCase());
            
            if (serverNameFromDomain && serverNameFromDomain !== 'SillyTavern') {
                console.log(`[ST-- Lorebook Protection Symlink] Using domain for interface: ${serverNameFromDomain}`);
                return serverNameFromDomain;
            }
        }

        // Method 8: Check localStorage for custom server name
        const storedServerName = localStorage.getItem('server-name') || localStorage.getItem('custom-server-name');
        if (storedServerName && storedServerName.trim()) {
            console.log(`[ST-- Lorebook Protection Symlink] Using stored name for interface: ${storedServerName.trim()}`);
            return storedServerName.trim();
        }

    } catch (error) {
        console.warn('[ST-- Lorebook Protection Symlink] Failed to detect server name for interface, using default:', error);
    }

    // Fallback to SillyTavern for interface elements
    console.log('[ST-- Lorebook Protection Symlink] Using fallback name for interface: SillyTavern');
    return 'SillyTavern';
}

/**
 * Initialize permission data
 */
async function initializePermissionData(context) {
    try {
        // Load permission data from server or local storage
        permissionData = await loadPermissionData();
        
        console.log('[ST-- Lorebook Protection Symlink] Permission data loaded:', 
                   Object.keys(permissionData).length, 'entries');
        
    } catch (error) {
        console.error('[ST-- Lorebook Protection Symlink] Failed to load permission data:', error);
        permissionData = {};
    }
}

/**
 * Handle character change event
 */
function handleCharacterChanged(data) {
    console.log('[ST-- Lorebook Protection Symlink] Character changed:', data);
    
    // Check permissions for new character
    const characterId = data?.characterId;
    if (characterId) {
        checkCharacterPermissions(characterId);
    }
}

/**
 * Handle chat change event
 */
function handleChatChanged(data) {
    console.log('[ST-- Lorebook Protection Symlink] Chat changed:', data);
    
    // Reset permission state for new chat
    resetPermissionState();
}

/**
 * Handle lorebook access attempt
 */
function handleLorebookAccess(data) {
    if (!extensionSettings.enforcePermissions) {
        return;
    }
    
    console.log('[ST-- Lorebook Protection Symlink] Lorebook access attempt:', data);
    
    // Verify access permissions
    const hasAccess = verifyLorebookAccess(data);
    
    if (!hasAccess) {
        // Block access and show warning
        blockLorebookAccess(data);
        
        if (extensionSettings.showPermissionWarnings) {
            showPermissionWarning();
        }
    }
    
    // Log access attempt if enabled
    if (extensionSettings.logAccessAttempts) {
        logAccessAttempt(data, hasAccess);
    }
}

/**
 * Handle settings update event
 */
function handleSettingsUpdated(data) {
    console.log('[ST-- Lorebook Protection Symlink] Settings updated:', data);
    
    // Refresh settings
    const context = SillyTavern.getContext();
    initializeSettings(context);
}

/**
 * Handle permission slash commands
 */
function handlePermissionCommand(namedArgs, unnamedArgs) {
    const { action, user, character } = namedArgs;
    
    try {
        switch (action) {
            case 'list':
                return listPermissions();
            case 'check':
                return checkPermission(character);
            case 'grant':
                return grantPermission(user, character);
            case 'revoke':
                return revokePermission(user, character);
            default:
                return `Unknown action: ${action}`;
        }
    } catch (error) {
        console.error('[ST-- Lorebook Protection Symlink] Command error:', error);
        return `Error: ${error.message}`;
    }
}

/**
 * Verify if user has access to lorebook
 */
function verifyLorebookAccess(data) {
    const { characterId, userId } = data;
    
    // Always allow admin access if enabled
    if (isAdmin && extensionSettings.adminOverrideEnabled) {
        return true;
    }
    
    // Check if user is the creator/owner
    if (isCharacterOwner(characterId, userId || currentUserId)) {
        return true;
    }
    
    // Check explicit permission
    return hasExplicitPermission(characterId, userId || currentUserId);
}

/**
 * Block lorebook access
 */
function blockLorebookAccess(data) {
    console.warn('[ST-- Lorebook Protection Symlink] Access blocked:', data);
    
    // Hide lorebook content
    hideLorebookContent();
    
    // Show access denied message
    showAccessDeniedMessage();
}

/**
 * Check if user is character owner
 */
function isCharacterOwner(characterId, userId) {
    const character = getCharacterById(characterId);
    return character?.data?.creator === userId || 
           character?.data?.extensions?.[MODULE_NAME]?.owner === userId;
}

/**
 * Check if user has explicit permission
 */
function hasExplicitPermission(characterId, userId) {
    const permissions = permissionData[characterId] || {};
    return permissions.allowedUsers?.includes(userId) || 
           permissions.permissions?.[userId] === 'read';
}

/**
 * List all permissions
 */
function listPermissions() {
    if (!isAdmin) {
        return 'Administrator access required';
    }
    
    let result = 'Lorebook Permissions:\n\n';
    
    for (const [characterId, permissions] of Object.entries(permissionData)) {
        const character = getCharacterById(characterId);
        const characterName = character?.name || characterId;
        
        result += `📖 ${characterName} (${characterId})\n`;
        result += `  Owner: ${permissions.owner || 'Unknown'}\n`;
        result += `  Allowed Users: ${permissions.allowedUsers?.join(', ') || 'None'}\n\n`;
    }
    
    return result || 'No permissions configured';
}

/**
 * Check permission for character
 */
function checkPermission(characterId) {
    const character = getCharacterByNameOrId(characterId);
    if (!character) {
        return `Character not found: ${characterId}`;
    }
    
    const actualId = character.data.extensions?.character_id || characterId;
    const hasAccess = verifyLorebookAccess({ characterId: actualId, userId: currentUserId });
    
    return `Access to ${character.name}: ${hasAccess ? '✅ Allowed' : '❌ Denied'}`;
}

/**
 * Grant permission to user
 */
function grantPermission(userId, characterId) {
    if (!isAdmin) {
        return 'Administrator access required';
    }
    
    const character = getCharacterByNameOrId(characterId);
    if (!character) {
        return `Character not found: ${characterId}`;
    }
    
    const actualId = character.data.extensions?.character_id || characterId;
    
    if (!permissionData[actualId]) {
        permissionData[actualId] = { allowedUsers: [], owner: currentUserId };
    }
    
    if (!permissionData[actualId].allowedUsers.includes(userId)) {
        permissionData[actualId].allowedUsers.push(userId);
        savePermissionData();
        return `✅ Permission granted to ${userId} for ${character.name}`;
    }
    
    return `User ${userId} already has permission for ${character.name}`;
}

/**
 * Revoke permission from user
 */
function revokePermission(userId, characterId) {
    if (!isAdmin) {
        return 'Administrator access required';
    }
    
    const character = getCharacterByNameOrId(characterId);
    if (!character) {
        return `Character not found: ${characterId}`;
    }
    
    const actualId = character.data.extensions?.character_id || characterId;
    
    if (permissionData[actualId]?.allowedUsers?.includes(userId)) {
        permissionData[actualId].allowedUsers = permissionData[actualId].allowedUsers.filter(u => u !== userId);
        savePermissionData();
        return `✅ Permission revoked from ${userId} for ${character.name}`;
    }
    
    return `User ${userId} does not have permission for ${character.name}`;
}

/**
 * Helper functions
 */
function getCurrentUser(context) {
    // This would get the current user from SillyTavern's authentication system
    // For now, return a mock user
    return { id: 'current-user', name: 'Current User' };
}

async function verifyAdminStatus(userId) {
    // This would check against your server's admin database
    // For now, check if user is in local admin list
    const adminUsers = extensionSettings?.adminUsers || ['admin'];
    return adminUsers.includes(userId);
}

function getCharacterById(characterId) {
    const context = SillyTavern.getContext();
    return context.characters?.[characterId] || 
           context.characters?.find(c => c.data?.extensions?.character_id === characterId);
}

function getCharacterByNameOrId(nameOrId) {
    const context = SillyTavern.getContext();
    return context.characters?.find(c => 
        c.name === nameOrId || 
        c.data?.extensions?.character_id === nameOrId ||
        String(c.data?.extensions?.character_id) === String(nameOrId)
    );
}

function addPermissionManagementButton() {
    // Add button to character settings panel
    const settingsButton = $('<button id="lorebook-permissions-btn" class="menu_button">')
        .text(`🔐 ${serverName} Lorebook Admin`)
        .on('click', showPermissionManagementDialog);
    
    $('#character-settings-panel').append(settingsButton);
}

function addAdminPanel() {
    // Add admin panel to settings menu
    const adminButton = $('<button id="lorebook-admin-btn" class="menu_button">')
        .text(`⚙️ ${serverName} Protection Admin`)
        .on('click', showAdminPanel);
    
    $('#settings-menu').append(adminButton);
}

function addPermissionStatusIndicator() {
    // Add status indicator to lorebook section
    const statusDiv = $('<div id="permission-status" class="permission-status">')
        .html('🔒 <span class="status-text">Secured</span>');
    
    $('#right-nav-panel').prepend(statusDiv);
}

function hideLorebookContent() {
    $('#world_info').hide();
    $('.character-world-info').hide();
}

function showAccessDeniedMessage() {
    const message = $('<div class="access-denied-message">')
        .html('🚫 <strong>Access Denied</strong><br>You do not have permission to view this lorebook.');
    
    $('#world_info').parent().append(message);
}

function showPermissionWarning() {
    toastr.warning('You do not have permission to access this lorebook.', 'Access Denied');
}

function showPermissionManagementDialog() {
    // Show modal with permission management interface
    const modal = $('<div class="permission-management-modal">')
        .html(`
            <h3>🔐 ${serverName} Lorebook Admin</h3>
            <div class="permission-form">
                <label>Character: <select id="permission-character-select"></select></label>
                <label>User ID: <input type="text" id="permission-user-input"></label>
                <button id="grant-permission-btn">Grant Access</button>
                <button id="revoke-permission-btn">Revoke Access</button>
            </div>
            <div class="permission-list"></div>
        `);
    
    $('body').append(modal);
    
    // Populate character select
    populateCharacterSelect();
    
    // Bind events
    $('#grant-permission-btn').on('click', grantPermissionFromDialog);
    $('#revoke-permission-btn').on('click', revokePermissionFromDialog);
}

function showAdminPanel() {
    // Show comprehensive admin panel
    console.log('[ST-- Lorebook Protection Symlink] Admin panel requested');
}

function populateCharacterSelect() {
    const context = SillyTavern.getContext();
    const select = $('#permission-character-select');
    
    context.characters?.forEach(character => {
        const option = $('<option>')
            .val(character.data?.extensions?.character_id || character.name)
            .text(character.name);
        select.append(option);
    });
}

function grantPermissionFromDialog() {
    const characterId = $('#permission-character-select').val();
    const userId = $('#permission-user-input').val();
    
    const result = grantPermission(userId, characterId);
    toastr.info(result);
}

function revokePermissionFromDialog() {
    const characterId = $('#permission-character-select').val();
    const userId = $('#permission-user-input').val();
    
    const result = revokePermission(userId, characterId);
    toastr.info(result);
}

async function loadPermissionData() {
    // Load from server API or local storage
    const context = SillyTavern.getContext();
    
    try {
        // Try to load from server first
        const response = await fetch('/api/lorebooks/permissions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.permissions || {};
        }
    } catch (error) {
        console.warn('[ST-- Lorebook Protection Symlink] Server load failed, using cache:', error);
    }
    
    // Fallback to local storage
    const cached = localStorage.getItem(`${MODULE_NAME}_permissions`);
    return cached ? JSON.parse(cached) : {};
}

async function savePermissionData() {
    // Save to server and local storage
    try {
        const response = await fetch('/api/lorebooks/permissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                permissions: permissionData
            })
        });
        
        if (!response.ok) {
            console.warn('[ST-- Lorebook Protection Symlink] Server save failed');
        }
    } catch (error) {
        console.warn('[ST-- Lorebook Protection Symlink] Server save error:', error);
    }
    
    // Always save to local storage as backup
    localStorage.setItem(`${MODULE_NAME}_permissions`, JSON.stringify(permissionData));
}

function logAccessAttempt(data, hasAccess) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        userId: data.userId || currentUserId,
        characterId: data.characterId,
        hasAccess: hasAccess,
        userAgent: navigator.userAgent
    };
    
    console.log('[ST-- Lorebook Protection Symlink] Access attempt:', logEntry);
    
    // Store logs locally (in production, send to server)
    const logs = JSON.parse(localStorage.getItem(`${MODULE_NAME}_access_logs`) || '[]');
    logs.push(logEntry);
    
    // Keep only last 1000 entries
    if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
    }
    
    localStorage.setItem(`${MODULE_NAME}_access_logs`, JSON.stringify(logs));
}

function checkCharacterPermissions(characterId) {
    // Update UI based on current permissions
    const hasAccess = verifyLorebookAccess({ characterId, userId: currentUserId });
    
    const statusText = hasAccess ? '✅ Accessible' : '🔒 Restricted';
    $('#permission-status .status-text').text(statusText);
    
    if (extensionSettings.showPermissionWarnings && !hasAccess) {
        showPermissionWarning();
    }
    
    // Update extension display name in extension manager
    updateExtensionDisplayName();
}

/**
 * Update the extension display name in the extension manager
 */
function updateExtensionDisplayName() {
    // NOTE: Extension manager display name remains fixed as "ST-- Lorebook Protection Symlink"
    // Only interface elements should be dynamic based on server detection
    console.log(`[ST-- Lorebook Protection Symlink] Extension manager name remains fixed`);
}

function resetPermissionState() {
    // Reset permission state when switching chats
    console.log('[ST-- Lorebook Protection Symlink] Permission state reset');
}

// Initialize extension when SillyTavern is ready
$(document).ready(function() {
    // Wait for SillyTavern to be fully loaded
    const { eventSource, event_types } = SillyTavern.getContext();
    
    // Detect server name before initialization
    serverName = detectServerName();
    
    if (eventSource) {
        eventSource.on(event_types.APP_READY, init);
    } else {
        // Fallback: initialize after a short delay
        setTimeout(init, 1000);
    }
});

// Make extension functions globally available for debugging
globalThis.LorebookPermissionSystem = {
    checkPermission,
    grantPermission,
    revokePermission,
    listPermissions,
    verifyLorebookAccess,
    permissionData: () => permissionData
};

console.log('[ST-- Lorebook Protection Symlink] Extension script loaded');