const MODULE_NAME = 'lorebook_acl';

// Get SillyTavern context
let context = null;
let isPanelOpen = false;

/**
 * Make API call to server plugin
 */
async function callAPI(endpoint, data = null, method = 'GET') {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`/api/plugins/lorebook-acl${endpoint}`, options);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error(`API call failed: ${endpoint}`, err);
        throw err;
    }
}

/**
 * Show notification to user with neumorphic styling
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `acl-message ${type}`;
    notification.textContent = message;
    
    // Add to page
    const container = document.querySelector('#lorebook-acl-panel .lorebook-acl-section:first-child') || document.body;
    container.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);

    // Also use SillyTavern's built-in notification if available
    if (typeof toastr !== 'undefined') {
        toastr[type](message);
    }
}

/**
 * Get current user info (mock for testing)
 */
function getCurrentUser() {
    // In real SillyTavern, this would come from the auth system
    return {
        handle: 'test-user',
        isAdmin: true
    };
}

/**
 * Create the floating ACL Panel with neumorphic design
 */
function createFloatingPanel() {
    // Remove existing panel if present
    const existingPanel = document.getElementById('lorebook-acl-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'acl-panel-backdrop';
    backdrop.className = 'acl-panel-backdrop';
    backdrop.addEventListener('click', closePanel);

    // Create the main floating panel
    const panel = document.createElement('div');
    panel.id = 'lorebook-acl-panel';
    panel.className = 'lorebook-acl-panel';
    panel.innerHTML = `
        <button class="acl-panel-close" onclick="closePanel()">✕</button>
        <h3>🛡️ Lorebook Access Control Panel</h3>
        
        <div class="lorebook-acl-section">
            <h4>📤 Share Lorebook</h4>
            <div class="flex-container">
                <select id="shared-lorebook-select">
                    <option value="">Select a shared lorebook...</option>
                </select>
                <input type="text" id="target-user-input" placeholder="Target user handle" />
                <input type="text" id="symlink-name-input" placeholder="Symlink name (e.g., shared_fantasy.json)" />
                <button id="create-symlink-btn" class="primary">Create Symlink</button>
            </div>
        </div>
        
        <div class="lorebook-acl-section">
            <h4>🔓 Grant Access</h4>
            <div class="flex-container">
                <input type="text" id="grant-lorebook-input" placeholder="Lorebook name" />
                <input type="text" id="grant-user-input" placeholder="User handle" />
                <button id="grant-access-btn" class="primary">Grant Access</button>
            </div>
        </div>
        
        <div class="lorebook-acl-section">
            <h4>📋 Current Access Control List</h4>
            <button id="refresh-acl-btn">🔄 Refresh</button>
            <div id="acl-list"></div>
        </div>
    `;

    // Add both elements to the page
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    // Add event listeners
    document.getElementById('create-symlink-btn').addEventListener('click', createSymlink);
    document.getElementById('grant-access-btn').addEventListener('click', grantAccess);
    document.getElementById('refresh-acl-btn').addEventListener('click', refreshACL);

    // Load initial data
    loadSharedLorebooks();
    refreshACL();
}

/**
 * Create ACL trigger button for world info tab
 */
function createTriggerButton() {
    // Check if button already exists
    const existingButton = document.getElementById('acl-trigger-button');
    if (existingButton) {
        return;
    }

    // Create the trigger button
    const triggerButton = document.createElement('button');
    triggerButton.id = 'acl-trigger-button';
    triggerButton.className = 'acl-trigger-button';
    triggerButton.innerHTML = '🛡️ ACL Panel';
    triggerButton.title = 'Open Lorebook Access Control Panel';
    
    // Add click handler
    triggerButton.addEventListener('click', togglePanel);

    // Try to find the world info tab container
    // This needs to be adapted based on SillyTavern's actual DOM structure
    const worldInfoContainer = findWorldInfoContainer();
    
    if (worldInfoContainer) {
        worldInfoContainer.appendChild(triggerButton);
        console.log('ACL trigger button added to world info tab');
    } else {
        // Fallback: add to extensions menu or a more general location
        const fallbackLocation = document.querySelector('#extensions_menu') || 
                                document.querySelector('.settings-menu') || 
                                document.body;
        fallbackLocation.appendChild(triggerButton);
        console.log('ACL trigger button added to fallback location');
    }
}

/**
 * Find the world info tab container in SillyTavern
 */
function findWorldInfoContainer() {
    // Try multiple selectors to find the world info tab
    const selectors = [
        '#world_info', // Common ID for world info
        '.world-info', // Common class for world info
        '#WI_settings', // Another possible ID
        '.world-info-settings', // Another possible class
        '#character_world_info', // Character-specific world info
        '[data-tab="world"]', // Tab-based navigation
        '.tab-content[data-tab="world"]', // Tab content
        '#rm_world_info', // Right menu world info
        '.rm_world_info_panel' // Right menu panel
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`Found world info container: ${selector}`);
            return element;
        }
    }

    // Try to find by text content
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
        if (element.textContent && 
            (element.textContent.includes('World Info') || 
             element.textContent.includes('Lorebook') ||
             element.textContent.includes('WI'))) {
            // Check if it's a container element
            if (element.children.length > 0) {
                console.log('Found world info container by text content');
                return element;
            }
        }
    }

    return null;
}

