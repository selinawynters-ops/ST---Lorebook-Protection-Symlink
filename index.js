import { getContext, renderExtensionTemplateAsync, extension_settings as st_extension_settings } from '../../../extensions.js';
import { eventSource, event_types, substituteParams, chat, saveSettingsDebounced, chat_metadata, saveChatDebounced, characters, this_chid } from '../../../../script.js';
import { selected_group, getGroupMembers } from '../../../group-chats.js';
import { power_user } from '../../../power-user.js';

// Extension configuration
const extensionName = 'sillytavern-lorebook-protection';
const extensionFolderPath = `extensions/${extensionName}`;

// State management
let extensionSettings = {
    enabled: true,
    panelPosition: 'right',
    permissions: {},
    accessLogs: [],
    securityLevel: 'medium',
    autoCleanup: true,
    notificationEnabled: true
};

let serverName = 'SillyTavern';
let $panelContainer = null;

/**
 * Initialize the extension
 */
async function initExtension() {
    console.log(`[${extensionName}] Initializing Lorebook Protection Extension...`);
    
    try {
        // Load settings
        loadSettings();
        
        // Detect server name
        serverName = detectServerName();
        console.log(`[${extensionName}] Detected server: ${serverName}`);
        
        // Add extension settings to Extensions tab
        addExtensionSettings();
        
        // Initialize UI
        await initUI();
        
        // Register event listeners
        registerEventListeners();
        
        console.log(`[${extensionName}] Extension initialized successfully`);
    } catch (error) {
        console.error(`[${extensionName}] Initialization failed:`, error);
    }
}

/**
 * Detect server name from various sources
 */
function detectServerName() {
    try {
        const pathname = window.location.pathname;
        const hostname = window.location.hostname;
        
        // Try to extract from pathname
        const pathMatch = pathname.match(/\/([^\/]+)/);
        if (pathMatch && pathMatch[1]) {
            let cleanName = pathMatch[1].replace(/-(st|sillytavern|public)$/i, '');
            if (cleanName && cleanName !== 'public' && cleanName !== 'st') {
                return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            }
        }
        
        // Try to extract from hostname
        const domainMatch = hostname.match(/([^\.]+)\./);
        if (domainMatch && domainMatch[1]) {
            let domainName = domainMatch[1].replace(/-/g, ' ');
            return domainName.charAt(0).toUpperCase() + domainName.slice(1);
        }
        
        // Try to get from document title
        const title = document.title;
        if (title && title !== 'SillyTavern') {
            return title.replace('SillyTavern', '').trim() || 'SillyTavern';
        }
        
        return 'SillyTavern';
    } catch (error) {
        console.warn(`[${extensionName}] Error detecting server name:`, error);
        return 'SillyTavern';
    }
}

/**
 * Load extension settings from localStorage
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem(`${extensionName}_settings`);
        if (saved) {
            extensionSettings = { ...extensionSettings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error(`[${extensionName}] Error loading settings:`, error);
    }
}

/**
 * Save extension settings to localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem(`${extensionName}_settings`, JSON.stringify(extensionSettings));
        saveSettingsDebounced();
    } catch (error) {
        console.error(`[${extensionName}] Error saving settings:`, error);
    }
}

/**
 * Add extension settings to the Extensions tab
 */
function addExtensionSettings() {
    const settingsHtml = `
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b><i class="fa-solid fa-shield-halved"></i> ${serverName} Lorebook Protection</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label" for="${extensionName}-enabled">
                    <input type="checkbox" id="${extensionName}-enabled" />
                    <span>Enable Lorebook Protection</span>
                </label>
                <small class="notes">Toggle to enable/disable the lorebook protection system. Configure additional settings within the panel itself.</small>

                <div style="margin-top: 10px;">
                    <label for="${extensionName}-security-level" class="checkbox_label">
                        <select id="${extensionName}-security-level" style="margin-left: 10px;">
                            <option value="low">Low - Basic protection</option>
                            <option value="medium">Medium - Standard protection</option>
                            <option value="high">High - Maximum security</option>
                        </select>
                        <span style="margin-left: 10px;">Security Level</span>
                    </label>
                </div>

                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button id="${extensionName}-open-panel" class="menu_button" style="flex: 1;">
                        <i class="fa-solid fa-shield-halved"></i> Open Admin Panel
                    </button>
                    <button id="${extensionName}-export-permissions" class="menu_button" style="flex: 1;">
                        <i class="fa-solid fa-download"></i> Export Data
                    </button>
                </div>
            </div>
        </div>
    `;

    $('#extensions_settings2').append(settingsHtml);

    // Set up event listeners
    $(`#${extensionName}-enabled`).prop('checked', extensionSettings.enabled).on('change', function() {
        extensionSettings.enabled = $(this).prop('checked');
        saveSettings();
        updatePanelVisibility();
        
        if (!extensionSettings.enabled) {
            showNotification('Lorebook Protection disabled', 'warning');
        } else {
            showNotification('Lorebook Protection enabled', 'success');
        }
    });

    $(`#${extensionName}-security-level`).val(extensionSettings.securityLevel).on('change', function() {
        extensionSettings.securityLevel = $(this).val();
        saveSettings();
        showNotification(`Security level set to ${$(this).val()}`, 'info');
    });

    $(`#${extensionName}-open-panel`).on('click', function() {
        if (extensionSettings.enabled) {
            showPermissionModal();
        } else {
            showNotification('Please enable Lorebook Protection first', 'warning');
        }
    });

    $(`#${extensionName}-export-permissions`).on('click', exportPermissionData);
}

