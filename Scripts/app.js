// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Config moved to Scripts/firebase-config.js

// References (using global window objects from firebase-config.js)
const database = window.database || firebase.database();
const productsRef = database.ref('products');
const settingsRef = database.ref('settings');

// ============================================
// ZERONUX STORE APPLICATION
// ============================================

// Currency conversion functionality
window.EXCHANGE_RATE = 9; // Default rate, will be loaded from Firebase
window.currentCurrency = localStorage.getItem('selectedCurrency') || 'USD';

// Keep local references for backward compatibility if needed within this file, 
// though using window.VAR is safer for external scripts.
let EXCHANGE_RATE = window.EXCHANGE_RATE;
let currentCurrency = window.currentCurrency;

// Global Contact Info
let CONTACT_NUMBER = '218924295050'; // Default
let FACEBOOK_URL = '';
let CONTACT_EMAIL = ''; // Will be loaded from Firebase

// Announcement Rotation Global
let announcementIntervalId = null;

// Helper to convert Firebase data (arrays or indexed objects) to clean Array
function toCleanArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') return Object.values(val);
    return [];
}

// ============================================
// DYNAMIC CATEGORIES TABS RENDERING
// ============================================
function renderCategoryTabs(categoriesData) {
    let categories = [];
    if (typeof categoriesData === 'string') {
        categories = categoriesData.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(categoriesData)) {
        categories = categoriesData.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof categoriesData === 'object' && categoriesData !== null) {
        categories = Object.values(categoriesData).map(s => String(s).trim()).filter(Boolean);
    }

    // Extract categories from loaded products if none specified in settings
    if (categories.length === 0 && window.allLoadedProducts && Object.keys(window.allLoadedProducts).length > 0) {
        const prodCats = new Set();
        Object.values(window.allLoadedProducts).forEach(p => {
            if (p && p.category && typeof p.category === 'string') {
                const c = p.category.trim();
                if (c && c.toLowerCase() !== 'all' && c !== 'الكل') prodCats.add(c);
            }
        });
        if (prodCats.size > 0) categories = Array.from(prodCats);
    }

    if (categories.length === 0) {
        categories = ['ملابس وأزياء', 'عطور وبخور', 'جينزات وسراويل', 'أحذية وإكسسوارات'];
    }

    // Check if category from URL is set
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    if (categoryFromUrl && currentCategoryFilter === 'all') {
        currentCategoryFilter = categoryFromUrl;
    }

    const containers = document.querySelectorAll('#categories-tabs, .categories-tabs, .catalog-filter-tabs');
    containers.forEach(container => {
        const isCatalogStyle = container.classList.contains('catalog-filter-tabs');

        let html = '';
        if (isCatalogStyle) {
            const isAllActive = currentCategoryFilter === 'all';
            html += `
                <button class="catalog-filter-btn ${isAllActive ? 'active' : ''}" data-category="all">
                    <span>✨</span> الكل
                </button>
            `;
            categories.forEach(cat => {
                const isActive = currentCategoryFilter.toLowerCase() === cat.toLowerCase();
                html += `
                    <button class="catalog-filter-btn ${isActive ? 'active' : ''}" data-category="${cat}">
                        <span>🏷️</span> ${cat}
                    </button>
                `;
            });
        } else {
            const isAllActive = currentCategoryFilter === 'all';
            html += `
                <button class="category-tab ${isAllActive ? 'active' : ''}" data-category="all">الكل</button>
            `;
            categories.forEach(cat => {
                const isActive = currentCategoryFilter.toLowerCase() === cat.toLowerCase();
                html += `
                    <button class="category-tab ${isActive ? 'active' : ''}" data-category="${cat}">${cat}</button>
                `;
            });
        }

        container.innerHTML = html;

        // Attach click listeners to all buttons
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const clickedCat = btn.getAttribute('data-category') || 'all';
                currentCategoryFilter = clickedCat;

                // Sync active state across all category buttons on the page
                document.querySelectorAll('#categories-tabs button, .categories-tabs button, .catalog-filter-tabs button').forEach(b => {
                    const bCat = b.getAttribute('data-category') || 'all';
                    b.classList.toggle('active', bCat.toLowerCase() === clickedCat.toLowerCase());
                });

                // Update active filter label if on catalog page
                const activeLabel = document.getElementById('catalog-active-filter-label');
                if (activeLabel) {
                    activeLabel.textContent = clickedCat === 'all' ? '' : `(التصنيف: ${clickedCat})`;
                }

                renderFilteredProducts();
            });
        });
    });
}

