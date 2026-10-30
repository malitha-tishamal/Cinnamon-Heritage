// Admin Footer Management
// This script handles all footer management functionality in the admin panel

document.addEventListener('DOMContentLoaded', function() {
    // Load footer management data when section is accessed
    const footerManagementLink = document.querySelector('[data-section="footer-management"]');
    const socialMediaLink = document.querySelector('[data-section="social-media"]');
    
    if (footerManagementLink) {
        footerManagementLink.addEventListener('click', loadFooterManagement);
    }
    
    if (socialMediaLink) {
        socialMediaLink.addEventListener('click', loadSocialMediaManagement);
    }
});

// Load Footer Management Section
async function loadFooterManagement() {
    try {
        // Load brand settings
        const brandSettings = await fetchFooterSettings();
        document.getElementById('footerBrandTitle').value = brandSettings.footer_title || '';
        document.getElementById('footerBrandDescription').value = brandSettings.footer_description || '';
        document.getElementById('footerBrandCopyright').value = brandSettings.footer_copyright || '';
        document.getElementById('footerBrandCertifications').value = brandSettings.footer_certifications || '';
        document.getElementById('developerName').value = brandSettings.developer_name || '';
        document.getElementById('developerWebsite').value = brandSettings.developer_website || '';
        document.getElementById('developerLinkedin').value = brandSettings.developer_linkedin || '';

        // Load contact information
        const contactInfo = await fetchFooterContact();
        renderContactInfoEditor(contactInfo);

        // Load explore links
        const exploreLinks = await fetchFooterLinks('explore');
        renderExploreLinksEditor(exploreLinks);

        // Load policy links
        const policyLinks = await fetchFooterLinks('policies');
        renderPolicyLinksEditor(policyLinks);

    } catch (error) {
        console.error('Error loading footer management:', error);
        showAlert('error', 'Failed to load footer management data');
    }
}

// Load Social Media Management Section
async function loadSocialMediaManagement() {
    try {
        const socialMedia = await fetchSocialMedia();
        renderSocialMediaEditor(socialMedia);
    } catch (error) {
        console.error('Error loading social media management:', error);
        showAlert('error', 'Failed to load social media data');
    }
}