/**
 * Initialize the UI components
 */
async function initUI() {
    // Load the HTML template using SillyTavern's template system
    const templateHtml = await renderExtensionTemplateAsync(extensionName, 'template');

    // Append panel to body
    $('body').append(templateHtml);

    // Cache UI elements
    $panelContainer = $('#lorebook-protection-panel');

    // Set up event listeners
    setupUIEventListeners();

    // Initialize UI state
    updatePanelVisibility();
    updatePermissionList();
}

/**
 * Set up UI event listeners
 */
function setupUIEventListeners() {
    // Panel toggle buttons
    $('#lorebook-toggle-panel').on('click', togglePanel);
    $('#lorebook-close-panel').on('click', closePanel);

    // Permission management buttons
    $('#lorebook-grant-permission').on('click', grantPermission);
    $('#lorebook-revoke-permission').on('click', revokePermission);
    $('#lorebook-clear-logs').on('click', clearAccessLogs);
    $('#lorebook-refresh-list').on('click', updatePermissionList);

    // Settings buttons
    $('#lorebook-export-data').on('click', exportPermissionData);
    $('#lorebook-import-data').on('click', importPermissionData);
    $('#lorebook-reset-settings').on('click', resetSettings);

    // Filter and search
    $('#lorebook-search-characters').on('input', filterCharacterList);
    $('#lorebook-filter-permissions').on('change', filterCharacterList);

    // Character selection
    $(document).on('click', '.lorebook-character-item', function() {
        selectCharacter($(this).data('character-id'));
    });
}

/**
 * Register event listeners for SillyTavern events
 */
function registerEventListeners() {
    // Character changed event
    eventSource.on(event_types.CHACTER_UPDATED, onCharacterChanged);
    
    // Chat loaded event
    eventSource.on(event_types.CHAT_LOADED, onChatLoaded);
    
    // Message sent event
    eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
}

/**
 * Event handlers
 */
function onCharacterChanged(data) {
    console.log(`[${extensionName}] Character changed:`, data);
    updatePermissionList();
}

function onChatLoaded(data) {
    console.log(`[${extensionName}] Chat loaded:`, data);
    updatePermissionList();
}

function onMessageSent(data) {
    // Log access attempts
    logAccessAttempt(data.character, data.message, 'sent');
}

/**
 * Show the permission management modal
 */
function showPermissionModal() {
    $('#lorebook-protection-modal').removeClass('hidden');
    updatePermissionList();
}

/**
 * Hide the permission management modal
 */
function hidePermissionModal() {
    $('#lorebook-protection-modal').addClass('hidden');
}

/**
 * Toggle the admin panel
 */
function togglePanel() {
    $panelContainer.toggleClass('expanded');
    updateToggleButton();
}

/**
 * Close the admin panel
 */
function closePanel() {
    $panelContainer.removeClass('expanded');
    updateToggleButton();
}

/**
 * Update panel visibility based on settings
 */
function updatePanelVisibility() {
    if (extensionSettings.enabled) {
        $panelContainer.removeClass('hidden');
    } else {
        $panelContainer.addClass('hidden');
    }
}

/**
 * Update toggle button state
 */
function updateToggleButton() {
    const $toggleBtn = $('#lorebook-toggle-panel');
    const isExpanded = $panelContainer.hasClass('expanded');
    
    if (isExpanded) {
        $toggleBtn.find('i').removeClass('fa-chevron-right').addClass('fa-chevron-down');
        $toggleBtn.attr('title', 'Collapse Lorebook Protection Panel');
    } else {
        $toggleBtn.find('i').removeClass('fa-chevron-down').addClass('fa-chevron-right');
        $toggleBtn.attr('title', 'Expand Lorebook Protection Panel');
    }
}