// Load settings (Exchange Rate, Contact Info, Homepage sections & Categories)
function loadSettings() {
    settingsRef.on('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            // 1. Update Exchange Rate
            if (settings.exchangeRate) {
                window.EXCHANGE_RATE = settings.exchangeRate;
                EXCHANGE_RATE = settings.exchangeRate; // Sync local var
                updatePrices(window.currentCurrency);
            }

            // 2. Update Phone Number
            if (settings.phoneNumber) {
                CONTACT_NUMBER = settings.phoneNumber;
                const cleanPhone = CONTACT_NUMBER.replace(/[^0-9]/g, '');

                // Dispatch event so other pages (like success.html) know
                document.dispatchEvent(new CustomEvent('contact-info-updated', {
                    detail: { phoneNumber: CONTACT_NUMBER }
                }));

                // Update Footer Text
                const footerPhonetext = document.getElementById('footer-phone-text');
                if (footerPhonetext) footerPhonetext.textContent = CONTACT_NUMBER;

                // Update WhatsApp Floating Button
                const whatsappBtn = document.getElementById('whatsapp-button');
                if (whatsappBtn) {
                    whatsappBtn.href = `https://wa.me/${cleanPhone}`;
                }

                // Update Support page WhatsApp Link & Card if on support page
                const supportWaCard = document.getElementById('support-whatsapp-card');
                const supportWaText = document.getElementById('support-whatsapp-text');
                if (supportWaCard) {
                    let userProfile = {};
                    try {
                        if (typeof getUserProfile === 'function') userProfile = getUserProfile() || {};
                    } catch (e) { }
                    const userName = userProfile.name ? `\n- اسم العميل: ${userProfile.name}` : '';
                    const userPhone = userProfile.phone ? `\n- رقم الهاتف: ${userProfile.phone}` : '';
                    const presetMsg = encodeURIComponent(
                        `مرحباً خدمة عملاء متجر New Desgin 💙\nأرغب في الحصول على مساعدة ودعم فني بخصوص الطلبات والمنتجات:${userName}${userPhone}\n- نوع الاستفسار: `
                    );
                    supportWaCard.href = `https://wa.me/${cleanPhone}?text=${presetMsg}`;
                    supportWaCard.target = '_blank';
                }
                if (supportWaText) {
                    supportWaText.textContent = `+${cleanPhone} (تواصل فوري)`;
                }
            }

            // 3. Update Facebook URL
            if (settings.facebookUrl) {
                FACEBOOK_URL = settings.facebookUrl;
                const fbLink = document.getElementById('footer-facebook-link');
                if (fbLink) {
                    fbLink.href = FACEBOOK_URL;
                    fbLink.style.display = 'inline-flex'; // Show if link exists
                }
            } else {
                // Hide if no link
                const fbLink = document.getElementById('footer-facebook-link');
                if (fbLink) fbLink.style.display = 'none';
            }

            // 4. Update Email
            if (settings.contactEmail) {
                CONTACT_EMAIL = settings.contactEmail; // Store globally
                const footerEmailText = document.getElementById('footer-email-text');
                if (footerEmailText) footerEmailText.textContent = settings.contactEmail;

                const supportEmailCard = document.getElementById('support-email-card');
                const supportEmailText = document.getElementById('support-email-text');
                if (supportEmailCard) {
                    supportEmailCard.href = `mailto:${settings.contactEmail}?subject=${encodeURIComponent('طلب دعم فني - متجر New Desgin')}`;
                }
                if (supportEmailText) {
                    supportEmailText.textContent = settings.contactEmail;
                }
            }

            // 4.1 Update Store Location & Footer Description (Footer)
            if (settings.storeLocation) {
                const footerLoc = document.getElementById('footer-location-text');
                if (footerLoc) footerLoc.textContent = settings.storeLocation;
            }
            if (settings.footerDescription || settings.footerDesc) {
                const footerDescEl = document.getElementById('footer-desc-text');
                if (footerDescEl) footerDescEl.textContent = settings.footerDescription || settings.footerDesc;
            }

            // 5. Update Hero Section
            if (settings.heroTitle) {
                const el = document.getElementById('hero-title-text');
                if (el) el.innerHTML = settings.heroTitle;
            }
            if (settings.heroSubtitle) {
                const el = document.getElementById('hero-subtitle-text');
                if (el) el.textContent = settings.heroSubtitle;
            }
            if (settings.heroDescription) {
                const el = document.getElementById('hero-desc-text');
                if (el) el.textContent = settings.heroDescription;
            }
            if (settings.heroImage) {
                const el = document.querySelector('.hero-image');
                if (el) el.src = settings.heroImage;
            }

            // 6. Update Categories
            renderCategoryTabs(settings.storeCategories || 'ملابس وأزياء, عطور وبخور, جينزات وسراويل, أحذية وإكسسوارات');

            // 6.1 Update Category Showcase Cards (Homepage)
            const catSection = document.getElementById('categories-showcase');
            if (catSection) {
                const cardsList = toCleanArray(settings.categoryCards);
                const visibleCards = cardsList.filter(c => c && c.enabled !== false);

                if (settings.categoryCardsEnabled === false || (settings.categoryCards !== undefined && visibleCards.length === 0)) {
                    catSection.style.display = 'none';
                } else {
                    catSection.style.display = 'block';
                    if (settings.categoryCardsTitle) {
                        const titleEl = catSection.querySelector('.section-title');
                        if (titleEl) titleEl.textContent = settings.categoryCardsTitle;
                    }
                    if (settings.categoryCardsSubtitle !== undefined) {
                        const subEl = catSection.querySelector('.section-subtitle');
                        if (subEl) subEl.textContent = settings.categoryCardsSubtitle;
                    }

                    if (visibleCards.length > 0) {
                        const grid = catSection.querySelector('.category-showcase-grid');
                        if (grid) {
                            grid.innerHTML = visibleCards.map(card => `
                                <a href="${card.link || 'products.html'}" class="category-card">
                                    <img src="${card.image || 'Images/Logo-text.png'}" alt="${card.title || ''}" class="category-card-bg" style="${card.fit === 'contain' ? `object-fit: contain; background: ${card.bgColor || '#0b132b'}; padding: 2rem;` : ''}">
                                    <div class="category-card-overlay"></div>
                                    <div class="category-card-content">
                                        ${card.tag ? `<span class="category-card-tag">${card.tag}</span>` : ''}
                                        <h3 class="category-card-title">${card.title || ''}</h3>
                                        ${card.desc ? `<p class="category-card-desc">${card.desc}</p>` : ''}
                                        <span class="category-card-btn">
                                            ${card.btnText || 'استكشف التشكيلة ←'}
                                        </span>
                                    </div>
                                </a>
                            `).join('');
                        }
                    }
                }
            }

            // 6.2 Update Trust & Highlights Section (Homepage)
            const trustSection = document.querySelector('.trust-section');
            if (trustSection) {
                const trustList = toCleanArray(settings.trustCards);
                const visibleTrust = trustList.filter(c => c && c.enabled !== false);

                if (settings.trustSectionEnabled === false || (settings.trustCards !== undefined && visibleTrust.length === 0)) {
                    trustSection.style.display = 'none';
                } else {
                    trustSection.style.display = 'block';
                    if (visibleTrust.length > 0) {
                        const trustGrid = trustSection.querySelector('.trust-grid');
                        if (trustGrid) {
                            trustGrid.innerHTML = visibleTrust.map(item => `
                                <div class="trust-card">
                                    <div class="trust-icon-wrap">${item.icon || '✨'}</div>
                                    <h3 class="trust-title">${item.title || ''}</h3>
                                    <p class="trust-desc">${item.desc || ''}</p>
                                </div>
                            `).join('');
                        }
                    }
                }
            }

            // 7. Update Announcement Bar
            const announcementBar = document.getElementById('announcement-bar');
            if (announcementBar) {
                if (announcementIntervalId) {
                    clearInterval(announcementIntervalId);
                    announcementIntervalId = null;
                }

                if (settings.announcementEnabled) {
                    let announcements = toCleanArray(settings.announcements);

                    // Legacy support / Fallback
                    if (announcements.length === 0 && settings.announcementText) {
                        announcements = [{
                            text: settings.announcementText,
                            backgroundColor: '#0ea5e9',
                            textColor: '#ffffff'
                        }];
                    }

                    if (announcements.length > 0) {
                        startAnnouncementRotation(announcements, settings.announcementInterval || 5);
                        announcementBar.style.display = 'block';
                    } else {
                        announcementBar.style.display = 'none';
                    }
                } else {
                    announcementBar.style.display = 'none';
                }
            }

            // 8. Check Maintenance Mode
            if (settings.maintenanceEnabled) {
                showMaintenanceMode(settings.maintenancePreset, settings.maintenanceCustomMessage);
            }

            // 9. Apply Theme Settings
            if (settings.theme) {
                const root = document.documentElement;
                let primary = settings.theme.primary;
                let secondary = settings.theme.secondary;
                let accent = settings.theme.accent;

                // If old legacy purple is detected, normalize to New Desgin Dark Blue & Light Blue
                if (primary === '#667eea' || !primary) primary = '#0ea5e9';
                if (secondary === '#f5576c' || !secondary) secondary = '#0284c7';
                if (accent === '#4facfe' || !accent) accent = '#38bdf8';

                root.style.setProperty('--primary', primary);
                root.style.setProperty('--secondary', secondary);
                root.style.setProperty('--accent', accent);
                root.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)`);
                root.style.setProperty('--secondary-gradient', `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)`);
                root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accent} 0%, #7dd3fc 100%)`);

                if (settings.theme.bgPrimary && settings.theme.bgPrimary !== '#0f0f1e') root.style.setProperty('--bg-primary', settings.theme.bgPrimary);
                if (settings.theme.bgSecondary && settings.theme.bgSecondary !== '#1a1a2e') root.style.setProperty('--bg-secondary', settings.theme.bgSecondary);
                if (settings.theme.textPrimary) root.style.setProperty('--text-primary', settings.theme.textPrimary);
                if (settings.theme.textSecondary) root.style.setProperty('--text-secondary', settings.theme.textSecondary);

                // 10. Check Seasonal Effects
                if (window.SeasonalEffects) {
                    const effectConfig = settings.theme.effectConfig || {};
                    if (!effectConfig.type && settings.theme.effect) {
                        effectConfig.type = settings.theme.effect;
                    }
                    window.SeasonalEffects.init(effectConfig);
                }
            }
        }
    });
}

function startAnnouncementRotation(announcements, intervalSeconds) {
    const announcementBar = document.getElementById('announcement-bar');
    const content = announcementBar.querySelector('.announcement-content') || announcementBar;

    let currentIndex = 0;

    const showAnnouncement = (index) => {
        const item = announcements[index];

        // Build HMTL
        let html = item.text;
        if (item.link) {
            html = `<a href="${item.link}" style="color: inherit; text-decoration: underline; text-underline-offset: 3px;">${item.text}</a>`;
        }

        // Apply styles with transitions
        announcementBar.style.transition = 'background-color 0.5s ease';
        announcementBar.style.backgroundColor = item.backgroundColor || '#667eea';
        announcementBar.style.color = item.textColor || '#ffffff';

        // Text transition (fade out -> change -> fade in)
        content.style.transition = 'opacity 0.3s ease';
        content.style.opacity = '0';

        setTimeout(() => {
            content.innerHTML = html;
            content.style.opacity = '1';
        }, 300);
    };

    // Show first one immediately
    showAnnouncement(0);

    // If more than one, start rotation
    if (announcements.length > 1) {
        announcementIntervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % announcements.length;
            showAnnouncement(currentIndex);
        }, intervalSeconds * 1000);
    }
}


