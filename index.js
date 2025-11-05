// SillyTavern Lorebook Protection Extension
// Working version - simplified and functional

const MODULE_NAME = 'lorebook-protection';
let serverName = 'SillyTavern';
let extensionSettings = {};

// Initialize extension
function initExtension() {
    console.log(`[${MODULE_NAME}] Initializing Lorebook Protection Extension...`);
    
    // Detect server name
    serverName = detectServerName();
    console.log(`[${MODULE_NAME}] Detected server: ${serverName}`);
    
    // Load settings
    loadSettings();
    
    // Add UI elements
    addExtensionUI();
    
    console.log(`[${MODULE_NAME}] Extension initialized successfully`);
}

// Detect server name from URL/path
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
        console.warn(`[${MODULE_NAME}] Error detecting server name:`, error);
        return 'SillyTavern';
    }
}

// Load extension settings
function loadSettings() {
    try {
        const saved = localStorage.getItem(`${MODULE_NAME}_settings`);
        if (saved) {
            extensionSettings = JSON.parse(saved);
        } else {
            extensionSettings = {
                enabled: true,
                permissions: {},
                logs: []
            };
            saveSettings();
        }
    } catch (error) {
        console.error(`[${MODULE_NAME}] Error loading settings:`, error);
        extensionSettings = { enabled: true, permissions: {}, logs: [] };
    }
}

// Save extension settings
function saveSettings() {
    try {
        localStorage.setItem(`${MODULE_NAME}_settings`, JSON.stringify(extensionSettings));
    } catch (error) {
        console.error(`[${MODULE_NAME}] Error saving settings:`, error);
    }
}

// Add extension UI elements
function addExtensionUI() {
    console.log(`[${MODULE_NAME}] Adding UI elements...`);
    
    // Add toolbar icon immediately
    addToolbarIcon();
    
    // Wait for DOM to be fully loaded and try again
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addToolbarIcon, 1000);
            setTimeout(addSidebarIcon, 2000);
        });
    } else {
        setTimeout(addToolbarIcon, 500);
        setTimeout(addSidebarIcon, 1500);
    }
}