// Render Contact Info Editor
function renderContactInfoEditor(contactInfo) {
    const container = document.getElementById('contactInfoEditor');
    container.innerHTML = '';

    contactInfo.forEach((item, index) => {
        const itemHtml = `
            <div class="contact-item-row mb-3 p-3 border rounded" data-id="${item.id}">
                <div class="row g-2">
                    <div class="col-md-3">
                        <label class="form-label small fw-bold">Type</label>
                        <select class="form-select form-select-sm" onchange="updateContactIcon(this)">
                            <option value="address" ${item.contact_type === 'address' ? 'selected' : ''}>Address</option>
                            <option value="phone" ${item.contact_type === 'phone' ? 'selected' : ''}>Phone</option>
                            <option value="email" ${item.contact_type === 'email' ? 'selected' : ''}>Email</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-bold">Value</label>
                        <input type="text" class="form-control form-control-sm" value="${item.contact_value}" placeholder="Contact value">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small fw-bold">Icon</label>
                        <input type="text" class="form-control form-control-sm contact-icon" value="${item.icon_class}" placeholder="bi-geo-alt">
                    </div>
                    <div class="col-md-1">
                        <label class="form-label small fw-bold">Active</label>
                        <div class="form-check form-switch mt-1">
                            <input class="form-check-input" type="checkbox" ${item.is_active ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
                <div class="mt-2 text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="removeContactItem(this)"><i class="bi bi-trash"></i> Remove</button>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

// Render Explore Links Editor
function renderExploreLinksEditor(links) {
    const container = document.getElementById('exploreLinksEditor');
    container.innerHTML = '';

    links.forEach((link, index) => {
        const itemHtml = `
            <div class="link-item-row mb-3 p-3 border rounded" data-id="${link.id}">
                <div class="row g-2">
                    <div class="col-md-4">
                        <label class="form-label small fw-bold">Link Title</label>
                        <input type="text" class="form-control form-control-sm link-title" value="${link.link_title}" placeholder="Link title">
                    </div>
                    <div class="col-md-5">
                        <label class="form-label small fw-bold">URL</label>
                        <input type="text" class="form-control form-control-sm link-url" value="${link.link_url}" placeholder="#section or https://...">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small fw-bold">Type</label>
                        <select class="form-select form-select-sm link-type">
                            <option value="internal" ${link.link_type === 'internal' ? 'selected' : ''}>Internal</option>
                            <option value="external" ${link.link_type === 'external' ? 'selected' : ''}>External</option>
                        </select>
                    </div>
                    <div class="col-md-1">
                        <label class="form-label small fw-bold">Active</label>
                        <div class="form-check form-switch mt-1">
                            <input class="form-check-input link-active" type="checkbox" ${link.is_active ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
                <div class="mt-2 d-flex justify-content-between align-items-center">
                    <div>
                        <button class="btn btn-sm btn-outline-secondary" onclick="moveLinkUp(this)"><i class="bi bi-arrow-up"></i></button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="moveLinkDown(this)"><i class="bi bi-arrow-down"></i></button>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeExploreLink(this)"><i class="bi bi-trash"></i> Remove</button>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

// Render Policy Links Editor
function renderPolicyLinksEditor(links) {
    const container = document.getElementById('policyLinksEditor');
    container.innerHTML = '';

    links.forEach((link, index) => {
        const itemHtml = `
            <div class="policy-item-row mb-3 p-3 border rounded" data-id="${link.id}">
                <div class="row g-2">
                    <div class="col-md-4">
                        <label class="form-label small fw-bold">Policy Title</label>
                        <input type="text" class="form-control form-control-sm policy-title" value="${link.policy_title}" placeholder="Policy title">
                    </div>
                    <div class="col-md-5">
                        <label class="form-label small fw-bold">URL</label>
                        <input type="text" class="form-control form-control-sm policy-url" value="${link.policy_url}" placeholder="#section or https://...">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small fw-bold">Type</label>
                        <select class="form-select form-select-sm policy-type">
                            <option value="internal" ${link.policy_type === 'internal' ? 'selected' : ''}>Internal</option>
                            <option value="external" ${link.policy_type === 'external' ? 'selected' : ''}>External</option>
                        </select>
                    </div>
                    <div class="col-md-1">
                        <label class="form-label small fw-bold">Active</label>
                        <div class="form-check form-switch mt-1">
                            <input class="form-check-input policy-active" type="checkbox" ${link.is_active ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
                <div class="mt-2 d-flex justify-content-between align-items-center">
                    <div>
                        <button class="btn btn-sm btn-outline-secondary" onclick="movePolicyUp(this)"><i class="bi bi-arrow-up"></i></button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="movePolicyDown(this)"><i class="bi bi-arrow-down"></i></button>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removePolicyLink(this)"><i class="bi bi-trash"></i> Remove</button>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

// Render Social Media Editor
function renderSocialMediaEditor(socialMedia) {
    const container = document.getElementById('socialMediaEditor');
    container.innerHTML = '';

    socialMedia.forEach((platform, index) => {
        const itemHtml = `
            <div class="social-item-row mb-3 p-3 border rounded" data-id="${platform.id}">
                <div class="row g-2 align-items-center">
                    <div class="col-md-3">
                        <label class="form-label small fw-bold">Platform Name</label>
                        <input type="text" class="form-control form-control-sm platform-name" value="${platform.platform_name}" placeholder="Facebook">
                    </div>
                    <div class="col-md-5">
                        <label class="form-label small fw-bold">Platform URL</label>
                        <input type="url" class="form-control form-control-sm platform-url" value="${platform.platform_url || ''}" placeholder="https://...">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small fw-bold">Icon Class</label>
                        <input type="text" class="form-control form-control-sm platform-icon" value="${platform.icon_class}" placeholder="bi-facebook">
                    </div>
                    <div class="col-md-1">
                        <label class="form-label small fw-bold">Active</label>
                        <div class="form-check form-switch mt-1">
                            <input class="form-check-input platform-active" type="checkbox" ${platform.is_active ? 'checked' : ''}>
                        </div>
                    </div>
                    <div class="col-md-1">
                        <label class="form-label small fw-bold">Actions</label>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-secondary" onclick="moveSocialUp(this)"><i class="bi bi-arrow-up"></i></button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="moveSocialDown(this)"><i class="bi bi-arrow-down"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="removeSocialPlatform(this)"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

// Add Functions
function addContactItem() {
    const container = document.getElementById('contactInfoEditor');
    const newItem = `
        <div class="contact-item-row mb-3 p-3 border rounded">
            <div class="row g-2">
                <div class="col-md-3">
                    <label class="form-label small fw-bold">Type</label>
                    <select class="form-select form-select-sm" onchange="updateContactIcon(this)">
                        <option value="address">Address</option>
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold">Value</label>
                    <input type="text" class="form-control form-control-sm" placeholder="Contact value">
                </div>
                <div class="col-md-2">
                    <label class="form-label small fw-bold">Icon</label>
                    <input type="text" class="form-control form-control-sm contact-icon" value="bi-geo-alt" placeholder="bi-geo-alt">
                </div>
                <div class="col-md-1">
                    <label class="form-label small fw-bold">Active</label>
                    <div class="form-check form-switch mt-1">
                        <input class="form-check-input" type="checkbox" checked>
                    </div>
                </div>
            </div>
            <div class="mt-2 text-end">
                <button class="btn btn-sm btn-outline-danger" onclick="removeContactItem(this)"><i class="bi bi-trash"></i> Remove</button>
            </div>
        </div>
    `;
    container.innerHTML += newItem;
}

function addExploreLink() {
    const container = document.getElementById('exploreLinksEditor');
    const newItem = `
        <div class="link-item-row mb-3 p-3 border rounded">
            <div class="row g-2">
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Link Title</label>
                    <input type="text" class="form-control form-control-sm link-title" placeholder="Link title">
                </div>
                <div class="col-md-5">
                    <label class="form-label small fw-bold">URL</label>
                    <input type="text" class="form-control form-control-sm link-url" placeholder="#section or https://...">
                </div>
                <div class="col-md-2">
                    <label class="form-label small fw-bold">Type</label>
                    <select class="form-select form-select-sm link-type">
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                    </select>
                </div>
                <div class="col-md-1">
                    <label class="form-label small fw-bold">Active</label>
                    <div class="form-check form-switch mt-1">
                        <input class="form-check-input link-active" type="checkbox" checked>
                    </div>
                </div>
            </div>
            <div class="mt-2 d-flex justify-content-between align-items-center">
                <div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="moveLinkUp(this)"><i class="bi bi-arrow-up"></i></button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="moveLinkDown(this)"><i class="bi bi-arrow-down"></i></button>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeExploreLink(this)"><i class="bi bi-trash"></i> Remove</button>
            </div>
        </div>
    `;
    container.innerHTML += newItem;
}

function addPolicyLink() {
    const container = document.getElementById('policyLinksEditor');
    const newItem = `
        <div class="policy-item-row mb-3 p-3 border rounded">
            <div class="row g-2">
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Policy Title</label>
                    <input type="text" class="form-control form-control-sm policy-title" placeholder="Policy title">
                </div>
                <div class="col-md-5">
                    <label class="form-label small fw-bold">URL</label>
                    <input type="text" class="form-control form-control-sm policy-url" placeholder="#section or https://...">
                </div>
                <div class="col-md-2">
                    <label class="form-label small fw-bold">Type</label>
                    <select class="form-select form-select-sm policy-type">
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                    </select>
                </div>
                <div class="col-md-1">
                    <label class="form-label small fw-bold">Active</label>
                    <div class="form-check form-switch mt-1">
                        <input class="form-check-input policy-active" type="checkbox" checked>
                    </div>
                </div>
            </div>
            <div class="mt-2 d-flex justify-content-between align-items-center">
                <div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="movePolicyUp(this)"><i class="bi bi-arrow-up"></i></button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="movePolicyDown(this)"><i class="bi bi-arrow-down"></i></button>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removePolicyLink(this)"><i class="bi bi-trash"></i> Remove</button>
            </div>
        </div>
    `;
    container.innerHTML += newItem;
}

function addSocialPlatform() {
    const container = document.getElementById('socialMediaEditor');
    const newItem = `
        <div class="social-item-row mb-3 p-3 border rounded">
            <div class="row g-2 align-items-center">
                <div class="col-md-3">
                    <label class="form-label small fw-bold">Platform Name</label>
                    <input type="text" class="form-control form-control-sm platform-name" placeholder="Facebook">
                </div>
                <div class="col-md-5">
                    <label class="form-label small fw-bold">Platform URL</label>
                    <input type="url" class="form-control form-control-sm platform-url" placeholder="https://...">
                </div>
                <div class="col-md-2">
                    <label class="form-label small fw-bold">Icon Class</label>
                    <input type="text" class="form-control form-control-sm platform-icon" placeholder="bi-facebook">
                </div>
                <div class="col-md-1">
                    <label class="form-label small fw-bold">Active</label>
                    <div class="form-check form-switch mt-1">
                        <input class="form-check-input platform-active" type="checkbox" checked>
                    </div>
                </div>
                <div class="col-md-1">
                    <label class="form-label small fw-bold">Actions</label>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-secondary" onclick="moveSocialUp(this)"><i class="bi bi-arrow-up"></i></button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="moveSocialDown(this)"><i class="bi bi-arrow-down"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeSocialPlatform(this)"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.innerHTML += newItem;
}

// Remove Functions
function removeContactItem(btn) {
    btn.closest('.contact-item-row').remove();
}

function removeExploreLink(btn) {
    btn.closest('.link-item-row').remove();
}

function removePolicyLink(btn) {
    btn.closest('.policy-item-row').remove();
}

function removeSocialPlatform(btn) {
    btn.closest('.social-item-row').remove();
}

// Move Functions (reordering)
function moveLinkUp(btn) {
    const row = btn.closest('.link-item-row');
    const prev = row.previousElementSibling;
    if (prev) row.parentNode.insertBefore(row, prev);
}

function moveLinkDown(btn) {
    const row = btn.closest('.link-item-row');
    const next = row.nextElementSibling;
    if (next) row.parentNode.insertBefore(next, row);
}

function movePolicyUp(btn) {
    const row = btn.closest('.policy-item-row');
    const prev = row.previousElementSibling;
    if (prev) row.parentNode.insertBefore(row, prev);
}

function movePolicyDown(btn) {
    const row = btn.closest('.policy-item-row');
    const next = row.nextElementSibling;
    if (next) row.parentNode.insertBefore(next, row);
}

function moveSocialUp(btn) {
    const row = btn.closest('.social-item-row');
    const prev = row.previousElementSibling;
    if (prev) row.parentNode.insertBefore(row, prev);
}

function moveSocialDown(btn) {
    const row = btn.closest('.social-item-row');
    const next = row.nextElementSibling;
    if (next) row.parentNode.insertBefore(next, row);
}

// Update contact icon based on type
function updateContactIcon(select) {
    const row = select.closest('.contact-item-row');
    const iconInput = row.querySelector('.contact-icon');
    const type = select.value;
    
    const icons = {
        'address': 'bi-geo-alt',
        'phone': 'bi-telephone',
        'email': 'bi-envelope'
    };
    
    iconInput.value = icons[type] || 'bi-info-circle';
}

// Save Functions
async function saveFooterBrandSettings() {
    try {
        const settings = {
            footer_title: document.getElementById('footerBrandTitle').value,
            footer_description: document.getElementById('footerBrandDescription').value,
            footer_copyright: document.getElementById('footerBrandCopyright').value,
            footer_certifications: document.getElementById('footerBrandCertifications').value,
            developer_name: document.getElementById('developerName').value,
            developer_website: document.getElementById('developerWebsite').value,
            developer_linkedin: document.getElementById('developerLinkedin').value
        };

        // In production, this would be an API call
        console.log('Saving footer brand settings:', settings);
        
        showAlert('success', 'Footer brand settings saved successfully!');
    } catch (error) {
        console.error('Error saving footer brand settings:', error);
        showAlert('error', 'Failed to save footer brand settings');
    }
}

// Helper function to show alerts
function showAlert(type, message) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Mock API functions (to be replaced with actual API calls)
async function fetchFooterSettings() {
    // Mock data - replace with actual API call
    return {
        footer_title: 'CINNAMON HERITAGE',
        footer_description: 'Premium Ceylon Cinnamon straight from our family estate in Galle, Sri Lanka.',
        footer_copyright: '© 2026 CINNAMON HERITAGE. ALL RIGHTS RESERVED.',
        footer_certifications: '100% Organic • Pure Ceylon • ISO 22000 • HACCP',
        developer_name: 'Malitha Tishamal',
        developer_website: 'https://www.malithatishamal.42web.io',
        developer_linkedin: 'https://linkedin.com/in/malithatishamal'
    };
}

async function fetchFooterContact() {
    // Mock data - replace with actual API call
    return [
        { id: 1, contact_type: 'address', contact_value: 'Galle, Sri Lanka', icon_class: 'bi-geo-alt', is_active: 1 },
        { id: 2, contact_type: 'phone', contact_value: '+94 77 123 4567', icon_class: 'bi-telephone', is_active: 1 },
        { id: 3, contact_type: 'email', contact_value: 'info@cinnamonheritage.com', icon_class: 'bi-envelope', is_active: 1 }
    ];
}

async function fetchFooterLinks(type) {
    // Mock data - replace with actual API call
    if (type === 'explore') {
        return [
            { id: 1, link_title: 'Our Heritage', link_url: '#heritage', link_type: 'internal', is_active: 1 },
            { id: 2, link_title: 'Ceylon Cinnamon', link_url: '#ceylon-cinnamon', link_type: 'internal', is_active: 1 },
            { id: 3, link_title: 'Products', link_url: '#products', link_type: 'internal', is_active: 1 }
        ];
    } else {
        return [
            { id: 1, policy_title: 'Privacy Policy', policy_url: '#privacy', policy_type: 'internal', is_active: 1 },
            { id: 2, policy_title: 'Terms & Conditions', policy_url: '#terms', policy_type: 'internal', is_active: 1 }
        ];
    }
}

async function fetchSocialMedia() {
    // Mock data - replace with actual API call
    return [
        { id: 1, platform_name: 'Facebook', platform_url: 'https://facebook.com/cinnamonheritage', icon_class: 'bi-facebook', is_active: 1 },
        { id: 2, platform_name: 'Instagram', platform_url: 'https://instagram.com/cinnamonheritage', icon_class: 'bi-instagram', is_active: 1 },
        { id: 3, platform_name: 'LinkedIn', platform_url: 'https://linkedin.com/company/cinnamonheritage', icon_class: 'bi-linkedin', is_active: 1 }
    ];
}