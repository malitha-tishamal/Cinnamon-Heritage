// Footer Management - Dynamic Content Loading
// This script handles loading all footer content dynamically from the database

document.addEventListener('DOMContentLoaded', function() {
    loadFooterContent();
});

async function loadFooterContent() {
    try {
        // Load all footer data in parallel
        const [settings, contactInfo, exploreLinks, policyLinks, socialMedia] = await Promise.all([
            fetchFooterSettings(),
            fetchFooterContact(),
            fetchFooterLinks('explore'),
            fetchFooterLinks('policies'),
            fetchSocialMedia()
        ]);

        // Update DOM with loaded data
        updateFooterSettings(settings);
        updateFooterContact(contactInfo);
        updateFooterLinks('footerExploreLinks', exploreLinks);
        updateFooterLinks('footerPolicyLinks', policyLinks);
        updateSocialMedia(socialMedia);

    } catch (error) {
        console.error('Error loading footer content:', error);
        // Fallback to default values if API fails
        loadFallbackContent();
    }
}

async function fetchFooterSettings() {
    // In production, this would be an API call
    // For now, return mock data that matches the database structure
    return {
        footer_title: 'CINNAMON HERITAGE',
        footer_description: 'Premium Ceylon Cinnamon straight from our family estate in Galle, Sri Lanka. Discover authentic cinnamon, essential oils and unforgettable experiences inspired by Sri Lankan heritage.',
        footer_copyright: '© 2026 CINNAMON HERITAGE. ALL RIGHTS RESERVED.',
        footer_certifications: '100% Organic • Pure Ceylon • ISO 22000 • HACCP',
        developer_name: 'Malitha Tishamal',
        developer_website: 'https://www.malithatishamal.42web.io',
        developer_linkedin: 'https://linkedin.com/in/malithatishamal'
    };
}

async function fetchFooterContact() {
    // In production, this would be an API call
    return [
        {
            contact_type: 'address',
            contact_value: 'Galle, Sri Lanka',
            icon_class: 'bi-geo-alt',
            is_active: 1
        },
        {
            contact_type: 'phone',
            contact_value: '+94 77 123 4567',
            icon_class: 'bi-telephone',
            is_active: 1
        },
        {
            contact_type: 'email',
            contact_value: 'info@cinnamonheritage.com',
            icon_class: 'bi-envelope',
            is_active: 1
        }
    ];
}

async function fetchFooterLinks(type) {
    // In production, this would be an API call with type parameter
    if (type === 'explore') {
        return [
            { link_title: 'Our Heritage', link_url: '#heritage', link_type: 'internal', is_active: 1 },
            { link_title: 'Ceylon Cinnamon', link_url: '#ceylon-cinnamon', link_type: 'internal', is_active: 1 },
            { link_title: 'Products', link_url: '#products', link_type: 'internal', is_active: 1 },
            { link_title: 'Essential Oils', link_url: '#essential-oils', link_type: 'internal', is_active: 1 },
            { link_title: 'B2B Partnerships', link_url: '#b2b', link_type: 'internal', is_active: 1 },
            { link_title: 'Our Process', link_url: '#process', link_type: 'internal', is_active: 1 },
            { link_title: 'Quality & Responsibility', link_url: '#quality', link_type: 'internal', is_active: 1 },
            { link_title: 'Cinnamon Experience', link_url: '#experience', link_type: 'internal', is_active: 1 },
            { link_title: 'Contact', link_url: '#contact', link_type: 'internal', is_active: 1 }
        ];
    } else if (type === 'policies') {
        return [
            { policy_title: 'Privacy Policy', policy_url: '#privacy', policy_type: 'internal', is_active: 1 },
            { policy_title: 'Terms & Conditions', policy_url: '#terms', policy_type: 'internal', is_active: 1 },
            { policy_title: 'Shipping Policy', policy_url: '#shipping', policy_type: 'internal', is_active: 1 },
            { policy_title: 'Returns & Refunds', policy_url: '#returns', policy_type: 'internal', is_active: 1 },
            { policy_title: 'Essential-Oil Safety', policy_url: '#safety', policy_type: 'internal', is_active: 1 },
            { policy_title: 'Product Disclaimer', policy_url: '#disclaimer', policy_type: 'internal', is_active: 1 }
        ];
    }
    return [];
}