// Add toolbar icon to main interface
function addToolbarIcon() {
    console.log(`[${MODULE_NAME}] Adding toolbar icon...`);
    
    // Remove existing icon if present
    const existingIcon = document.getElementById('lorebook-protection-toolbar-icon');
    if (existingIcon) {
        existingIcon.remove();
    }
    
    // Create toolbar icon
    const icon = document.createElement('div');
    icon.id = 'lorebook-protection-toolbar-icon';
    icon.className = 'toolbar-icon';
    icon.innerHTML = '🔐';
    icon.title = `${serverName} Lorebook Admin`;
    icon.style.cssText = `
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
        z-index: 1000;
    `;
    
    // Add hover effects
    icon.addEventListener('mouseenter', () => {
        icon.style.transform = 'translateY(-2px)';
        icon.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
    
    icon.addEventListener('mouseleave', () => {
        icon.style.transform = 'translateY(0)';
        icon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    // Add click handler
    icon.addEventListener('click', showPermissionModal);
    
    // Try to find toolbar and add icon
    const toolbarSelectors = [
        '#extensionsMenu',
        '.extensions-menu',
        '#extensions-menu',
        '.extensions-menu-area',
        '#top-bar-right',
        '.top-bar-right',
        '#header-buttons',
        '.header-buttons',
        '#menuBar',
        '.menuBar',
        '#main-toolbar',
        '.toolbar'
    ];
    
    let iconAdded = false;
    
    for (const selector of toolbarSelectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            toolbar.appendChild(icon);
            console.log(`[${MODULE_NAME}] Icon added to ${selector}`);
            iconAdded = true;
            break;
        }
    }
    
    // If no toolbar found, add to body in top-right
    if (!iconAdded) {
        icon.style.position = 'fixed';
        icon.style.top = '10px';
        icon.style.right = '10px';
        document.body.appendChild(icon);
        console.log(`[${MODULE_NAME}] Icon added to body as fallback`);
    }
    
    // Add floating backup icon
    addFloatingIcon();
}

// Add floating backup icon
function addFloatingIcon() {
    // Remove existing if present
    const existing = document.getElementById('lorebook-protection-floating-icon');
    if (existing) {
        existing.remove();
    }
    
    const floatingIcon = document.createElement('div');
    floatingIcon.id = 'lorebook-protection-floating-icon';
    floatingIcon.innerHTML = '🔐';
    floatingIcon.title = `${serverName} Lorebook Admin`;
    floatingIcon.style.cssText = `
        position: fixed;
        bottom: 20px;
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
    
    floatingIcon.addEventListener('click', showPermissionModal);
    
    floatingIcon.addEventListener('mouseenter', () => {
        floatingIcon.style.transform = 'scale(1.1)';
        floatingIcon.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
    });
    
    floatingIcon.addEventListener('mouseleave', () => {
        floatingIcon.style.transform = 'scale(1)';
        floatingIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });
    
    document.body.appendChild(floatingIcon);
    console.log(`[${MODULE_NAME}] Floating icon added`);
}

// Add sidebar icon
function addSidebarIcon() {
    console.log(`[${MODULE_NAME}] Adding sidebar icon...`);
    
    // Remove existing if present
    const existing = document.getElementById('lorebook-protection-sidebar-icon');
    if (existing) {
        existing.remove();
    }
    
    const sidebarIcon = document.createElement('div');
    sidebarIcon.id = 'lorebook-protection-sidebar-icon';
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
    
    sidebarIcon.addEventListener('click', showPermissionModal);
    
    sidebarIcon.addEventListener('mouseenter', () => {
        sidebarIcon.style.transform = 'translateX(-5px)';
        sidebarIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    });
    
    sidebarIcon.addEventListener('mouseleave', () => {
        sidebarIcon.style.transform = 'translateX(0)';
        sidebarIcon.style.boxShadow = 'none';
    });
    
    // Try to find sidebar
    const sidebarSelectors = [
        '#right-nav-panel',
        '.right-nav-panel',
        '#sidebar',
        '.sidebar',
        '#character-nav',
        '.character-nav'
    ];
    
    for (const selector of sidebarSelectors) {
        const sidebar = document.querySelector(selector);
        if (sidebar) {
            sidebar.appendChild(sidebarIcon);
            console.log(`[${MODULE_NAME}] Sidebar icon added to ${selector}`);
            return;
        }
    }
}

// Show permission management modal
function showPermissionModal() {
    console.log(`[${MODULE_NAME}] Opening permission modal...`);
    
    // Remove existing modal
    const existingModal = document.getElementById('lorebook-protection-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'lorebook-protection-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 25px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            position: relative;
        ">
            <h3 style="
                color: #2c3e50;
                margin-bottom: 20px;
                font-size: 1.5em;
            ">🔐 ${serverName} Lorebook Admin</h3>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">
                    Character: 
                    <select id="character-select" style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        margin-top: 5px;
                        font-size: 14px;
                    ">
                        <option value="">Select character...</option>
                        <option value="character1">Sample Character 1</option>
                        <option value="character2">Sample Character 2</option>
                        <option value="character3">Sample Character 3</option>
                    </select>
                </label>
                
                <label style="display: block; margin-bottom: 15px; font-weight: bold;">
                    User ID: 
                    <input type="text" id="user-input" placeholder="Enter user ID..." style="
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        margin-top: 5px;
                        font-size: 14px;
                    ">
                </label>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="grantPermission()" style="
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        flex: 1;
                    ">Grant Access</button>
                    
                    <button onclick="revokePermission()" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        flex: 1;
                    ">Revoke Access</button>
                </div>
            </div>
            
            <div style="
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 20px;
            ">
                <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Current Permissions</h4>
                <div id="permissions-list" style="
                    color: #666;
                    font-style: italic;
                    min-height: 50px;
                ">No permissions set yet.</div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="closeModal()" style="
                    background: #95a5a6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    flex: 1;
                ">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Make functions globally available
    window.closeModal = function() {
        const modal = document.getElementById('lorebook-protection-modal');
        if (modal) {
            modal.remove();
        }
    };
    
    window.grantPermission = function() {
        const character = document.getElementById('character-select').value;
        const user = document.getElementById('user-input').value;
        
        if (character && user) {
            if (!extensionSettings.permissions[character]) {
                extensionSettings.permissions[character] = { allowedUsers: [] };
            }
            
            if (!extensionSettings.permissions[character].allowedUsers.includes(user)) {
                extensionSettings.permissions[character].allowedUsers.push(user);
                saveSettings();
                updatePermissionsList();
                document.getElementById('user-input').value = '';
                showMessage('Permission granted successfully!', 'success');
            } else {
                showMessage('User already has permission for this character.', 'warning');
            }
        } else {
            showMessage('Please select a character and enter a user ID.', 'error');
        }
    };
    
    window.revokePermission = function() {
        const character = document.getElementById('character-select').value;
        const user = document.getElementById('user-input').value;
        
        if (character && user) {
            if (extensionSettings.permissions[character] && 
                extensionSettings.permissions[character].allowedUsers.includes(user)) {
                
                extensionSettings.permissions[character].allowedUsers = 
                    extensionSettings.permissions[character].allowedUsers.filter(u => u !== user);
                saveSettings();
                updatePermissionsList();
                document.getElementById('user-input').value = '';
                showMessage('Permission revoked successfully!', 'success');
            } else {
                showMessage('User does not have permission for this character.', 'warning');
            }
        } else {
            showMessage('Please select a character and enter a user ID.', 'error');
        }
    };
    
    window.updatePermissionsList = function() {
        const listDiv = document.getElementById('permissions-list');
        if (!listDiv) return;
        
        let html = '';
        for (const [character, permissions] of Object.entries(extensionSettings.permissions)) {
            if (permissions.allowedUsers && permissions.allowedUsers.length > 0) {
                html += `
                    <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border: 1px solid #ddd;">
                        <strong>${character}:</strong> ${permissions.allowedUsers.join(', ')}
                    </div>
                `;
            }
        }
        
        if (html) {
            listDiv.innerHTML = html;
        } else {
            listDiv.innerHTML = '<div style="color: #666; font-style: italic;">No permissions set yet.</div>';
        }
    };
    
    window.showMessage = function(message, type) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            transition: opacity 0.3s ease;
        `;
        
        if (type === 'success') {
            toast.style.background = '#27ae60';
        } else if (type === 'warning') {
            toast.style.background = '#f39c12';
        } else {
            toast.style.background = '#e74c3c';
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    };
    
    // Initial permissions list update
    updatePermissionsList();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExtension);
} else {
    initExtension();
}

// Also try to initialize after a delay (for dynamic pages)
setTimeout(initExtension, 2000);

console.log(`[${MODULE_NAME}] Lorebook Protection Extension loaded`);