// Currency formatting
function formatCurrency(amount, currency) {
    if (currency === 'USD') {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ل`;
    }
}

// Update all prices on the page
function updatePrices(currency) {
    const priceElements = document.querySelectorAll('.product-price');

    priceElements.forEach(priceEl => {
        const priceType = priceEl.dataset.priceType || 'fixed';

        // Skip non-numeric price types
        if (priceType === 'negotiable' || priceType === 'contact') return;

        if (priceType === 'range') {
            // Range prices are re-rendered on full reload, skip here
            return;
        }

        const usdPrice = parseFloat(priceEl.dataset.usd);

        let displayPrice;
        if (currency === 'USD') {
            displayPrice = formatCurrency(usdPrice, 'USD');
        } else {
            // Calculate LYD price dynamically using the exchange rate
            const lydPrice = usdPrice * EXCHANGE_RATE;
            displayPrice = formatCurrency(lydPrice, 'LYD');
        }

        // Animate price change
        priceEl.style.transform = 'scale(1.1)';
        setTimeout(() => {
            priceEl.textContent = displayPrice;
            priceEl.style.transform = 'scale(1)';
        }, 150);
    });
}

// Currency switcher functionality
function initCurrencySwitcher() {
    // Restore saved currency on page load
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency && savedCurrency !== 'USD') {
        // Update the active button in the header
        document.querySelectorAll('.currency-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.currency === savedCurrency);
        });
        // Apply saved currency prices
        window.currentCurrency = savedCurrency;
        currentCurrency = savedCurrency;
        updatePrices(window.currentCurrency);
        // Notify other scripts (e.g. students.js)
        document.dispatchEvent(new CustomEvent('currency-change', { detail: { currency: window.currentCurrency } }));
    }

    // Use event delegation for dynamically added header
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.currency-btn');
        if (!btn) return;

        // Remove active class from all buttons
        document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));

        // Update active class to clicked button
        btn.classList.add('active');

        // Update current currency
        window.currentCurrency = btn.dataset.currency;
        currentCurrency = window.currentCurrency; // Sync local

        // Save to localStorage for persistence
        localStorage.setItem('selectedCurrency', window.currentCurrency);

        // Update all prices
        updatePrices(window.currentCurrency);

        // Dispatch event for other scripts (like students.js)
        const event = new CustomEvent('currency-change', { detail: { currency: window.currentCurrency } });
        document.dispatchEvent(event);
    });
}

// Cart functionality moved to Scripts/cart.js

// Initialize cart on load
// Cart initialized in Scripts/cart.js

// Cart button initialized in Scripts/cart.js

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(7, 11, 20, 0.98))',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        color: '#f8fafc',
        padding: '0.85rem 1.4rem',
        borderRadius: '14px',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(14, 165, 233, 0.25)',
        zIndex: '100000',
        fontWeight: '600',
        fontSize: '0.95rem',
        fontFamily: "'Cairo', 'Inter', sans-serif",
        direction: 'rtl',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(10px)',
        webkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.25s ease-out',
        maxWidth: '340px'
    });

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Detailed add to cart and modal logic moved to Scripts/cart.js

// ============================================
// RECENTLY VIEWED PRODUCTS
// ============================================
const MAX_RECENTLY_VIEWED = 6;
let recentlyViewed = [];

// Load recently viewed from localStorage
function loadRecentlyViewed() {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
        try {
            recentlyViewed = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading recently viewed:', e);
            recentlyViewed = [];
        }
    }
}

// Save recently viewed to localStorage
function saveRecentlyViewed() {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
}

// Add product to recently viewed
function addToRecentlyViewed(productId, productData) {
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(item => item.id !== productId);

    // Add to front of array
    recentlyViewed.unshift({
        id: productId,
        name: productData.name,
        price: productData.price,
        image: productData.image,
        shortDesc: productData.shortDesc || productData.description?.substring(0, 60) + '...'
    });

    // Keep only last MAX items
    if (recentlyViewed.length > MAX_RECENTLY_VIEWED) {
        recentlyViewed = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    }

    saveRecentlyViewed();
    updateRecentlyViewedCount();
}

// Render recently viewed section
function renderRecentlyViewed() {
    const container = document.getElementById('recently-viewed-container');
    const section = document.getElementById('recently-viewed-section');

    if (!container || !section) return;

    if (recentlyViewed.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    let html = '';
    recentlyViewed.forEach(item => {
        const priceDisplay = currentCurrency === 'USD'
            ? formatCurrency(item.price, 'USD')
            : formatCurrency(item.price * EXCHANGE_RATE, 'LYD');

        html += `
            <div class="recently-viewed-item" onclick="showProductDetails('${item.id}')" style="cursor: pointer;">
                <div class="recently-viewed-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                </div>
                <div class="recently-viewed-info">
                    <h4>${item.name}</h4>
                    <span class="recently-viewed-price">${priceDisplay}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Update recently viewed count badge
function updateRecentlyViewedCount() {
    const badge = document.querySelector('.recently-viewed-count');
    if (badge) {
        badge.textContent = recentlyViewed.length;
        badge.style.display = recentlyViewed.length > 0 ? 'flex' : 'none';
    }
}

// Show recently viewed drawer
function showRecentlyViewedDrawer() {
    // Remove existing drawer if any
    const existing = document.querySelector('.recently-viewed-drawer');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'recently-viewed-drawer';

    let itemsHTML = '';
    if (recentlyViewed.length === 0) {
        itemsHTML = `
            <div class="empty-recently-viewed" style="text-align: center; padding: 3rem 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🕐</div>
                <h3 style="color: white; margin-bottom: 0.5rem;">لا توجد منتجات</h3>
                <p style="color: rgba(255,255,255,0.6);">لم تشاهد أي منتجات بعد</p>
            </div>
        `;
    } else {
        recentlyViewed.forEach(item => {
            const priceDisplay = currentCurrency === 'USD'
                ? formatCurrency(item.price, 'USD')
                : formatCurrency(item.price * EXCHANGE_RATE, 'LYD');

            itemsHTML += `
                <div class="recently-viewed-drawer-item" onclick="document.querySelector('.recently-viewed-drawer').remove(); showProductDetails('${item.id}');">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60?text=No+Image'">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <span class="price">${priceDisplay}</span>
                    </div>
                </div>
            `;
        });
    }

    overlay.innerHTML = `
        <div class="drawer-content">
            <div class="drawer-header">
                <h3>🕐 شاهدت مؤخراً</h3>
                <button class="close-drawer">&times;</button>
            </div>
            <div class="drawer-items">
                ${itemsHTML}
            </div>
            ${recentlyViewed.length > 0 ? `
                <button class="clear-recently-viewed" onclick="clearRecentlyViewed()">مسح السجل</button>
            ` : ''}
        </div>
    `;

    // Styles
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
        zIndex: '99999', display: 'flex', justifyContent: 'flex-end',
        animation: 'fadeIn 0.3s ease'
    });

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('.close-drawer').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// Clear recently viewed
function clearRecentlyViewed() {
    recentlyViewed = [];
    saveRecentlyViewed();
    updateRecentlyViewedCount();
    const drawer = document.querySelector('.recently-viewed-drawer');
    if (drawer) drawer.remove();
    showNotification('تم مسح السجل');
}

// Initialize recently viewed button
function initRecentlyViewedButton() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.recently-viewed-btn');
        if (btn) {
            e.preventDefault();
            showRecentlyViewedDrawer();
        }
    });
    updateRecentlyViewedCount();
}

// Initialize recently viewed on page load
// Initialize recently viewed on header load
// loadRecentlyViewed(); // Moved to initHeaderDependentFunctions

// ============================================
// WISHLIST FUNCTIONALITY
// ============================================
let wishlist = [];

// Load wishlist from localStorage
function loadWishlist() {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
        try {
            wishlist = JSON.parse(savedWishlist);
            updateWishlistCount();
        } catch (e) {
            console.error('Error loading wishlist:', e);
            wishlist = [];
        }
    }
}

// Save wishlist to localStorage
function saveWishlist() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Check if product is in wishlist
function isInWishlist(productId) {
    return wishlist.some(item => String(item.id) === String(productId));
}

// Toggle wishlist (add/remove)
window.toggleWishlist = function (productId, productData) {
    if (!productId) return;
    const index = wishlist.findIndex(item => String(item.id) === String(productId));

    if (index > -1) {
        // Remove from wishlist
        wishlist.splice(index, 1);
        saveWishlist();
        updateWishlistCount();
        updateWishlistHearts();
        if (typeof showNotification === 'function') {
            showNotification('تمت الإزالة من قائمة المفضلة 🤍', 'info');
        }
    } else {
        // Add to wishlist
        const itemObj = {
            id: String(productId),
            name: (productData && productData.name) || 'منتج',
            price: (productData && parseFloat(productData.price)) || 0,
            image: (productData && productData.image) || 'Images/Logo-noBG.png',
            description: (productData && productData.description) || ''
        };
        wishlist.push(itemObj);
        saveWishlist();
        updateWishlistCount();
        updateWishlistHearts();
        if (typeof showNotification === 'function') {
            showNotification('تمت الإضافة إلى قائمة المفضلة ❤️', 'success');
        }
    }
};

