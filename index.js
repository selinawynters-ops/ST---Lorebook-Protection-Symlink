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
    console.log('[ST-- Lorebook Protection Symlink] Adding UI elements...');
    
    // Add main toolbar icon (primary interface integration)
    addMainToolbarIcon();
    
    // Add floating icon (always visible)
    addFloatingIcon();
    
    // Add sidebar icon for better integration
    addSidebarIcon();
    
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

function addMainToolbarIcon() {
    console.log('[ST-- Lorebook Protection Symlink] Adding main toolbar icon...');
    
    // Create main toolbar icon with vanilla JavaScript
    const toolbarIcon = document.createElement('div');
    toolbarIcon.id = 'lorebook-protection-toolbar-icon';
    toolbarIcon.className = 'toolbar-icon fa-solid fa-shield-halved';
    toolbarIcon.title = `${serverName} Lorebook Admin`;
    toolbarIcon.innerHTML = '🔐';
    toolbarIcon.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin: 0 4px;
        cursor: pointer;
        border-radius: 4px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 16px;
        transition: all 0.2s ease;
        position: relative;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.2);
    `;
    
    toolbarIcon.addEventListener('click', showPermissionManagementDialog);
    
    toolbarIcon.addEventListener('mouseenter', () => {
        toolbarIcon.style.transform = 'translateY(-2px)';
        toolbarIcon.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
    
    toolbarIcon.addEventListener('mouseleave', () => {
        toolbarIcon.style.transform = 'translateY(0)';
        toolbarIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    // Try to find main toolbar to add icon
    const possibleSelectors = [
        '#extensionsMenu',
        '.extensions-menu',
        '#extensions-menu',
        '.extensions-menu-area',
        '#main-menu',
        '.main-menu',
        '#top-menu',
        '.top-menu',
        '#toolbar',
        '.toolbar',
        '#main-toolbar',
        '.main-toolbar',
        '#header-buttons',
        '.header-buttons',
        '#top-bar-right',
        '.top-bar-right',
        '#menuBar',
        '.menuBar',
        '#menu-bar',
        '.menu-bar'
    ];
    
    let iconAdded = false;
    
    // Try to find and add icon immediately
    for (const selector of possibleSelectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            // Check if icon already exists
            if (!document.getElementById('lorebook-protection-toolbar-icon')) {
                // Add as last child to appear at the end
                toolbar.appendChild(toolbarIcon);
                console.log(`[ST-- Lorebook Protection Symlink] Main toolbar icon added to ${selector}`);
                iconAdded = true;
                break;
            }
        }
    }
    
    // If not added immediately, use observer to wait for elements
    if (!iconAdded) {
        const observer = new MutationObserver((mutations, obs) => {
            for (const selector of possibleSelectors) {
                const toolbar = document.querySelector(selector);
                if (toolbar && !document.getElementById('lorebook-protection-toolbar-icon')) {
                    toolbar.appendChild(toolbarIcon);
                    console.log(`[ST-- Lorebook Protection Symlink] Main toolbar icon added via observer to ${selector}`);
                    obs.disconnect();
                    iconAdded = true;
                    break;
                }
            }
            
            // Disconnect after 10 seconds if nothing found
            setTimeout(() => {
                if (!iconAdded) {
                    console.warn('[ST-- Lorebook Protection Symlink] Could not find main toolbar, trying alternative locations...');
                    addAlternativeToolbarIcon();
                }
                obs.disconnect();
            }, 10000);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

function addAlternativeToolbarIcon() {
    console.log('[ST-- Lorebook Protection Symlink] Adding alternative toolbar icon...');
    
    // Try alternative locations in the header area
    const alternativeSelectors = [
        '#header',
        '.header',
        'header',
        '#top-header',
        '.top-header',
        '#main-header',
        '.main-header',
        '#app-header',
        '.app-header'
    ];
    
    const toolbarIcon = document.createElement('div');
    toolbarIcon.id = 'lorebook-protection-toolbar-icon';
    toolbarIcon.className = 'toolbar-icon';
    toolbarIcon.title = `${serverName} Lorebook Admin`;
    toolbarIcon.innerHTML = '🔐';
    toolbarIcon.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin: 0 8px;
        cursor: pointer;
        border-radius: 4px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 16px;
        transition: all 0.2s ease;
        position: relative;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        z-index: 1000;
    `;
    
    toolbarIcon.addEventListener('click', showPermissionManagementDialog);
    
    toolbarIcon.addEventListener('mouseenter', () => {
        toolbarIcon.style.transform = 'translateY(-2px)';
        toolbarIcon.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
    
    toolbarIcon.addEventListener('mouseleave', () => {
        toolbarIcon.style.transform = 'translateY(0)';
        toolbarIcon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    for (const selector of alternativeSelectors) {
        const header = document.querySelector(selector);
        if (header && !document.getElementById('lorebook-protection-toolbar-icon')) {
            // Position in top-right of header
            toolbarIcon.style.position = 'absolute';
            toolbarIcon.style.top = '10px';
            toolbarIcon.style.right = '10px';
            header.appendChild(toolbarIcon);
            console.log(`[ST-- Lorebook Protection Symlink] Alternative toolbar icon added to ${selector}`);
            return;
        }
    }
    
    // Last resort: add to body as fixed positioned icon
    toolbarIcon.style.position = 'fixed';
    toolbarIcon.style.top = '10px';
    toolbarIcon.style.left = '50%';
    toolbarIcon.style.transform = 'translateX(-50%)';
    document.body.appendChild(toolbarIcon);
    console.log('[ST-- Lorebook Protection Symlink] Toolbar icon added to body as fallback');
}

function addFloatingIcon() {
    console.log('[ST-- Lorebook Protection Symlink] Adding floating icon...');
    
    // Create floating icon with vanilla JavaScript
    const floatingIcon = document.createElement('div');
    floatingIcon.id = 'lorebook-protection-floating-icon';
    floatingIcon.className = 'lorebook-protection-floating-icon';
    floatingIcon.innerHTML = '🔐';
    floatingIcon.title = `${serverName} Lorebook Admin`;
    floatingIcon.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        border: 2px solid rgba(255,255,255,0.2);
    `;
    
    floatingIcon.addEventListener('click', showPermissionManagementDialog);
    
    floatingIcon.addEventListener('mouseenter', () => {
        floatingIcon.style.transform = 'scale(1.1)';
        floatingIcon.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
    });
    
    floatingIcon.addEventListener('mouseleave', () => {
        floatingIcon.style.transform = 'scale(1)';
        floatingIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });
    
    // Add to body immediately
    document.body.appendChild(floatingIcon);
    console.log('[ST-- Lorebook Protection Symlink] Floating icon added to page');
    
    // Create tooltip that appears on hover
    const tooltip = document.createElement('div');
    tooltip.id = 'lorebook-protection-tooltip';
    tooltip.textContent = `${serverName} Lorebook Admin`;
    tooltip.style.cssText = `
        position: fixed;
        top: 20px;
        right: 80px;
        background: #2c3e50;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(tooltip);
    
    // Show/hide tooltip on hover
    floatingIcon.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
    });
    
    floatingIcon.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
    });
}