/**
 * Grant permission to a user
 */
function grantPermission() {
    const characterId = $('#lorebook-character-select').val();
    const userId = $('#lorebook-user-input').val().trim();
    
    if (!characterId) {
        showNotification('Please select a character', 'error');
        return;
    }
    
    if (!userId) {
        showNotification('Please enter a user ID', 'error');
        return;
    }
    
    if (!extensionSettings.permissions[characterId]) {
        extensionSettings.permissions[characterId] = {
            allowedUsers: [],
            owner: getContext().characterId || 'unknown',
            created: new Date().toISOString()
        };
    }
    
    if (!extensionSettings.permissions[characterId].allowedUsers.includes(userId)) {
        extensionSettings.permissions[characterId].allowedUsers.push(userId);
        saveSettings();
        updatePermissionList();
        
        // Clear input
        $('#lorebook-user-input').val('');
        
        showNotification(`Permission granted to ${userId}`, 'success');
        
        // Log the action
        logAccessAttempt(characterId, `Permission granted to ${userId}`, 'admin');
    } else {
        showNotification('User already has permission for this character', 'warning');
    }
}

/**
 * Revoke permission from a user
 */
function revokePermission() {
    const characterId = $('#lorebook-character-select').val();
    const userId = $('#lorebook-user-input').val().trim();
    
    if (!characterId) {
        showNotification('Please select a character', 'error');
        return;
    }
    
    if (!userId) {
        showNotification('Please enter a user ID', 'error');
        return;
    }
    
    if (extensionSettings.permissions[characterId] && 
        extensionSettings.permissions[characterId].allowedUsers.includes(userId)) {
        
        extensionSettings.permissions[characterId].allowedUsers = 
            extensionSettings.permissions[characterId].allowedUsers.filter(u => u !== userId);
        saveSettings();
        updatePermissionList();
        
        // Clear input
        $('#lorebook-user-input').val('');
        
        showNotification(`Permission revoked from ${userId}`, 'success');
        
        // Log the action
        logAccessAttempt(characterId, `Permission revoked from ${userId}`, 'admin');
    } else {
        showNotification('User does not have permission for this character', 'warning');
    }
}

/**
 * Update the permission list display
 */