// Update wishlist count badge
function updateWishlistCount() {
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(wishlistBtn => {
        let badge = wishlistBtn.querySelector('.wishlist-count');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'wishlist-count';
            Object.assign(badge.style, {
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)'
            });
            wishlistBtn.style.position = 'relative';
            wishlistBtn.appendChild(badge);
        }
        badge.textContent = wishlist.length;
        badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
    });
}

// Update all wishlist heart icons on page
window.updateWishlistHearts = function () {
    const hearts = document.querySelectorAll('.wishlist-heart');
    hearts.forEach(heart => {
        const productId = heart.dataset.productId;
        if (isInWishlist(productId)) {
            heart.classList.add('active');
            heart.innerHTML = '❤️';
            heart.setAttribute('aria-label', 'إزالة من المفضلة');
            heart.title = 'إزالة من المفضلة';
        } else {
            heart.classList.remove('active');
            heart.innerHTML = '🤍';
            heart.setAttribute('aria-label', 'إضافة للمفضلة');
            heart.title = 'إضافة للمفضلة';
        }
    });
};

// Initialize wishlist button in navbar
let isWishlistBtnInitialized = false;
function initWishlistButton() {
    if (isWishlistBtnInitialized) return;
    isWishlistBtnInitialized = true;
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.wishlist-btn');
        if (btn) {
            e.preventDefault();
            showWishlistDrawer();
        }
    });
}

// Initialize wishlist heart buttons with global delegation
let isWishlistHeartsDelegated = false;
function initWishlistHearts() {
    if (!isWishlistHeartsDelegated) {
        isWishlistHeartsDelegated = true;
        document.addEventListener('click', (e) => {
            const heart = e.target.closest('.wishlist-heart');
            if (!heart) return;
            e.preventDefault();
            e.stopPropagation();

            const productId = heart.dataset.productId;
            if (!productId) return;

            const productData = {
                name: heart.dataset.productName || 'منتج',
                price: parseFloat(heart.dataset.productPrice) || 0,
                image: heart.dataset.productImage || 'Images/Logo-noBG.png',
                description: heart.dataset.productDesc || ''
            };
            window.toggleWishlist(productId, productData);
        });
    }
    window.updateWishlistHearts();
}

// Move item from wishlist to cart
function moveToCart(productId) {
    const item = wishlist.find(i => i.id === productId);
    if (item) {
        addToCart(item.name, item.price, item.image, item.description, item.id);
        // Remove from wishlist
        const index = wishlist.findIndex(i => i.id === productId);
        if (index > -1) {
            wishlist.splice(index, 1);
            saveWishlist();
            updateWishlistCount();
            updateWishlistHearts();
        }
        // Refresh drawer
        const drawer = document.querySelector('.wishlist-drawer-overlay');
        if (drawer) {
            drawer.remove();
            showWishlistDrawer();
        }
    }
}

// Show wishlist drawer/modal
function showWishlistDrawer() {
    // Prevent multiple instances
    if (document.querySelector('.wishlist-drawer-overlay')) {
        document.querySelector('.wishlist-drawer-overlay').remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'wishlist-drawer-overlay';

    const drawer = document.createElement('div');
    drawer.className = 'wishlist-drawer';

    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out'
    });

    Object.assign(drawer.style, {
        background: 'linear-gradient(145deg, rgba(11, 19, 43, 0.98), rgba(7, 11, 20, 0.98))',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '24px',
        padding: '2rem',
        maxWidth: '480px',
        width: '95%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(14, 165, 233, 0.2)',
        animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        direction: 'rtl',
        color: '#fff'
    });

    let contentHTML = '';

    if (wishlist.length === 0) {
        contentHTML = `
            <span class="close-wishlist-btn" style="position:absolute; top:15px; right:20px; font-size:28px; cursor:pointer;">&times;</span>
            <div class="empty-wishlist" style="text-align: center; padding: 4rem 1rem;">
                <div style="font-size: 5rem; margin-bottom: 1.5rem; animation: float 3s ease-in-out infinite;">🔖</div>
                <h3 style="font-size: 1.6rem; margin-bottom: 0.5rem; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">قائمة المفضلة فارغة</h3>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 2.5rem; font-size: 0.95rem;">لم تقم بإضافة أي منتجات للقائمة بعد.<br>اضغط على 🔖 لحفظ المنتجات المفضلة!</p>
                <button class="btn btn-primary" onclick="document.querySelector('.wishlist-drawer-overlay').remove()" style="padding: 14px 35px; border-radius: 50px; background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);">
                    تصفح المنتجات 🛍️
                </button>
            </div>
        `;
    } else {
        let itemsHTML = '';
        wishlist.forEach(item => {
            const itemPriceDisplay = currentCurrency === 'USD' ? item.price : (item.price * EXCHANGE_RATE);
            itemsHTML += `
                <div class="wishlist-item" style="display: flex; gap: 1rem; padding: 1rem; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 16px; margin-bottom: 1rem; align-items: center;">
                    <div style="width: 70px; height: 70px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,0.05);">
                        <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: white; margin-bottom: 0.25rem;">${item.name}</div>
                        <div style="color: #38bdf8; font-weight: 700;">${formatCurrency(itemPriceDisplay, currentCurrency)}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button onclick="moveToCart('${item.id}')" style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); border: none; color: white; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; box-shadow: 0 4px 10px rgba(14, 165, 233, 0.3);">
                            🛒 أضف للسلة
                        </button>
                        <button onclick="removeFromWishlist('${item.id}')" style="background: rgba(245, 87, 108, 0.15); border: 1px solid rgba(245, 87, 108, 0.4); color: #f87171; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">
                            إزالة
                        </button>
                    </div>
                </div>
            `;
        });

        contentHTML = `
            <span class="close-wishlist-btn" style="position:absolute; top:15px; right:20px; font-size:28px; cursor:pointer;">&times;</span>
            <h2 style="margin-top: 0; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>🔖</span> Wishlist
                <span style="font-size: 0.9rem; color: rgba(255,255,255,0.5);">(${wishlist.length})</span>
            </h2>
            <div class="wishlist-items">
                ${itemsHTML}
            </div>
        `;
    }

    drawer.innerHTML = contentHTML;
    drawer.style.position = 'relative';

    // Close button listener
    setTimeout(() => {
        const closeBtn = drawer.querySelector('.close-wishlist-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => overlay.remove());
        }
    }, 0);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    overlay.appendChild(drawer);
    document.body.appendChild(overlay);
}

// Remove from wishlist (called from drawer)
function removeFromWishlist(productId) {
    const index = wishlist.findIndex(item => item.id === productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        saveWishlist();
        updateWishlistCount();
        updateWishlistHearts();
        showNotification('تمت الإزالة من القائمة 📑');
        // Refresh drawer
        const drawer = document.querySelector('.wishlist-drawer-overlay');
        if (drawer) {
            drawer.remove();
            if (wishlist.length > 0) {
                showWishlistDrawer();
            }
        }
    }
}

// Initialize wishlist on page load
loadWishlist();

// Initialize add to cart buttons via Scripts/cart.js
function refreshAddToCartButtons() {
    if (typeof window.initAddToCartButtons === 'function') {
        window.initAddToCartButtons();
    }
}

/* Cart Modal Logic moved to Scripts/cart.js */

// Discount and Order logic moved to Scripts/cart.js

function closeModal(overlay) {
    overlay.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        overlay.remove();
    }, 300);
}