/**
 * Toggle the ACL panel visibility
 */
function togglePanel() {
    if (isPanelOpen) {
        closePanel();
    } else {
        openPanel();
    }
}

/**
 * Open the ACL panel
 */
function openPanel() {
    if (!isPanelOpen) {
        // Create panel if it doesn't exist
        if (!document.getElementById('lorebook-acl-panel')) {
            createFloatingPanel();
        }

        // Show panel and backdrop
        const panel = document.getElementById('lorebook-acl-panel');
        const backdrop = document.getElementById('acl-panel-backdrop');
        const triggerButton = document.getElementById('acl-trigger-button');

        if (panel && backdrop) {
            panel.classList.add('active');
            backdrop.classList.add('active');
            if (triggerButton) {
                triggerButton.classList.add('active');
            }
            isPanelOpen = true;
        }
    }
}

/**
 * Close the ACL panel
 */
function closePanel() {
    if (isPanelOpen) {
        const panel = document.getElementById('lorebook-acl-panel');
        const backdrop = document.getElementById('acl-panel-backdrop');
        const triggerButton = document.getElementById('acl-trigger-button');

        if (panel && backdrop) {
            panel.classList.remove('active');
            backdrop.classList.remove('active');
            if (triggerButton) {
                triggerButton.classList.remove('active');
            }
            isPanelOpen = false;
        }
    }
}

/**
 * Load shared lorebooks list
 */
async function loadSharedLorebooks() {
    try {
        const result = await callAPI('/list-shared');
        const select = document.getElementById('shared-lorebook-select');

        if (!select) return;

        // Clear existing options except the first one
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Add lorebooks
        result.lorebooks.forEach(lorebook => {
            const option = document.createElement('option');
            option.value = lorebook;
            option.textContent = lorebook;
            select.appendChild(option);
        });

    } catch (err) {
        console.error('Failed to load shared lorebooks:', err);
        showNotification('Failed to load shared lorebooks: ' + err.message, 'error');
    }
}

/**
 * Create a symlink
 */
async function createSymlink() {
    const targetLorebook = document.getElementById('shared-lorebook-select').value;
    const targetUser = document.getElementById('target-user-input').value.trim();
    const linkName = document.getElementById('symlink-name-input').value.trim();

    if (!targetLorebook || !targetUser || !linkName) {
        showNotification('Please fill all fields', 'warning');
        return;
    }

    if (!linkName.endsWith('.json')) {
        showNotification('Symlink name must end with .json', 'warning');
        return;
    }

    try {
        const result = await callAPI('/create-symlink', {
            targetLorebook,
            targetUser,
            linkName
        }, 'POST');

        showNotification(result.message || 'Symlink created successfully', 'success');

        // Clear inputs
        document.getElementById('target-user-input').value = '';
        document.getElementById('symlink-name-input').value = '';
        document.getElementById('shared-lorebook-select').value = '';

        // Refresh ACL
        refreshACL();

    } catch (err) {
        console.error('Failed to create symlink:', err);
        showNotification('Failed to create symlink: ' + err.message, 'error');
    }
}

/**
 * Grant access to a lorebook
 */