async function fetchSocialMedia() {
    // In production, this would be an API call
    return [
        { platform_name: 'Facebook', platform_url: 'https://facebook.com/cinnamonheritage', icon_class: 'bi-facebook', is_active: 1 },
        { platform_name: 'Instagram', platform_url: 'https://instagram.com/cinnamonheritage', icon_class: 'bi-instagram', is_active: 1 },
        { platform_name: 'LinkedIn', platform_url: 'https://linkedin.com/company/cinnamonheritage', icon_class: 'bi-linkedin', is_active: 1 },
        { platform_name: 'TikTok', platform_url: 'https://tiktok.com/@cinnamonheritage', icon_class: 'bi-tiktok', is_active: 1 },
        { platform_name: 'YouTube', platform_url: 'https://youtube.com/@cinnamonheritage', icon_class: 'bi-youtube', is_active: 1 },
        { platform_name: 'X (Twitter)', platform_url: 'https://twitter.com/cinnamonheritage', icon_class: 'bi-twitter-x', is_active: 1 }
    ];
}

function updateFooterSettings(settings) {
    // Update footer title
    const titleElement = document.getElementById('footerTitle');
    if (titleElement && settings.footer_title) {
        titleElement.innerHTML = settings.footer_title.replace('HERITAGE', '<span style="color: #d4873a;">HERITAGE</span>');
    }

    // Update footer description
    const descElement = document.getElementById('footerDescription');
    if (descElement && settings.footer_description) {
        descElement.textContent = settings.footer_description;
    }

    // Update copyright
    const copyrightElement = document.getElementById('footerCopyright');
    if (copyrightElement && settings.footer_copyright) {
        copyrightElement.textContent = settings.footer_copyright;
    }

    // Update certifications
    const certElement = document.getElementById('footerCertifications');
    if (certElement && settings.footer_certifications) {
        certElement.textContent = settings.footer_certifications;
    }

    // Update developer credits
    const developerWebsiteLink = document.getElementById('developerWebsiteLink');
    if (developerWebsiteLink && settings.developer_website && settings.developer_name) {
        developerWebsiteLink.href = settings.developer_website;
        developerWebsiteLink.textContent = `Designed & Developed by ${settings.developer_name}`;
    }

    const developerLinkedinLink = document.getElementById('developerLinkedinLink');
    if (developerLinkedinLink && settings.developer_linkedin) {
        developerLinkedinLink.href = settings.developer_linkedin;
    }
}

function updateFooterContact(contactInfo) {
    const contactContainer = document.getElementById('footerContactInfo');
    if (!contactContainer) return;

    contactContainer.innerHTML = '';

    contactInfo.forEach(item => {
        if (item.is_active) {
            const li = document.createElement('li');
            li.className = 'footer-contact-item';
            
            const icon = document.createElement('i');
            icon.className = `bi ${item.icon_class}`;
            
            const span = document.createElement('span');
            span.textContent = item.contact_value;
            
            li.appendChild(icon);
            li.appendChild(span);
            contactContainer.appendChild(li);
        }
    });
}

function updateFooterLinks(containerId, links) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    links.forEach(link => {
        if (link.is_active) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            
            // Use appropriate property name based on link type
            const title = link.link_title || link.policy_title;
            const url = link.link_url || link.policy_url;
            const type = link.link_type || link.policy_type;
            
            a.textContent = title;
            a.href = url;
            
            if (type === 'external') {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            
            li.appendChild(a);
            container.appendChild(li);
        }
    });
}

function updateSocialMedia(socialMedia) {
    const container = document.getElementById('footerSocialIcons');
    if (!container) return;

    container.innerHTML = '';

    socialMedia.forEach(platform => {
        if (platform.is_active) {
            const a = document.createElement('a');
            a.className = 'social-icon';
            a.href = platform.platform_url || '#';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.setAttribute('aria-label', platform.platform_name);
            
            const icon = document.createElement('i');
            icon.className = `bi ${platform.icon_class}`;
            
            a.appendChild(icon);
            container.appendChild(a);
        }
    });
}

function loadFallbackContent() {
    console.log('Loading fallback footer content');
    // This function loads hardcoded content if the API fails
    // The HTML already has basic fallback structure
}

// API integration helper functions (for future backend integration)
async function fetchFromAPI(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Example API calls (commented out until backend is ready)
/*
async function fetchFooterSettings() {
    return fetchFromAPI('/api/footer/settings');
}

async function fetchFooterContact() {
    return fetchFromAPI('/api/footer/contact');
}

async function fetchFooterLinks(type) {
    return fetchFromAPI(`/api/footer/links/${type}`);
}

async function fetchSocialMedia() {
    return fetchFromAPI('/api/footer/social-media');
}
*/