// Newsletter form
// Newsletter logic moved to Scripts/newsletter.js
function initNewsletterForm() {
    // Disabled in favor of Scripts/newsletter.js
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');

            // Only intercept internal links for smooth scrolling
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar

                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });

                    // Update active link
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return; // Exit if navbar not found

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 15, 30, 0.95)';
            navbar.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
        } else {
            navbar.style.background = 'rgba(15, 15, 30, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Product card animation on scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// Add dynamic animations to CSS
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .cart-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .cart-modal-header h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.75rem;
            margin: 0;
        }
        
        .close-modal-btn {
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: background 0.2s ease;
        }
        
        .close-modal-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .cart-items {
            margin-bottom: 1.5rem;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .cart-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            margin-bottom: 0.75rem;
        }
        
        .cart-item-name {
            flex: 1;
            font-weight: 600;
        }
        
        .cart-item-price {
            font-weight: 700;
            color: #667eea;
        }
        
        .remove-item-btn {
            padding: 0.5rem 1rem;
            background: rgba(245, 87, 108, 0.2);
            border: 1px solid #f5576c;
            border-radius: 6px;
            color: #f5576c;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        
        .remove-item-btn:hover {
            background: #f5576c;
            color: white;
        }
        
        .cart-total {
            display: flex;
            justify-content: space-between;
            padding: 1.5rem 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
        }
        
        .cart-actions {
            display: flex;
            gap: 1rem;
        }
        
        .cart-actions .btn {
            flex: 1;
        }
    `;
    document.head.appendChild(style);
}

// Product details routing - Navigate directly to dedicated product page
function showProductDetails(productId) {
    if (!productId) return;
    const isAlreadyOnProductPage = window.location.pathname.includes('product.html');
    const currentParamId = new URLSearchParams(window.location.search).get('id') || new URLSearchParams(window.location.search).get('product');
    if (isAlreadyOnProductPage && (currentParamId === String(productId) || !currentParamId)) {
        return; // Already on this page, do not reload!
    }
    window.location.href = `product.html?id=${encodeURIComponent(productId)}`;
}

// Initialize product card click handlers
function initProductCardClick() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.onclick = (e) => {
            if (!e.target.closest('.add-to-cart-btn') && !e.target.closest('.wishlist-heart') && !e.target.closest('.product-link-icon-btn') && !e.target.closest('.share-btn')) {
                const productId = card.dataset.productId;
                if (productId) {
                    showProductDetails(productId);
                }
            }
        };
    });
}

// About modal
function showAboutModal() {
    const overlay = document.createElement('div');
    overlay.className = 'about-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'about-modal';

    modal.innerHTML = `
        <div class="about-modal-header">
            <h2>من نحن</h2>
            <button class="close-modal-btn">&times;</button>
        </div>
        <div class="about-modal-body">
            <div class="about-description">
                <p>نحن متجر زيرونكس، واجهتك الأولى للحصول على أفضل المنتجات الرقمية والاشتراكات العالمية بأسعار منافسة في ليبيا. نسعى دائماً لتقديم خدمة موثوقة وسريعة لعملائنا.</p>
            </div>
            
            <div class="about-contact">
                <h3>معلومات التواصل</h3>
                
                <div class="contact-item">
                    <div class="contact-icon">📱</div>
                    <div class="contact-details">
                        <strong>الهاتف</strong>
                        <a href="tel:${CONTACT_NUMBER}">+${CONTACT_NUMBER}</a>
                    </div>
                </div>
                
                <div class="contact-item">
                    <div class="contact-icon">📍</div>
                    <div class="contact-details">
                        <strong>الموقع</strong>
                        <p>ليبيا، طرابلس (متجر إلكتروني)</p>
                    </div>
                </div>
                
                <div class="contact-item" style="display: ${FACEBOOK_URL ? 'flex' : 'none'}">
                    <div class="contact-icon">👤</div>
                    <div class="contact-details">
                        <strong>فيسبوك</strong>
                        <a href="${FACEBOOK_URL || '#'}" target="_blank">تواصل معنا عبر فيسبوك</a>
                    </div>
                </div>
                
                <div class="contact-item">
                    <div class="contact-icon">🛟</div>
                    <div class="contact-details">
                        <strong>الدعم الفني</strong>
                        <p>متواجدون لخدمتكم على مدار الساعة</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
        background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', zIndex: '10000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out', padding: '1rem', overflowY: 'auto'
    });

    Object.assign(modal.style, {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px',
        maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto',
        animation: 'slideInUp 0.3s ease-out', direction: 'rtl'
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Styles for about modal
    const aboutStyles = document.createElement('style');
    aboutStyles.textContent = `
        .about-modal-header { padding: 2rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; }
        .about-modal-header h2 { font-family: 'Outfit', sans-serif; font-size: 2rem; margin: 0; }
        .about-modal-body { padding: 2rem; }
        .about-description { margin-bottom: 2rem; }
        .about-description p { font-size: 1.125rem; line-height: 1.8; color: rgba(255, 255, 255, 0.8); margin: 0; }
        .about-contact h3 { font-family: 'Outfit', sans-serif; font-size: 1.5rem; margin-bottom: 1.5rem; }
        .contact-item { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin-bottom: 1rem; transition: all 0.2s ease; }
        .contact-item:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(102, 126, 234, 0.5); }
        .contact-icon { font-size: 2rem; min-width: 40px; }
        .contact-details { flex: 1; }
        .contact-details strong { display: block; font-size: 1rem; margin-bottom: 0.25rem; color: rgba(255, 255, 255, 0.9); }
        .contact-details p { margin: 0; color: rgba(255, 255, 255, 0.7); }
        .contact-details a { color: #4facfe; text-decoration: none; transition: color 0.2s ease; }
        .contact-details a:hover { color: #667eea; text-decoration: underline; }
    `;
    document.head.appendChild(aboutStyles);

    const closeBtn = modal.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', () => closeModal(overlay));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
}

function initAboutLink() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href').endsWith('#about')) {
            e.preventDefault();
            showAboutModal();
        }
    });
}