function addSidebarIcon() {
    console.log('[ST-- Lorebook Protection Symlink] Adding sidebar icon...');
    
    // Create sidebar icon with vanilla JavaScript
    const sidebarIcon = document.createElement('div');
    sidebarIcon.id = 'lorebook-protection-sidebar-icon';
    sidebarIcon.className = 'lorebook-protection-sidebar-icon';
    sidebarIcon.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px;">
            <span style="font-size: 18px;">🔐</span>
            <span style="font-size: 12px; font-weight: 500;">Lorebook Admin</span>
        </div>
    `;
    sidebarIcon.title = `${serverName} Lorebook Admin`;
    sidebarIcon.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 6px;
        margin: 5px 10px;
        position: relative;
        overflow: hidden;
    `;
    
    sidebarIcon.addEventListener('click', showPermissionManagementDialog);
    
    sidebarIcon.addEventListener('mouseenter', () => {
        sidebarIcon.style.transform = 'translateX(-5px)';
        sidebarIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    });
    
    sidebarIcon.addEventListener('mouseleave', () => {
        sidebarIcon.style.transform = 'translateX(0)';
        sidebarIcon.style.boxShadow = 'none';
    });
    
    // Try to find sidebar to add icon
    const possibleSelectors = [
        '#right-nav-panel',
        '.right-nav-panel', 
        '#right-panel',
        '.right-panel',
        '#sidebar',
        '.sidebar',
        '.nav-panel',
        '#character-nav',
        '.character-nav',
        '#main-nav',
        '.main-nav'
    ];
    
    let iconAdded = false;
    
    // Try to find and add icon immediately
    for (const selector of possibleSelectors) {
        const panel = document.querySelector(selector);
        if (panel) {
            // Check if icon already exists
            if (!document.getElementById('lorebook-protection-sidebar-icon')) {
                panel.appendChild(sidebarIcon);
                console.log(`[ST-- Lorebook Protection Symlink] Sidebar icon added to ${selector}`);
                iconAdded = true;
                break;
            }
        }
    }
    
    // If not added immediately, use observer to wait for elements
    if (!iconAdded) {
        const observer = new MutationObserver((mutations, obs) => {
            for (const selector of possibleSelectors) {
                const panel = document.querySelector(selector);
                if (panel && !document.getElementById('lorebook-protection-sidebar-icon')) {
                    panel.appendChild(sidebarIcon);
                    console.log(`[ST-- Lorebook Protection Symlink] Sidebar icon added via observer to ${selector}`);
                    obs.disconnect();
                    iconAdded = true;
                    break;
                }
            }
            
            // Disconnect after 10 seconds if nothing found
            setTimeout(() => {
                if (!iconAdded) {
                    console.warn('[ST-- Lorebook Protection Symlink] Could not find sidebar for icon, using floating icon only');
                }
                obs.disconnect();
            }, 10000);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

function addPermissionManagementButton() {
    console.log('[ST-- Lorebook Protection Symlink] Adding permission management button...');
    
    // Create button with vanilla JavaScript
    const settingsButton = document.createElement('button');
    settingsButton.id = 'lorebook-permissions-btn';
    settingsButton.className = 'menu_button lorebook-protection-symlink-button';
    settingsButton.textContent = `🔐 ${serverName} Lorebook Admin`;
    settingsButton.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        margin: 10px 0;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: inline-block;
    `;
    
    settingsButton.addEventListener('click', showPermissionManagementDialog);
    
    settingsButton.addEventListener('mouseenter', () => {
        settingsButton.style.transform = 'translateY(-2px)';
        settingsButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
    
    settingsButton.addEventListener('mouseleave', () => {
        settingsButton.style.transform = 'translateY(0px)';
        settingsButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    // Try multiple selectors to find the character settings panel
    const possibleSelectors = [
        '#character-settings-panel',
        '.character-settings',
        '[data-testid="character-settings"]',
        '.settings-panel',
        '.panel',
        '.settings',
        '#rm_char_settings',
        '.character-settings-panel',
        '.char-settings'
    ];
    
    let buttonAdded = false;
    
    // Try to find and add button immediately
    for (const selector of possibleSelectors) {
        const panel = document.querySelector(selector);
        if (panel) {
            // Check if button already exists
            if (!document.getElementById('lorebook-permissions-btn')) {
                panel.appendChild(settingsButton);
                console.log(`[ST-- Lorebook Protection Symlink] Button added to ${selector}`);
                buttonAdded = true;
                break;
            }
        }
    }
    
    // If not added immediately, use observer to wait for elements
    if (!buttonAdded) {
        const observer = new MutationObserver((mutations, obs) => {
            for (const selector of possibleSelectors) {
                const panel = document.querySelector(selector);
                if (panel && !document.getElementById('lorebook-permissions-btn')) {
                    panel.appendChild(settingsButton);
                    console.log(`[ST-- Lorebook Protection Symlink] Button added via observer to ${selector}`);
                    obs.disconnect();
                    buttonAdded = true;
                    break;
                }
            }
            
            // Disconnect after 10 seconds if nothing found
            setTimeout(() => {
                if (!buttonAdded) {
                    console.warn('[ST-- Lorebook Protection Symlink] Could not find character settings panel, adding button to body as fallback');
                    document.body.appendChild(settingsButton);
                    settingsButton.style.position = 'fixed';
                    settingsButton.style.top = '10px';
                    settingsButton.style.right = '10px';
                    settingsButton.style.zIndex = '9999';
                }
                obs.disconnect();
            }, 10000);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

function addAdminPanel() {
    console.log('[ST-- Lorebook Protection Symlink] Adding admin panel button...');
    
    // Create admin button with vanilla JavaScript
    const adminButton = document.createElement('button');
    adminButton.id = 'lorebook-admin-btn';
    adminButton.className = 'menu_button lorebook-admin-button';
    adminButton.textContent = `⚙️ ${serverName} Protection Admin`;
    adminButton.style.cssText = `
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        margin: 10px 0;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: inline-block;
    `;
    
    adminButton.addEventListener('click', showAdminPanel);
    
    // Try multiple selectors to find settings menu
    const possibleSelectors = [
        '#settings-menu',
        '.settings-menu',
        '#settings',
        '.settings',
        '#rm_settings_panel',
        '.settings-panel',
        '#settings-menu-list',
        '.menu'
    ];
    
    for (const selector of possibleSelectors) {
        const menu = document.querySelector(selector);
        if (menu) {
            menu.appendChild(adminButton);
            console.log(`[ST-- Lorebook Protection Symlink] Admin button added to ${selector}`);
            return;
        }
    }
    
    console.warn('[ST-- Lorebook Protection Symlink] Could not find settings menu for admin button');
}

function addPermissionStatusIndicator() {
    console.log('[ST-- Lorebook Protection Symlink] Adding permission status indicator...');
    
    // Create status indicator with vanilla JavaScript
    const statusDiv = document.createElement('div');
    statusDiv.id = 'permission-status';
    statusDiv.className = 'permission-status';
    statusDiv.innerHTML = '🔒 <span class="status-text">Secured</span>';
    statusDiv.style.cssText = `
        background: #27ae60;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        margin: 5px 0;
        display: inline-block;
        font-weight: bold;
    `;
    
    // Try multiple selectors to find right nav panel
    const possibleSelectors = [
        '#right-nav-panel',
        '.right-nav-panel',
        '#right-panel',
        '.right-panel',
        '#sidebar',
        '.sidebar',
        '.nav-panel'
    ];
    
    for (const selector of possibleSelectors) {
        const panel = document.querySelector(selector);
        if (panel) {
            panel.prepend(statusDiv);
            console.log(`[ST-- Lorebook Protection Symlink] Status indicator added to ${selector}`);
            return;
        }
    }
    
    console.warn('[ST-- Lorebook Protection Symlink] Could not find right nav panel for status indicator');
}

function hideLorebookContent() {
    // Hide world info elements with vanilla JavaScript
    const worldInfoElements = document.querySelectorAll('#world_info, .character-world-info');
    worldInfoElements.forEach(element => {
        element.style.display = 'none';
    });
}

function showAccessDeniedMessage() {
    console.log('[ST-- Lorebook Protection Symlink] Showing access denied message');
    
    // Create message with vanilla JavaScript
    const message = document.createElement('div');
    message.className = 'access-denied-message';
    message.innerHTML = '🚫 <strong>Access Denied</strong><br>You do not have permission to view this lorebook.';
    message.style.cssText = `
        background: #e74c3c;
        color: white;
        padding: 15px;
        border-radius: 6px;
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
        border: 2px solid #c0392b;
    `;
    
    // Try to find world info parent
    const worldInfo = document.querySelector('#world_info, .character-world-info');
    if (worldInfo && worldInfo.parentElement) {
        worldInfo.parentElement.appendChild(message);
    } else {
        // Fallback: add to body
        document.body.appendChild(message);
        message.style.position = 'fixed';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.zIndex = '10000';
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.parentElement.removeChild(message);
            }
        }, 5000);
    }
}

function showPermissionWarning() {
    toastr.warning('You do not have permission to access this lorebook.', 'Access Denied');
}

function showPermissionManagementDialog() {
    console.log('[ST-- Lorebook Protection Symlink] Showing permission management dialog');
    
    // Create modal with vanilla JavaScript
    const modal = document.createElement('div');
    modal.className = 'permission-management-modal';
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            border-radius: 12px;
            padding: 25px;
            max-width: 500px;
            margin: 50px auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            position: relative;
            z-index: 10000;
        ">
            <h3 style="
                color: #2c3e50;
                margin-bottom: 20px;
                font-size: 1.5em;
            ">🔐 ${serverName} Lorebook Admin</h3>
            <div class="permission-form" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                    Character: 
                    <select id="permission-character-select" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        margin-top: 5px;
                        font-size: 14px;
                    "></select>
                </label>
                <label style="display: block; margin-bottom: 15px; font-weight: bold;">
                    User ID: 
                    <input type="text" id="permission-user-input" placeholder="Enter user ID..." style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        margin-top: 5px;
                        font-size: 14px;
                    ">
                </label>
                <button id="grant-permission-btn" style="
                    background: #27ae60;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-right: 10px;
                    font-size: 14px;
                ">Grant Access</button>
                <button id="revoke-permission-btn" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-right: 10px;
                    font-size: 14px;
                ">Revoke Access</button>
                <button id="close-modal-btn" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Close</button>
            </div>
            <div class="permission-list" id="current-permissions" style="
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                min-height: 100px;
                font-size: 14px;
                border: 1px solid #dee2e6;
            ">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Current Permissions</h4>
                <div id="permissions-content">Loading...</div>
            </div>
        </div>
    `;
    
    // Add backdrop
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(modal);
    
    // Event handlers
    document.getElementById('grant-permission-btn').addEventListener('click', grantPermissionFromDialog);
    document.getElementById('revoke-permission-btn').addEventListener('click', revokePermissionFromDialog);
    document.getElementById('close-modal-btn').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Populate character select
    populateCharacterSelect();
    updatePermissionList();
}

function showAdminPanel() {
    // Show comprehensive admin panel
    console.log('[ST-- Lorebook Protection Symlink] Admin panel requested');
}

function populateCharacterSelect() {
    console.log('[ST-- Lorebook Protection Symlink] Populating character select...');
    
    try {
        const context = SillyTavern.getContext();
        const select = document.getElementById('permission-character-select');
        
        if (!select) {
            console.error('[ST-- Lorebook Protection Symlink] Character select not found');
            return;
        }
        
        // Clear existing options except the first one
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add character options
        if (context && context.characters) {
            context.characters.forEach(character => {
                const option = document.createElement('option');
                option.value = character.data?.extensions?.character_id || character.name || '';
                option.textContent = character.name || 'Unknown Character';
                select.appendChild(option);
            });
            console.log(`[ST-- Lorebook Protection Symlink] Added ${context.characters.length} characters to select`);
        } else {
            console.warn('[ST-- Lorebook Protection Symlink] No characters found in context');
        }
    } catch (error) {
        console.error('[ST-- Lorebook Protection Symlink] Error populating character select:', error);
    }
}

function grantPermissionFromDialog() {
    console.log('[ST-- Lorebook Protection Symlink] Granting permission from dialog...');
    
    const characterSelect = document.getElementById('permission-character-select');
    const userInput = document.getElementById('permission-user-input');
    
    const characterId = characterSelect ? characterSelect.value : '';
    const userId = userInput ? userInput.value : '';
    
    if (characterId && userId) {
        const result = grantPermission(userId, characterId);
        updatePermissionList();
        
        // Clear user input
        if (userInput) {
            userInput.value = '';
        }
        
        // Show result (simple alert for now, since toastr may not be available)
        if (typeof result === 'string') {
            alert(result);
        }
    } else {
        alert('Please select a character and enter a user ID');
    }
}

function revokePermissionFromDialog() {
    console.log('[ST-- Lorebook Protection Symlink] Revoking permission from dialog...');
    
    const characterSelect = document.getElementById('permission-character-select');
    const userInput = document.getElementById('permission-user-input');
    
    const characterId = characterSelect ? characterSelect.value : '';
    const userId = userInput ? userInput.value : '';
    
    if (characterId && userId) {
        const result = revokePermission(userId, characterId);
        updatePermissionList();
        
        // Show result (simple alert for now, since toastr may not be available)
        if (typeof result === 'string') {
            alert(result);
        }
    } else {
        alert('Please select a character and enter a user ID');
    }
}

function updatePermissionList() {
    console.log('[ST-- Lorebook Protection Symlink] Updating permission list...');
    
    try {
        const permissionsDiv = document.getElementById('permissions-content');
        if (!permissionsDiv) {
            console.warn('[ST-- Lorebook Protection Symlink] Permissions content div not found');
            return;
        }
        
        const permissionData = loadPermissionData();
        let html = '';
        
        if (permissionData && Object.keys(permissionData).length > 0) {
            for (const [characterId, permissions] of Object.entries(permissionData)) {
                html += `
                    <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px;">
                        <strong>${characterId}</strong><br>
                        <small>Owner: ${permissions.owner || 'Unknown'}</small><br>
                        <small>Allowed: ${permissions.allowedUsers?.join(', ') || 'None'}</small>
                    </div>
                `;
            }
        } else {
            html = '<div style="color: #666; font-style: italic;">No permissions set yet.</div>';
        }
        
        permissionsDiv.innerHTML = html;
    } catch (error) {
        console.error('[ST-- Lorebook Protection Symlink] Error updating permission list:', error);
    }
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
    const statusTextElement = document.querySelector('#permission-status .status-text');
    if (statusTextElement) {
        statusTextElement.textContent = statusText;
    }
    
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
document.addEventListener('DOMContentLoaded', function() {
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