function updatePermissionList() {
    const $listContainer = $('#lorebook-permissions-list');
    const context = getContext();
    
    if (!context.characters || context.characters.length === 0) {
        $listContainer.html('<div class="lorebook-empty-state">No characters found</div>');
        return;
    }
    
    // Update character select dropdown
    const $select = $('#lorebook-character-select');
    $select.empty().append('<option value="">Select character...</option>');
    
    let html = '';
    
    context.characters.forEach(character => {
        const characterId = character.data?.extensions?.character_id || character.name;
        const characterName = character.name || 'Unknown Character';
        const permissions = extensionSettings.permissions[characterId];
        
        // Add to select dropdown
        $select.append(`<option value="${characterId}">${characterName}</option>`);
        
        // Add to list
        html += `
            <div class="lorebook-character-item" data-character-id="${characterId}">
                <div class="character-header">
                    <h4>${characterName}</h4>
                    <span class="character-id">${characterId}</span>
                </div>
                <div class="permission-info">
                    <div class="permission-field">
                        <label>Owner:</label>
                        <span>${permissions?.owner || 'Not set'}</span>
                    </div>
                    <div class="permission-field">
                        <label>Allowed Users:</label>
                        <div class="user-list">
                            ${permissions?.allowedUsers?.length > 0 
                                ? permissions.allowedUsers.map(user => `<span class="user-tag">${user}</span>`).join('')
                                : '<span class="no-users">No users granted</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    $listContainer.html(html || '<div class="lorebook-empty-state">No permissions set</div>');
}

/**
 * Filter character list based on search and filters
 */
function filterCharacterList() {
    const searchTerm = $('#lorebook-search-characters').val().toLowerCase();
    const filterType = $('#lorebook-filter-permissions').val();
    
    $('.lorebook-character-item').each(function() {
        const $item = $(this);
        const characterName = $item.find('h4').text().toLowerCase();
        const characterId = $item.data('character-id');
        const permissions = extensionSettings.permissions[characterId];
        
        let show = true;
        
        // Search filter
        if (searchTerm && !characterName.includes(searchTerm)) {
            show = false;
        }
        
        // Permission filter
        if (filterType === 'has-permissions' && (!permissions || !permissions.allowedUsers?.length)) {
            show = false;
        } else if (filterType === 'no-permissions' && permissions?.allowedUsers?.length) {
            show = false;
        }
        
        $item.toggle(show);
    });
}

/**
 * Log access attempts
 */
function logAccessAttempt(characterId, action, type = 'access') {
    const logEntry = {
        timestamp: new Date().toISOString(),
        characterId,
        action,
        type,
        user: getContext().user_avatar || 'unknown'
    };
    
    extensionSettings.accessLogs.unshift(logEntry);
    
    // Keep only last 1000 entries
    if (extensionSettings.accessLogs.length > 1000) {
        extensionSettings.accessLogs = extensionSettings.accessLogs.slice(0, 1000);
    }
    
    saveSettings();
    updateLogDisplay();
}

/**
 * Update access log display
 */
function updateLogDisplay() {
    const $logContainer = $('#lorebook-access-logs');
    const recentLogs = extensionSettings.accessLogs.slice(0, 50);
    
    if (recentLogs.length === 0) {
        $logContainer.html('<div class="lorebook-empty-state">No access logs</div>');
        return;
    }
    
    const html = recentLogs.map(log => `
        <div class="log-entry log-${log.type}">
            <div class="log-time">${new Date(log.timestamp).toLocaleString()}</div>
            <div class="log-character">${log.characterId}</div>
            <div class="log-action">${log.action}</div>
        </div>
    `).join('');
    
    $logContainer.html(html);
}

/**
 * Clear access logs
 */
function clearAccessLogs() {
    if (confirm('Are you sure you want to clear all access logs?')) {
        extensionSettings.accessLogs = [];
        saveSettings();
        updateLogDisplay();
        showNotification('Access logs cleared', 'success');
    }
}

/**
 * Export permission data
 */
function exportPermissionData() {
    const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        serverName,
        settings: extensionSettings
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `lorebook-protection-${serverName}-${Date.now()}.json`;
    link.click();
    
    showNotification('Permission data exported', 'success');
}

/**
 * Import permission data
 */
function importPermissionData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importData = JSON.parse(event.target.result);
                
                if (importData.settings) {
                    extensionSettings = { ...extensionSettings, ...importData.settings };
                    saveSettings();
                    updatePermissionList();
                    updateLogDisplay();
                    showNotification('Permission data imported successfully', 'success');
                } else {
                    showNotification('Invalid import file format', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                showNotification('Failed to import permission data', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

/**
 * Reset extension settings
 */
function resetSettings() {
    if (confirm('Are you sure you want to reset all settings? This will clear all permissions and logs.')) {
        extensionSettings = {
            enabled: true,
            panelPosition: 'right',
            permissions: {},
            accessLogs: [],
            securityLevel: 'medium',
            autoCleanup: true,
            notificationEnabled: true
        };
        
        saveSettings();
        updatePermissionList();
        updateLogDisplay();
        
        // Update UI controls
        $(`#${extensionName}-enabled`).prop('checked', true);
        $(`#${extensionName}-security-level`).val('medium');
        
        showNotification('Settings reset to defaults', 'success');
    }
}

/**
 * Select a character in the list
 */
function selectCharacter(characterId) {
    $('#lorebook-character-select').val(characterId);
    
    // Highlight selected item
    $('.lorebook-character-item').removeClass('selected');
    $(`.lorebook-character-item[data-character-id="${characterId}"]`).addClass('selected');
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    if (!extensionSettings.notificationEnabled) return;
    
    const toast = $(`
        <div class="lorebook-toast lorebook-toast-${type}">
            <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `);
    
    $('body').append(toast);
    
    // Animate in
    setTimeout(() => toast.addClass('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.removeClass('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Check if user has permission for character
 */
function checkPermission(characterId, userId) {
    const permissions = extensionSettings.permissions[characterId];
    const context = getContext();
    
    // Owner always has access
    if (permissions?.owner === userId) {
        return true;
    }
    
    // Check allowed users
    if (permissions?.allowedUsers?.includes(userId)) {
        return true;
    }
    
    // Admin override (if implemented)
    if (context.user && context.user.admin) {
        return true;
    }
    
    return false;
}

/**
 * Make functions globally available for debugging
 */
window.LorebookProtectionSystem = {
    checkPermission,
    grantPermission,
    revokePermission,
    settings: () => extensionSettings,
    showPermissionModal,
    exportPermissionData,
    importPermissionData
};

// Initialize when SillyTavern is ready
jQuery(async () => {
    await initExtension();
    console.log(`[${extensionName}] Lorebook Protection Extension loaded`);
});