// Contact modal
function showContactModal() {
    const overlay = document.createElement('div');
    overlay.className = 'contact-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'contact-modal';

    modal.innerHTML = `
        <div class="contact-modal-header">
            <h2>تواصل معنا</h2>
            <button class="close-modal-btn">&times;</button>
        </div>
        <div class="contact-modal-body">
            <div class="contact-description">
                <p>هل لديك استفسار؟ نحن هنا للمساعدة، يمكنك مراسلتنا مباشرة.</p>
            </div>
            
            <form class="contact-form">
                <div class="form-group">
                    <label>الاسم</label>
                    <input type="text" class="form-input" placeholder="أدخل اسمك الكريم" required>
                </div>
                
                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" class="form-input" placeholder="example@email.com" required>
                </div>
                
                <div class="form-group">
                    <label>الرسالة</label>
                    <textarea class="form-textarea" placeholder="كيف يمكننا مساعدتك؟" rows="5" required></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary contact-submit">إرسال الرسالة</button>
            </form>
            
            <div class="contact-divider">
                <span>أو تواصل مباشرة</span>
            </div>
            
            <div class="contact-direct">
                <a href="tel:${CONTACT_NUMBER}" class="contact-link">
                    <div class="contact-link-icon">📱</div>
                    <div class="contact-link-text">
                        <strong>اتصل بنا</strong>
                        <span>+${CONTACT_NUMBER}</span>
                    </div>
                </a>
                
                <a href="${FACEBOOK_URL || '#'}" target="_blank" class="contact-link" style="display: ${FACEBOOK_URL ? 'flex' : 'none'}">
                    <div class="contact-link-icon">👤</div>
                    <div class="contact-link-text">
                        <strong>فيسبوك</strong>
                        <span>تواصل معنا عبر فيسبوك</span>
                    </div>
                </a>
            </div>
        </div>
    `;

    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
        background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', zIndex: '10000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out', padding: '1rem', overflowY: 'auto'
    });

    Object.assign(modal.style, {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px',
        maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto',
        animation: 'slideInUp 0.3s ease-out', direction: 'rtl'
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const contactStyles = document.createElement('style');
    contactStyles.textContent = `
        .contact-modal-header { padding: 2rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; }
        .contact-modal-header h2 { font-family: 'Outfit', sans-serif; font-size: 2rem; margin: 0; }
        .contact-modal-body { padding: 2rem; }
        .contact-description { margin-bottom: 2rem; }
        .contact-description p { font-size: 1.125rem; line-height: 1.8; color: rgba(255, 255, 255, 0.8); margin: 0; }
        .contact-form { margin-bottom: 2rem; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: rgba(255, 255, 255, 0.9); }
        .form-input, .form-textarea { width: 100%; padding: 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: white; font-family: inherit; font-size: 1rem; transition: all 0.2s ease; }
        .form-input:focus, .form-textarea:focus { outline: none; border-color: #667eea; background: rgba(255, 255, 255, 0.08); box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        .form-input::placeholder, .form-textarea::placeholder { color: rgba(255, 255, 255, 0.4); }
        .form-textarea { resize: vertical; min-height: 120px; }
        .contact-submit { width: 100%; padding: 1rem 2rem; font-size: 1.125rem; }
        .contact-divider { text-align: center; margin: 2rem 0; position: relative; }
        .contact-divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255, 255, 255, 0.1); }
        .contact-divider span { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 0 1rem; position: relative; color: rgba(255, 255, 255, 0.6); }
        .contact-direct { display: flex; flex-direction: column; gap: 1rem; }
        .contact-link { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; text-decoration: none; transition: all 0.2s ease; }
        .contact-link:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(102, 126, 234, 0.5); }
        .contact-link-icon { font-size: 2rem; min-width: 40px; }
        .contact-link-text { display: flex; flex-direction: column; gap: 0.25rem; }
        .contact-link-text strong { color: rgba(255, 255, 255, 0.9); font-size: 1rem; }
        .contact-link-text span { color: #4facfe; font-size: 0.875rem; }
    `;
    document.head.appendChild(contactStyles);

    const closeBtn = modal.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', () => closeModal(overlay));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });

    const contactForm = modal.querySelector('.contact-form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;

        // Redirect to WhatsApp with message
        // Use global CONTACT_NUMBER
        const whatsappMessage = `📧 *New Message from ZeroNux Website*\n\n*Name:* ${name}\n*Email:* ${email}\n\n*Message:*\n${message}`;
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappURL = `https://wa.me/${CONTACT_NUMBER}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
        closeModal(overlay);
        showNotification(contact.messageSent);
    });
}

// Lightbox Functionality
window.openLightbox = function (imageUrl) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox-overlay';
    lightbox.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.95); z-index: 10001;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease; cursor: zoom-out;
    `;

    lightbox.innerHTML = `
        <img src="${imageUrl}" style="max-width: 95%; max-height: 95vh; object-fit: contain; border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.5); transform: scale(0.9); animation: zoomIn 0.3s forwards;">
        <button style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 30px; cursor: pointer;">&times;</button>
    `;

    lightbox.addEventListener('click', () => {
        lightbox.remove();
    });

    document.body.appendChild(lightbox);
};

// Add keyframes for lightbox if not exists
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes zoomIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}
`;
document.head.appendChild(styleSheet);


function initContactLink() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href').endsWith('#contact')) {
            e.preventDefault();
            showContactModal();
        }
    });
}

// Refund Policy Modal
function showRefundModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    `;

    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.style.display = 'flex';
        setTimeout(() => {
            successModal.classList.add('active');
        }, 10);
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 2.5rem;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        direction: rtl;
        color: white;
    `;

    modal.innerHTML = `
        <button class="close-modal-btn" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: white; font-size: 28px; cursor: pointer; line-height: 1;">&times;</button>
        
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔄</div>
            <h2 style="margin: 0; font-size: 2rem; background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">سياسة الاسترجاع والاستبدال</h2>
        </div>

        <div style="line-height: 1.8; font-size: 1rem;">
            <div style="background: rgba(14, 165, 233, 0.1); border-left: 4px solid #0ea5e9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <p style="margin: 0; color: rgba(255,255,255,0.9);">
                    <strong>في متجر New Desgin</strong>، نحرص دائماً على رضاكم التام وتقديم أرقى الملابس وأفخم العطور بأعلى معايير الجودة. نرجو قراءة شروط الاسترجاع السريعة أدناه.
                </p>
            </div>

            <h3 style="color: #38bdf8; margin-top: 1.5rem; margin-bottom: 1rem;">✅ مدة وشروط الاسترجاع</h3>
            <div style="background: rgba(14, 165, 233, 0.08); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <ul style="margin: 0; padding-right: 1.5rem;">
                    <li>مدة الاسترداد والاسترجاع هي <strong>3 أيام (تلاتة أيام)</strong> من تاريخ استلام الطلب.</li>
                    <li>يجب أن تكون المنتجات بحالتها الأصلية غير مستخدمة ومع كامل تغليفها وملحقاتها.</li>
                    <li>يتم التنسيق والموافقة السريعة على طلب الاسترجاع عبر الواتساب مباشرة.</li>
                </ul>
            </div>

            <h3 style="color: #38bdf8; margin-top: 1.5rem; margin-bottom: 1rem;">🚚 التوصيل وتأكيد الطلبات</h3>
            <div style="background: rgba(14, 165, 233, 0.08); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <ul style="margin: 0; padding-right: 1.5rem;">
                    <li><strong>داخل طرابلس:</strong> توصيل في نفس اليوم لجميع الطلبات.</li>
                    <li><strong>خارج طرابلس:</strong> توصيل سريع يستغرق من 2 إلى 3 أيام فقط.</li>
                    <li><strong>طرق الدفع:</strong> كاش (عند الاستلام) أو حوالة مصرفية / مالية.</li>
                    <li>يتم تأكيد الطلب بعد التواصل المباشر عبر الواتساب.</li>
                </ul>
            </div>

            <h3 style="color: #38bdf8; margin-top: 1.5rem; margin-bottom: 1rem;">💬 كيفية طلب الاسترجاع أو الاستفسار</h3>
            <div style="background: rgba(14, 165, 233, 0.08); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0;">
                    أي تواصل أو استفسار أو طلب استرجاع يتم مباشرة وسريعاً عبر:
                </p>
                <ul style="margin: 0.5rem 0 0 0; padding-right: 1.5rem;">
                    <li><strong>واتساب:</strong> <span id="refund-whatsapp" style="color: #38bdf8;"></span></li>
                    <li><strong>البريد الإلكتروني:</strong> <span id="refund-email" style="color: #38bdf8;"></span></li>
                </ul>
            </div>

            <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; margin-top: 1.5rem; text-align: center;">
                <p style="margin: 0; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    <strong>خدمة العملاء:</strong> فريقنا متواجد دائماً لخدمتكم والإجابة على أي استفسار عبر الواتساب! 💙
                </p>
            </div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Populate contact info
    setTimeout(() => {
        const whatsappSpan = document.getElementById('refund-whatsapp');
        const emailSpan = document.getElementById('refund-email');
        if (whatsappSpan) whatsappSpan.textContent = CONTACT_NUMBER || 'سيتم التحديث قريباً';
        if (emailSpan) emailSpan.textContent = CONTACT_EMAIL || 'سيتم التحديث قريباً';
    }, 0);

    // Close handlers
    const closeBtn = modal.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function initRefundLink() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href').endsWith('#refund')) {
            e.preventDefault();
            showRefundModal();
        }
    });
}

// Footer links handler
function initFooterLinks() {
    // About and Contact links in footer handled by initAboutLink and initContactLink now universally
    // But we might want specific scroll behavior? 
    // The previous implementation added showModal AND scrollToTop. 
    // The new initAboutLink shows modal.
    // Redundant listeners are okay, but cleaner to just have one set. 
    // Let's update this to just specific footer things if needed, or rely on universal.
    // However, to keep same behavior (scroll top), let's just make sure we don't double bind in a bad way.
    // Actually, let's just update the selectors to match what we have in footer.js (index.html#about)

    // Refund link
    const footerRefundLink = document.querySelector('.footer-section a[href$="#refund"]');

    // About/Contact are handled by initAboutLink/initContactLink above for the modal part. 
    // If we want to scroll to top as well:
    const footerModalLinks = document.querySelectorAll('.footer-section a[href$="#about"], .footer-section a[href$="#contact"]');
    footerModalLinks.forEach(link => {
        link.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    });

    if (footerRefundLink) {
        footerRefundLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRefundModal();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    // FAQ and Support links (WhatsApp)
    const footerWhatsAppLinks = document.querySelectorAll('.footer-whatsapp-link');
    footerWhatsAppLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Use global CONTACT_NUMBER
            const linkType = link.getAttribute('href');

            let message = '';
            if (linkType === '#footer-faq') {
                message = 'مرحباً، لدي استفسار بخصوص الأسئلة الشائعة.';
            } else if (linkType === '#footer-support') {
                message = 'مرحباً، أحتاج إلى مساعدة من الدعم الفني.';
            }

            const encodedMessage = encodeURIComponent(message);
            const whatsappURL = `https://wa.me/${CONTACT_NUMBER}?text=${encodedMessage}`;
            window.open(whatsappURL, '_blank');
        });
    });
}