async function grantAccess() {
    const lorebookName = document.getElementById('grant-lorebook-input').value.trim();
    const targetUser = document.getElementById('grant-user-input').value.trim();

    if (!lorebookName || !targetUser) {
        showNotification('Please fill all fields', 'warning');
        return;
    }

    try {
        const result = await callAPI('/grant-access', {
            lorebookName,
            targetUser
        }, 'POST');

        showNotification(`Access granted to ${targetUser}`, 'success');

        // Clear inputs
        document.getElementById('grant-lorebook-input').value = '';
        document.getElementById('grant-user-input').value = '';

        // Refresh ACL
        refreshACL();

    } catch (err) {
        console.error('Failed to grant access:', err);
        showNotification('Failed to grant access: ' + err.message, 'error');
    }
}

/**
 * Refresh the ACL display
 */
async function refreshACL() {
    try {
        const result = await callAPI('/list-acl');
        const aclList = document.getElementById('acl-list');

        if (!aclList) return;

        if (Object.keys(result.acl).length === 0) {
            aclList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No lorebook access controls defined.</p>';
            return;
        }

        let html = '<table class="acl-table">';
        html += '<tr><th>Lorebook</th><th>Creator</th><th>Allowed Users</th><th>Created</th><th>Type</th><th>Status</th></tr>';

        for (const [lorebookName, entry] of Object.entries(result.acl)) {
            const createdDate = new Date(entry.createdAt).toLocaleDateString();
            const allowedUsers = entry.allowedUsers.join(', ');
            const type = entry.isSymlink ? 'Symlink' : 'Direct';
            const statusClass = entry.allowedUsers.length > 0 ? 'status-allowed' : 'status-pending';

            html += `<tr>
                <td><strong>${lorebookName}</strong></td>
                <td>${entry.creator}</td>
                <td>${allowedUsers}</td>
                <td>${createdDate}</td>
                <td><span class="status-indicator ${statusClass}"></span>${type}</td>
                <td>${entry.allowedUsers.length > 0 ? 'Active' : 'No users'}</td>
            </tr>`;
        }

        html += '</table>';
        aclList.innerHTML = html;

    } catch (err) {
        console.error('Failed to refresh ACL:', err);
        showNotification('Failed to refresh ACL: ' + err.message, 'error');
    }
}

/**
 * Validate current lorebook access
 */
async function validateCurrentLorebook() {
    if (!context) return;

    const { characters, characterId } = context;
    const char = characters[characterId];

    if (!char || characterId === undefined) return;

    const lorebookName = char?.data?.extensions?.world;
    if (!lorebookName) return;

    try {
        const result = await callAPI('/check-access', { lorebookName }, 'POST');

        if (!result.permitted) {
            // Remove unauthorized lorebook
            char.data.extensions.world = null;
            showNotification('You do not have permission to access this lorebook', 'warning');

            // Save the character change
            if (typeof saveCharacterDebounced === 'function') {
                saveCharacterDebounced();
            }
        }

    } catch (err) {
        console.error('Failed to validate lorebook access:', err);
    }
}

/**
 * Generation interceptor function
 */
globalThis.lorebookACLInterceptor = async function(chat, contextSize, abort, type) {
    try {
        if (!context) return;

        const { characters, characterId } = context;
        const char = characters[characterId];

        if (!char || characterId === undefined) return;

        const lorebookName = char?.data?.extensions?.world;
        if (!lorebookName) return;

        const result = await callAPI('/check-access', { lorebookName }, 'POST');

        if (!result.permitted) {
            abort(true);
            showNotification('Generation blocked: You do not have permission to use this lorebook', 'error');
        }

    } catch (err) {
        console.error('Lorebook ACL interceptor error:', err);
        // Don't block generation on API errors
    }
};

/**
 * Initialize the extension
 */
function initialize() {
    console.log('Lorebook ACL Extension with Neumorphic UI initializing...');

    // Get SillyTavern context
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        context = SillyTavern.getContext();
        const { eventSource, event_types } = context;

        // Listen for chat changes
        if (eventSource && event_types) {
            eventSource.on(event_types.CHAT_CHANGED, validateCurrentLorebook);
            eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, validateCurrentLorebook);
        }
    }

    // Create UI when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createTriggerButton();
        });
    } else {
        createTriggerButton();
    }

    // Add keyboard shortcut (Ctrl+Shift+L) to toggle panel
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            togglePanel();
        }
    });

    console.log('Lorebook ACL Extension with Neumorphic UI initialized');
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    // Browser environment
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
} else {
    // Node.js environment (for testing)
    module.exports = {
        initialize,
        createSymlink,
        grantAccess,
        validateCurrentLorebook,
        callAPI,
        togglePanel,
        openPanel,
        closePanel
    };
}