// Logo click handler
function initLogoClick() {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Hero shop now button handler
function initHeroShopNow() {
    const shopNowBtn = document.querySelector('.hero-shop-now');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const productsSection = document.querySelector('#products');
            if (productsSection) {
                const offsetTop = productsSection.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    }
}

// ============================================
// LOAD PRODUCTS FROM FIREBASE
// ============================================
window.allLoadedProducts = {};

function loadProductsFromFirebase() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return; // Exit if not on products page

    // Show skeleton loading placeholders
    if (typeof showProductSkeletons === 'function') {
        showProductSkeletons('products-container', 6);
    } else {
        productsContainer.innerHTML = '<div class="loading-products" style="text-align:center;padding:3rem;color:#38bdf8;">جاري تحميل أحدث الملابس والعطور...</div>';
    }

    productsRef.on('value', (snapshot) => {
        const products = snapshot.val() || {};
        window.allLoadedProducts = products;
        productsContainer.innerHTML = '';

        if (Object.keys(products).length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products-message" style="text-align: center; width: 100%; grid-column: 1 / -1; padding: 4rem 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🛍️</div>
                    <h3 style="color: rgba(255, 255, 255, 0.8); font-size: 1.5rem; margin-bottom: 0.5rem;">جاري تحضير التشكيلات الجديدة</h3>
                    <p style="color: rgba(255, 255, 255, 0.5);">ترقبوا قريباً أحدث صيحات الملابس وأفخم العطور</p>
                </div>
            `;
            updateCatalogMeta(0);
            return;
        }

        // Render category tabs if still displaying loading state
        if (document.querySelector('.categories-loading')) {
            renderCategoryTabs();
        }

        renderFilteredProducts();

        // Re-initialize buttons and events
        refreshAddToCartButtons();
        initProductCardClick();
        initWishlistHearts();
        initWishlistButton();
        initRecentlyViewedButton();
        initCatalogControlListeners();

        // Check for product ID in URL (Deep Linking)
        const urlParams = new URLSearchParams(window.location.search);
        const productIdFromUrl = urlParams.get('product') || urlParams.get('id');
        const categoryFromUrl = urlParams.get('category');
        const searchFromUrl = urlParams.get('search');

        if (categoryFromUrl) {
            currentCategoryFilter = categoryFromUrl;
            document.querySelectorAll('#categories-tabs .category-tab, #categories-tabs .catalog-filter-btn').forEach(btn => {
                const cat = btn.getAttribute('data-category');
                btn.classList.toggle('active', cat === categoryFromUrl);
            });
            filterProductsByCategory(categoryFromUrl);
        }

        if (searchFromUrl) {
            const searchInput = document.getElementById('product-search');
            if (searchInput) {
                searchInput.value = searchFromUrl;
                searchInput.dispatchEvent(new Event('input'));
            }
        }

        if (!window.location.pathname.includes('product.html')) {
            if (productIdFromUrl && products[productIdFromUrl]) {
                setTimeout(() => {
                    showProductDetails(productIdFromUrl);
                }, 400);
            }
        }
    });
}

let currentCategoryFilter = 'all';
let currentSortOrder = 'featured';
let inStockOnly = false;

// Render all filtered and sorted products
function renderFilteredProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;

    productsContainer.innerHTML = '';
    const products = window.allLoadedProducts || {};

    let productEntries = Object.entries(products).filter(([id, p]) => p.visible !== false);

    // Filter by category
    if (currentCategoryFilter !== 'all') {
        const filterNorm = currentCategoryFilter.trim().toLowerCase();
        productEntries = productEntries.filter(([id, p]) => {
            const prodCat = (p.category || '').trim().toLowerCase();
            if (!prodCat) return false;
            if (prodCat === filterNorm) return true;
            if (filterNorm === 'clothes') {
                return prodCat.includes('cloth') || prodCat.includes('ملابس') || prodCat.includes('جينز') || prodCat.includes('jean') || prodCat.includes('shirt') || prodCat.includes('قميص');
            }
            if (filterNorm === 'perfumes') {
                return prodCat.includes('perfume') || prodCat.includes('عطر') || prodCat.includes('عطور') || prodCat.includes('بخور') || prodCat.includes('fragrance');
            }
            // Substring or token match for dynamic categories
            if (prodCat.includes(filterNorm) || filterNorm.includes(prodCat)) return true;
            const filterTokens = filterNorm.split(/[\s,،/&]+/).filter(w => w.length > 1);
            return filterTokens.some(token => prodCat.includes(token));
        });
    }

    // Filter by in-stock only
    if (inStockOnly) {
        productEntries = productEntries.filter(([id, p]) => {
            if (p.trackStock) {
                return (p.stock || 0) > 0;
            }
            return true;
        });
    }

    // Sort products
    if (currentSortOrder === 'price-asc') {
        productEntries.sort((a, b) => (a[1].price || 0) - (b[1].price || 0));
    } else if (currentSortOrder === 'price-desc') {
        productEntries.sort((a, b) => (b[1].price || 0) - (a[1].price || 0));
    } else if (currentSortOrder === 'name-asc') {
        productEntries.sort((a, b) => (a[1].name || '').localeCompare(b[1].name || '', 'ar'));
    }

    if (productEntries.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products-message" style="text-align: center; width: 100%; grid-column: 1 / -1; padding: 4rem 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <h3 style="color: rgba(255, 255, 255, 0.8); font-size: 1.4rem;">لا توجد منتجات تطابق اختيارك</h3>
                <p style="color: rgba(255, 255, 255, 0.5); margin-top: 0.5rem;">جرب اختيار تصنيف آخر أو إعادة ضبط الفلاتر</p>
            </div>
        `;
    } else {
        productEntries.forEach(([id, product]) => {
            const cardHTML = createProductCardHTML(id, product);
            productsContainer.innerHTML += cardHTML;
        });
    }

    updateCatalogMeta(productEntries.length);
    refreshAddToCartButtons();
    initProductCardClick();
    initWishlistHearts();
}

function updateCatalogMeta(count) {
    const countLabel = document.getElementById('catalog-count-label');
    if (countLabel) {
        countLabel.textContent = `تم العثور على ${count} منتج`;
    }
}

function initCatalogControlListeners() {
    const sortSelect = document.getElementById('catalog-sort-select');
    if (sortSelect && !sortSelect.dataset.listenerAttached) {
        sortSelect.dataset.listenerAttached = 'true';
        sortSelect.addEventListener('change', (e) => {
            currentSortOrder = e.target.value;
            renderFilteredProducts();
        });
    }

    const stockToggle = document.getElementById('in-stock-only-toggle');
    if (stockToggle && !stockToggle.dataset.listenerAttached) {
        stockToggle.dataset.listenerAttached = 'true';
        stockToggle.addEventListener('change', (e) => {
            inStockOnly = e.target.checked;
            renderFilteredProducts();
        });
    }

    // Catalog filter buttons
    document.querySelectorAll('#categories-tabs .catalog-filter-btn, #categories-tabs .category-tab').forEach(btn => {
        if (!btn.dataset.listenerAttached) {
            btn.dataset.listenerAttached = 'true';
            btn.addEventListener('click', () => {
                document.querySelectorAll('#categories-tabs .catalog-filter-btn, #categories-tabs .category-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategoryFilter = btn.getAttribute('data-category') || 'all';
                renderFilteredProducts();
            });
        }
    });
}

// Filter products by category
function filterProductsByCategory(category) {
    currentCategoryFilter = category;
    renderFilteredProducts();
}

// Copy Direct Product Link to Clipboard
window.copyProductLink = function (productId, e) {
    if (e) e.stopPropagation();
    const productUrl = window.location.origin + window.location.pathname.replace('index.html', 'products.html') + '?id=' + productId;
    navigator.clipboard.writeText(productUrl).then(() => {
        showNotification('تم نسخ رابط المنتج المباشر! 🔗');
    }).catch(() => {
        showNotification('تم فتح المنتج');
    });
};

// Create product card HTML from Firebase data
function createProductCardHTML(id, product) {
    const badgeMap = {
        'new': 'جديد',
        'limited': 'عرض محدود',
        'hot': 'الأكثر طلباً'
    };

    const badgeHTML = product.badge && product.badge !== 'none'
        ? `<div class="product-badge" data-badge="${product.badge}">${badgeMap[product.badge] || product.badge}</div>`
        : '';

    const categoryClass = product.category || 'clothes';

    // Flexible Pricing
    const priceType = product.priceType || 'fixed';
    let price = '';
    let isContactPrice = false;

    if (priceType === 'fixed') {
        price = currentCurrency === 'USD'
            ? `$${(product.price || 0).toFixed(2)}`
            : `${((product.price || 0) * EXCHANGE_RATE).toFixed(2)} د.ل`;
    } else if (priceType === 'range') {
        const min = product.priceMin || 0;
        const max = product.priceMax || 0;
        if (currentCurrency === 'USD') {
            price = `$${min.toFixed(2)} - $${max.toFixed(2)}`;
        } else {
            price = `${(min * EXCHANGE_RATE).toFixed(2)} - ${(max * EXCHANGE_RATE).toFixed(2)} د.ل`;
        }
        isContactPrice = true;
    } else if (priceType === 'negotiable') {
        price = '🤝 قابل للتفاوض';
        isContactPrice = true;
    } else if (priceType === 'contact') {
        price = '📞 تواصل للسعر';
        isContactPrice = true;
    }

    // Stock Management
    let stockBadge = '';
    let isOutOfStock = false;
    let addToCartDisabled = '';
    let buttonText = 'إضافة للسلة';

    if (product.trackStock) {
        const stock = product.stock || 0;
        const threshold = product.lowStockThreshold || 5;

        if (stock === 0) {
            stockBadge = '<div class="stock-badge out-of-stock">نفذ المخزون</div>';
            isOutOfStock = true;
            addToCartDisabled = 'disabled';
            buttonText = 'غير متوفر';
        } else if (stock <= threshold) {
            stockBadge = `<div class="stock-badge limited-stock">مخزون محدود (${stock} متبقي)</div>`;
        }
    }

    // Wishlist heart icon
    const isWishlisted = isInWishlist(id);
    const heartIcon = isWishlisted ? '❤️' : '🤍';
    const heartActiveClass = isWishlisted ? 'active' : '';

    return `
        <div class="product-card ${isOutOfStock ? 'out-of-stock-card' : ''}" data-product-id="${id}" data-category="${categoryClass}">
            ${badgeHTML}
            ${stockBadge}
            
            <!-- Direct Actions Top Bar -->
            <div class="product-card-top-actions">
                <button class="product-link-icon-btn" onclick="copyProductLink('${id}', event)" title="نسخ رابط المنتج">
                    🔗
                </button>
            </div>

            <div class="product-image">
                <img src="${product.image || 'Images/Logo-text.png'}" alt="${product.name}" class="product-img" onerror="this.src='Images/Logo-text.png'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.shortDesc || (product.description ? product.description.substring(0, 65) + '...' : 'منتج فاخر عالي الجودة')}</p>
                <div class="product-footer">
                    <span class="product-price" data-usd="${product.price || 0}" data-price-type="${priceType}">${price}</span>
                    <div class="product-actions">
                        <button class="wishlist-heart ${heartActiveClass}" 
                            data-product-id="${id}" 
                            data-product-name="${product.name}" 
                            data-product-price="${product.price || 0}" 
                            data-product-image="${product.image}" 
                            data-product-desc="${product.shortDesc || (product.description ? product.description.substring(0, 60) + '...' : '')}"
                            aria-label="إضافة للمفضلة">
                            ${heartIcon}
                        </button>
                        ${isContactPrice ? `
                        <a class="contact-price-btn" href="https://wa.me/${CONTACT_NUMBER}?text=${encodeURIComponent('مرحباً، أريد الاستفسار عن منتج: ' + product.name)}" target="_blank" style="text-decoration:none;color:inherit;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            تواصل معنا
                        </a>` : `
                        <button class="add-to-cart-btn" ${addToCartDisabled} data-product-id="${id}" data-product-name="${product.name}" data-product-price="${product.price || 0}" data-product-image="${product.image}" data-product-desc="${product.shortDesc || (product.description ? product.description.substring(0, 60) + '...' : '')}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 2L6 6M18 6L15 2M6 6h12l1 14H5L6 6z" />
                            </svg>
                            ${buttonText}
                        </button>`}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// WhatsApp floating button
function initWhatsAppButton() {
    const whatsappBtn = document.getElementById('whatsapp-button');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const whatsappURL = `https://wa.me/${CONTACT_NUMBER}`;
            window.open(whatsappURL, '_blank');
        });
    }
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load products from Firebase
    loadProductsFromFirebase();
    loadSettings();

    initCurrencySwitcher();
    refreshAddToCartButtons();
    initCartButton();
    initNewsletterForm();
    initSmoothScrolling();
    initNavbarScroll();
    initScrollAnimations();
    initSearch();
    addDynamicStyles();
    initProductCardClick();
    initAboutLink();
    initContactLink();
    initRefundLink();
    initFooterLinks();
    initWishlistButton();
    initRecentlyViewedButton();
    initLogoClick();
    initHeroShopNow();
    initWhatsAppButton();

    function initHeaderSync() {
        if (typeof loadRecentlyViewed === 'function') loadRecentlyViewed();
        updateCartCount();
        if (typeof updateWishlistCount === 'function') updateWishlistCount();
        if (typeof updateRecentlyViewedCount === 'function') updateRecentlyViewedCount();
    }

    document.addEventListener('header-loaded', initHeaderSync);

    if (document.getElementById('main-header') && document.getElementById('main-header').innerHTML.trim() !== '') {
        initHeaderSync();
    }

    console.log('New Desgin Store initialized successfully!');

    // Check for product ID in URL for direct product redirection on homepage or catalog
    if (!window.location.pathname.includes('product.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const directProductId = urlParams.get('id') || urlParams.get('product');
        if (directProductId) {
            setTimeout(() => {
                showProductDetails(directProductId);
            }, 500);
        }
    }
});

// Share Product Function
window.shareProduct = function (platform, productId, productName) {
    const productUrl = window.location.origin + window.location.pathname.replace('index.html', 'products.html') + '?id=' + productId;

    if (platform === 'whatsapp') {
        const text = `شاهد هذا المنتج المميز من New Desgin: ${productName || ''}\n${productUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
    } else if (platform === 'copy') {
        navigator.clipboard.writeText(productUrl).then(() => {
            showNotification('تم نسخ الرابط! 📋');
        }).catch(() => {
            showNotification('فشل نسخ الرابط');
        });
    }
};

// Search functionality
function initSearch() {
    const searchInput = document.getElementById('product-search');
    const productsContainer = document.getElementById('products-container');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const productCards = document.querySelectorAll('.product-card');
            let hasVisibleProduct = false;

            productCards.forEach(card => {
                const productName = card.querySelector('.product-name') ? card.querySelector('.product-name').textContent.toLowerCase() : '';
                const productDesc = card.querySelector('.product-description') ? card.querySelector('.product-description').textContent.toLowerCase() : '';

                if (productName.includes(query) || productDesc.includes(query) || query === '') {
                    card.style.display = 'block';
                    hasVisibleProduct = true;
                } else {
                    card.style.display = 'none';
                }
            });

            const noResultsMsg = document.querySelector('.no-results-search');
            if (!hasVisibleProduct && query !== '') {
                if (!noResultsMsg) {
                    const msg = document.createElement('div');
                    msg.className = 'no-results-search';
                    msg.style.textAlign = 'center';
                    msg.style.width = '100%';
                    msg.style.gridColumn = '1 / -1';
                    msg.style.padding = '2rem';
                    msg.style.color = 'rgba(255,255,255,0.7)';
                    msg.innerHTML = '<h3>لا توجد نتائج مطابقة لبحثك في الملابس والعطور 🔍</h3>';
                    productsContainer.appendChild(msg);
                }
            } else {
                if (noResultsMsg) noResultsMsg.remove();
            }
        });
    }
}
// ============================================
// MAINTENANCE MODE
// ============================================
function showMaintenanceMode(preset, customMessage) {
    // Preset messages
    const presetMessages = {
        maintenance: {
            icon: '🔧',
            title: 'الموقع تحت الصيانة',
            message: 'نعتذر عن الإزعاج، نحن نعمل على تحسين الموقع. سنعود قريباً!'
        },
        locked: {
            icon: '🔒',
            title: 'الموقع مغلق حالياً',
            message: 'الموقع غير متاح في الوقت الحالي. يرجى المحاولة لاحقاً.'
        },
        soon: {
            icon: '⏰',
            title: 'سنعود قريباً',
            message: 'الموقع قيد التحديث. شكراً لصبركم!'
        }
    };

    // Get message content
    let messageContent;
    if (preset === 'custom' && customMessage) {
        messageContent = {
            icon: '📢',
            title: 'إشعار',
            message: customMessage
        };
    } else {
        messageContent = presetMessages[preset] || presetMessages.maintenance;
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'maintenance-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.5s ease-out;
    `;

    overlay.innerHTML = `
        <div style="text-align: center; max-width: 600px; padding: 2rem;">
            <div style="font-size: 6rem; animation: bounce 2s infinite; margin-bottom: 2rem;">
                ${messageContent.icon}
            </div>
            <h1 style="color: white; font-size: 2.5rem; margin-bottom: 1rem; font-family: 'Outfit', sans-serif;">
                ${messageContent.title}
            </h1>
            <p style="color: rgba(255, 255, 255, 0.7); font-size: 1.25rem; line-height: 1.8;">
                ${messageContent.message}
            </p>
        </div>
    `;

    // Add to page
    document.body.appendChild(overlay);

    // Hide all page content
    document.body.style.overflow = 'hidden';
}
