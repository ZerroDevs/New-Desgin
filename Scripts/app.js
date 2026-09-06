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
let CONTACT_NUMBER = '218916808225'; // Default
let FACEBOOK_URL = '';
let CONTACT_EMAIL = ''; // Will be loaded from Firebase

// Announcement Rotation Global
let announcementIntervalId = null;

// Load settings (Exchange Rate & Contact Info)
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

                // Dispatch event so other pages (like success.html) know
                document.dispatchEvent(new CustomEvent('contact-info-updated', {
                    detail: { phoneNumber: CONTACT_NUMBER }
                }));

                // Update Footer Text
                const footerPhonetext = document.getElementById('footer-phone-text');
                if (footerPhonetext) footerPhonetext.textContent = CONTACT_NUMBER;

                // Update WhatsApp Button HREF
                const whatsappBtn = document.getElementById('whatsapp-button');
                if (whatsappBtn) {
                    whatsappBtn.href = `https://wa.me/${CONTACT_NUMBER}`;
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
            }

            // 5. Update Hero Section
            if (settings.heroTitle) {
                const el = document.getElementById('hero-title-text');
                if (el) el.textContent = settings.heroTitle;
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
            if (settings.storeCategories) {
                renderCategoryTabs(settings.storeCategories);
            }

            // 7. Update Announcement Bar
            const announcementBar = document.getElementById('announcement-bar');

            // Clear existing interval
            if (announcementIntervalId) {
                clearInterval(announcementIntervalId);
                announcementIntervalId = null;
            }

            if (settings.announcementEnabled) {
                let announcements = settings.announcements || [];

                // Legacy support / Fallback
                if (announcements.length === 0 && settings.announcementText) {
                    announcements = [{
                        text: settings.announcementText,
                        backgroundColor: '#667eea',
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

            // 8. Check Maintenance Mode
            if (settings.maintenanceEnabled) {
                showMaintenanceMode(settings.maintenancePreset, settings.maintenanceCustomMessage);
            }

            // 9. Apply Theme Settings
            if (settings.theme) {
                const root = document.documentElement;
                if (settings.theme.primary) {
                    root.style.setProperty('--primary', settings.theme.primary);
                    // Update gradient based on primary if needed, or just let primary do the work
                    // For now, let's update gradients if possible or just primary colors
                    // To make gradients work dynamically, we might need more complex logic or just set primary
                    // Let's sticking to simple primary/secondary for now. 
                    // Actually, let's try to update the gradient variable too if we want full effect
                    root.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${settings.theme.primary} 0%, ${settings.theme.secondary || '#764ba2'} 100%)`);
                }
                if (settings.theme.secondary) {
                    root.style.setProperty('--secondary', settings.theme.secondary);
                    root.style.setProperty('--secondary-gradient', `linear-gradient(135deg, #f093fb 0%, ${settings.theme.secondary} 100%)`);
                }
                if (settings.theme.accent) {
                    root.style.setProperty('--accent', settings.theme.accent);
                }
                if (settings.theme.bgPrimary) root.style.setProperty('--bg-primary', settings.theme.bgPrimary);
                if (settings.theme.bgSecondary) root.style.setProperty('--bg-secondary', settings.theme.bgSecondary);
                if (settings.theme.textPrimary) root.style.setProperty('--text-primary', settings.theme.textPrimary);
                if (settings.theme.textSecondary) root.style.setProperty('--text-secondary', settings.theme.textSecondary);

                // 10. Check Seasonal Effects
                if (window.SeasonalEffects) {
                    const effectConfig = settings.theme.effectConfig || {};
                    // If legacy settings.theme.effect exists but no config object, use it
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
function showNotification(message) {
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
        top: '100px',
        right: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: '10000',
        fontWeight: '600',
        animation: 'slideInRight 0.3s ease-out',
        maxWidth: '300px'
    });

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
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
    return wishlist.some(item => item.id === productId);
}

// Toggle wishlist (add/remove)
function toggleWishlist(productId, productData) {
    const index = wishlist.findIndex(item => item.id === productId);

    if (index > -1) {
        // Remove from wishlist
        wishlist.splice(index, 1);
        saveWishlist();
        updateWishlistCount();
        updateWishlistHearts();
        showNotification('تمت الإزالة من القائمة 📑');
    } else {
        // Add to wishlist
        wishlist.push({
            id: productId,
            name: productData.name,
            price: productData.price,
            image: productData.image,
            description: productData.description
        });
        saveWishlist();
        updateWishlistCount();
        updateWishlistHearts();
        showNotification('تمت الإضافة إلى القائمة 🔖');
    }
}

// Update wishlist count badge
function updateWishlistCount() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (!wishlistBtn) return;

    let badge = wishlistBtn.querySelector('.wishlist-count');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'wishlist-count';
        Object.assign(badge.style, {
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'linear-gradient(135deg, #f5576c 0%, #ff6b6b 100%)',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700'
        });
        wishlistBtn.style.position = 'relative';
        wishlistBtn.appendChild(badge);
    }
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
}

// Update all wishlist heart icons on page
function updateWishlistHearts() {
    const hearts = document.querySelectorAll('.wishlist-heart');
    hearts.forEach(heart => {
        const productId = heart.dataset.productId;
        if (isInWishlist(productId)) {
            heart.classList.add('active');
            heart.innerHTML = '🔖';
        } else {
            heart.classList.remove('active');
            heart.innerHTML = '📑';
        }
    });
}

// Initialize wishlist button in navbar
function initWishlistButton() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.wishlist-btn');
        if (btn) {
            e.preventDefault();
            showWishlistDrawer();
        }
    });
}

// Initialize wishlist heart buttons on product cards
function initWishlistHearts() {
    const hearts = document.querySelectorAll('.wishlist-heart');
    hearts.forEach(heart => {
        heart.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = heart.dataset.productId;
            const productData = {
                name: heart.dataset.productName,
                price: parseFloat(heart.dataset.productPrice),
                image: heart.dataset.productImage,
                description: heart.dataset.productDesc
            };
            toggleWishlist(productId, productData);
        });
    });
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
        background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.98))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2rem',
        maxWidth: '480px',
        width: '95%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(245, 87, 108, 0.15)',
        animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        direction: 'rtl',
        color: '#fff'
    });

    let contentHTML = '';

    if (wishlist.length === 0) {
        contentHTML = `
            <span class="close-wishlist-btn" style="position:absolute; top:15px; right:20px; font-size:28px; cursor:pointer;">&times;</span>
            <div class="empty-wishlist" style="text-align: center; padding: 4rem 1rem;">
                <div style="font-size: 5rem; margin-bottom: 1.5rem; animation: float 3s ease-in-out infinite;">📑</div>
                <h3 style="font-size: 1.6rem; margin-bottom: 0.5rem; background: linear-gradient(to right, #fff, #a5a5a5); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Wishlist فارغة</h3>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 2.5rem; font-size: 0.95rem;">لم تقم بإضافة أي منتجات للقائمة بعد.<br>اضغط على 🔖 لإضافة منتجات!</p>
                <button class="btn btn-primary" onclick="document.querySelector('.wishlist-drawer-overlay').remove()" style="padding: 14px 35px; border-radius: 50px;">
                    تصفح المنتجات 🛍️
                </button>
            </div>
        `;
    } else {
        let itemsHTML = '';
        wishlist.forEach(item => {
            const itemPriceDisplay = currentCurrency === 'USD' ? item.price : (item.price * EXCHANGE_RATE);
            itemsHTML += `
                <div class="wishlist-item" style="display: flex; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; margin-bottom: 1rem; align-items: center;">
                    <div style="width: 70px; height: 70px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,0.05);">
                        <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: white; margin-bottom: 0.25rem;">${item.name}</div>
                        <div style="color: #667eea; font-weight: 700;">${formatCurrency(itemPriceDisplay, currentCurrency)}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <button onclick="moveToCart('${item.id}')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                            🛒 أضف للسلة
                        </button>
                        <button onclick="removeFromWishlist('${item.id}')" style="background: rgba(245, 87, 108, 0.2); border: 1px solid #f5576c; color: #f5576c; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">
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

// Initialize add to cart buttons
function initAddToCartButtons() {
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            const productName = btn.dataset.productName;
            const productPrice = parseFloat(btn.dataset.productPrice);
            // ALWAYS store the base USD price in the cart. 
            // We will convert it to the active currency at display/checkout time.
            const price = productPrice;
            const image = btn.dataset.productImage;
            const description = btn.dataset.productDesc;

            addToCart(productName, price, image, description, productId);

            // Animation for button
            btn.classList.add('added');
            setTimeout(() => {
                btn.classList.remove('added');
            }, 1000);
        });
    });
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

// Product details modal - Updated for Firebase
function showProductDetails(productId) {
    // Fetch product from Firebase
    productsRef.child(productId).once('value', (snapshot) => {
        const product = snapshot.val();
        if (!product) {
            showNotification('المنتج غير موجود او جاري البحث عنه', 'error');
            return;
        }

        // Track as recently viewed
        addToRecentlyViewed(productId, product);

        const overlay = document.createElement('div');
        overlay.className = 'product-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'product-modal';

        // Build features HTML
        let featuresHTML = '';
        if (product.features && product.features.length > 0) {
            product.features.forEach(feature => {
                featuresHTML += `
                    <div class="feature-item">
                        <div class="feature-icon-large">${feature.icon}</div>
                        <div class="feature-content">
                            <h4>${feature.title}</h4>
                            <p>${feature.description}</p>
                        </div>
                    </div>
                `;
            });
        } else {
            featuresHTML = `<p>${product.description}</p>`;
        }

        // Flexible Pricing in Modal
        const modalPriceType = product.priceType || 'fixed';
        let displayPrice = '';
        let modalIsContactPrice = false;

        if (modalPriceType === 'fixed') {
            const priceUSD = product.price;
            const priceLYD = priceUSD * EXCHANGE_RATE;
            displayPrice = currentCurrency === 'USD' ? formatCurrency(priceUSD, 'USD') : formatCurrency(priceLYD, 'LYD');
        } else if (modalPriceType === 'range') {
            const min = product.priceMin || 0;
            const max = product.priceMax || 0;
            if (currentCurrency === 'USD') {
                displayPrice = `$${min.toFixed(2)} - $${max.toFixed(2)}`;
            } else {
                displayPrice = `${(min * EXCHANGE_RATE).toFixed(2)} - ${(max * EXCHANGE_RATE).toFixed(2)} د.ل`;
            }
            modalIsContactPrice = true;
        } else if (modalPriceType === 'negotiable') {
            displayPrice = '🤝 قابل للتفاوض';
            modalIsContactPrice = true;
        } else if (modalPriceType === 'contact') {
            displayPrice = '📞 تواصل للسعر';
            modalIsContactPrice = true;
        }

        const modalActionButton = modalIsContactPrice
            ? `<a class="btn btn-primary" href="https://wa.me/${CONTACT_NUMBER}?text=${encodeURIComponent('مرحباً، أريد الاستفسار عن سعر: ' + product.name)}" target="_blank" style="text-decoration:none;color:white;">
                   💬 تواصل عبر واتساب
               </a>`
            : `<button class="btn btn-primary add-to-cart-modal" data-product-name="${product.name}" data-product-price="${product.price}">
                    إضافة للسلة
                </button>`;

        // Gallery Logic - Swipeable 
        let imageSectionHTML = '';

        // Combine main image and additional images
        const galleryImages = [product.image];
        if (product.additionalImages && product.additionalImages.length > 0) {
            galleryImages.push(...product.additionalImages);
        }

        const slidesHTML = galleryImages.map((img, index) => `
            <div class="gallery-slide" id="slide-${index}">
                <div class="gallery-image-wrapper" onmousemove="handleZoom(event)" onmouseleave="resetZoom(event)" onclick="openLightbox('${img}')">
                    <img src="${img}" class="gallery-image" alt="${product.name}" onerror="this.src='https://via.placeholder.com/500x500?text=No+Image'">
                </div>
            </div>
        `).join('');

        const thumbnailsHTML = galleryImages.map((img, index) => `
            <div class="gallery-thumbnail ${index === 0 ? 'active' : ''}" onclick="scrollToSlide(${index})">
                <img src="${img}" alt="Thumbnail ${index + 1}">
            </div>
        `).join('');

        // Navigation arrows only if multiple images
        const navArrows = galleryImages.length > 1 ? `
            <button class="gallery-nav prev" onclick="scrollGallery(-1)">&#10094;</button>
            <button class="gallery-nav next" onclick="scrollGallery(1)">&#10095;</button>
        ` : '';

        imageSectionHTML = `
            <div class="product-gallery">
                <div class="gallery-carousel-container">
                    <div class="gallery-track" id="gallery-track" onscroll="syncThumbnails()">
                        ${slidesHTML}
                    </div>
                    ${navArrows}
                </div>
                ${galleryImages.length > 1 ? `<div class="gallery-thumbnails">${thumbnailsHTML}</div>` : ''}
            </div>
        `;

        modal.innerHTML = `
            <div class="product-modal-header">
                <div class="product-modal-title">
                    <h2>${product.name}</h2>
                    <p class="product-modal-subtitle">${product.shortDesc || product.description.substring(0, 100)}</p>
                </div>
                <button class="close-modal-btn">&times;</button>
            </div>
            ${imageSectionHTML}
            <div class="product-modal-body">
                <h3 class="features-title">المميزات المتضمنة</h3>
                <div class="features-list">
                    ${featuresHTML}
                </div>
            </div>
            <div class="product-modal-footer">
                <div class="modal-price-section">
                    <span class="modal-price-label">السعر:</span>
                    <span class="modal-price">${displayPrice}</span>
                </div>
                ${modalActionButton}
            </div>
            <div class="product-modal-share-bar">
                <span>مشاركة المنتج:</span>
                <div class="share-buttons">
                    <button class="share-btn whatsapp" onclick="shareProduct('whatsapp', '${productId}', '${product.name}')">📱 واتساب</button>
                    <button class="share-btn facebook" onclick="shareProduct('facebook', '${productId}')">📘 فيسبوك</button>
                    <button class="share-btn copy" onclick="shareProduct('copy', '${productId}')">📋 نسخ الرابط</button>
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
            maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto',
            animation: 'slideInUp 0.3s ease-out', direction: 'rtl'
        });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Inject reviews section if reviews.js is loaded
        if (typeof buildReviewsSection === 'function') {
            const reviewsSection = buildReviewsSection(productId);
            modal.appendChild(reviewsSection);
        }

        // Styles for modal content
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
        .product-modal-header { padding: 2rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: flex-start; }
        .product-modal-title h2 { font-family: 'Outfit', sans-serif; font-size: 2rem; margin: 0 0 0.5rem 0; }
        .product-modal-subtitle { color: rgba(255, 255, 255, 0.7); font-size: 1.125rem; margin: 0; }
        .product-modal-image { padding: 0 2rem; }
        .product-modal-image img { width: 100%; max-height: 300px; object-fit: contain; border-radius: 12px; }
        
        /* Gallery Styles - Swipeable Carousel */
        .product-gallery { padding: 0 2rem; display: flex; flex-direction: column; gap: 1rem; position: relative; }
        .gallery-carousel-container { position: relative; width: 100%; height: 400px; overflow: hidden; border-radius: 12px; background: rgba(0,0,0,0.2); }
        .gallery-track { display: flex; width: 100%; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none; }
        .gallery-track::-webkit-scrollbar { display: none; }
        .gallery-slide { flex: 0 0 100%; width: 100%; height: 100%; scroll-snap-align: center; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        
        .gallery-image-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; cursor: zoom-in; position: relative; overflow: hidden; }
        .gallery-image { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.1s ease-out; transform-origin: center center; pointer-events: none; /* Let wrapper handle events */ }
        /* Add hover to wrapper to enable pointer events on image effectively or just handle on wrapper */

        /* Navigation Arrows */
        .gallery-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 50%; transition: background 0.3s; z-index: 10; user-select: none; opacity: 0; }
        .gallery-carousel-container:hover .gallery-nav { opacity: 1; }
        .gallery-nav:hover { background: rgba(0,0,0,0.8); }
        .gallery-nav.prev { left: 10px; }
        .gallery-nav.next { right: 10px; }

        .gallery-thumbnails { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: thin; justify-content: center; margin-top: 0.5rem; }
        .gallery-thumbnail { min-width: 60px; height: 60px; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; opacity: 0.5; transition: all 0.2s ease; }
        .gallery-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
        .gallery-thumbnail:hover { opacity: 0.8; }
        .gallery-thumbnail.active { border-color: #667eea; opacity: 1; transform: scale(1.05); }

        .product-modal-body { padding: 2rem; }
        .features-title { font-family: 'Outfit', sans-serif; font-size: 1.5rem; margin-bottom: 1.5rem; }
        .features-list { display: grid; gap: 1rem; }
        .feature-item { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; transition: all 0.2s ease; }
        .feature-item:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(102, 126, 234, 0.5); }
        .feature-icon-large { font-size: 2rem; min-width: 40px; }
        .feature-content h4 { font-size: 1.125rem; margin: 0 0 0.5rem 0; }
        .feature-content p { color: rgba(255, 255, 255, 0.7); margin: 0; line-height: 1.6; }
        .product-modal-footer { padding: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .modal-price-section { display: flex; flex-direction: column; gap: 0.5rem; }
        .modal-price-label { color: rgba(255, 255, 255, 0.7); font-size: 0.875rem; }
        .modal-price { font-size: 2rem; font-weight: 700; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .add-to-cart-modal { padding: 1rem 2rem; white-space: nowrap; }
        .add-to-cart-modal:disabled { background: #555; cursor: not-allowed; transform: none !important; box-shadow: none !important; opacity: 0.7; }

        /* Share Bar Styles */
        .product-modal-share-bar { padding: 1.5rem 2rem; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 1rem; border-radius: 0 0 16px 16px; margin-top: 0; }
        .product-modal-share-bar span { color: rgba(255,255,255,0.8); font-size: 0.95rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }
        .product-modal-share-bar span::before { content: '🔗'; font-size: 1.1rem; }
        
        .share-buttons { display: flex; gap: 0.8rem; }
        .share-btn { 
            border: 1px solid rgba(255,255,255,0.1); 
            background: rgba(255,255,255,0.05); 
            padding: 0.6rem 1.2rem; 
            border-radius: 50px; 
            font-size: 0.9rem; 
            font-weight: 500;
            cursor: pointer; 
            color: rgba(255,255,255,0.9); 
            display: flex; align-items: center; gap: 0.5rem; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            position: relative; overflow: hidden;
        }
        
        .share-btn:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); color: white; border-color: transparent; }
        
        .share-btn.whatsapp:hover { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); }
        .share-btn.facebook:hover { background: linear-gradient(135deg, #1877F2 0%, #0C5DC7 100%); }
        .share-btn.copy:hover { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        
        .share-btn:active { transform: translateY(-1px); }
    `;
        document.head.appendChild(modalStyles);

        const closeBtn = modal.querySelector('.close-modal-btn');
        closeBtn.addEventListener('click', () => closeModal(overlay));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });

        const addToCartBtn = modal.querySelector('.add-to-cart-modal');
        // Check stock for modal button
        if (product.stock !== undefined && product.stock <= 0) {
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = 'نفذت الكمية ❌';
            addToCartBtn.style.background = '#444';

            // Add sold out badge to main gallery image if needed
            const mainImgContainer = modal.querySelector('.gallery-main-image');
            const soldOutBadge = document.createElement('div');
            soldOutBadge.className = 'sold-out-badge-modal';
            soldOutBadge.innerHTML = 'نفذت الكمية';
            Object.assign(soldOutBadge.style, {
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-10deg)',
                background: 'rgba(255, 59, 48, 0.9)', color: 'white', padding: '10px 30px',
                fontSize: '1.5rem', fontWeight: 'bold', borderRadius: '8px', border: '2px solid white',
                letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
                zIndex: '5'
            });
            mainImgContainer.appendChild(soldOutBadge);
        }

        addToCartBtn.addEventListener('click', () => {
            if (addToCartBtn.disabled) return;
            const productName = addToCartBtn.dataset.productName;
            const productPrice = parseFloat(addToCartBtn.dataset.productPrice);
            // ALWAYS store the base USD price in the cart.
            const price = productPrice;
            addToCart(productName, price, product.image, product.shortDesc || product.description.substring(0, 100));
            closeModal(overlay);
        });
    });
}

// Gallery Helper Functions
window.scrollGallery = function (direction) {
    const track = document.getElementById('gallery-track');
    if (track) {
        const slideWidth = track.clientWidth;
        track.scrollBy({ left: direction * slideWidth, behavior: 'smooth' });
    }
};

window.scrollToSlide = function (index) {
    const track = document.getElementById('gallery-track');
    const slide = document.getElementById(`slide-${index}`);
    if (track && slide) {
        track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    }
};

window.handleZoom = function (e) {
    const wrapper = e.currentTarget;
    const img = wrapper.querySelector('.gallery-image');
    if (!img) return;

    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    img.style.transform = 'scale(2)'; // Zoom level
};

window.resetZoom = function (e) {
    const wrapper = e.currentTarget;
    const img = wrapper.querySelector('.gallery-image');
    if (img) {
        img.style.transform = 'scale(1)';
        setTimeout(() => {
            img.style.transformOrigin = 'center center';
        }, 100);
    }
};

window.syncThumbnails = function () {
    const track = document.getElementById('gallery-track');
    if (!track) return;

    const scrollLeft = track.scrollLeft;
    const slideWidth = track.clientWidth;
    const index = Math.round(scrollLeft / slideWidth);

    document.querySelectorAll('.gallery-thumbnail').forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('active');
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            thumb.classList.remove('active');
        }
    });
};

// Initialize product card click handlers
function initProductCardClick() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart-btn')) {
                const productId = card.dataset.productId;
                if (productId) {
                    showProductDetails(productId);
                }
            }
        });
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
            <h2 style="margin: 0; font-size: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">سياسة الاسترجاع والاستبدال</h2>
        </div>

        <div style="line-height: 1.8; font-size: 1rem;">
            <div style="background: rgba(102, 126, 234, 0.1); border-left: 4px solid #667eea; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <p style="margin: 0; color: rgba(255,255,255,0.9);">
                    <strong>في متجر زيرونكس</strong>، نحن ملتزمون بتقديم أفضل خدمة لعملائنا. نرجو قراءة سياسة الاسترجاع بعناية قبل إتمام عملية الشراء.
                </p>
            </div>

            <h3 style="color: #00b894; margin-top: 1.5rem; margin-bottom: 1rem;">✅ المنتجات القابلة للاسترجاع</h3>
            <div style="background: rgba(0, 184, 148, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0 0 0.5rem 0;"><strong>الاشتراكات والخدمات:</strong></p>
                <ul style="margin: 0; padding-right: 1.5rem;">
                    <li>إذا لم يعمل الاشتراك للمدة الكاملة المتفق عليها، يحق لك طلب استرجاع كامل المبلغ</li>
                    <li>يجب تقديم طلب الاسترجاع خلال <strong>7 أيام</strong> من تاريخ الشراء</li>
                    <li>يتم معالجة طلبات الاسترجاع خلال <strong>3-5 أيام عمل</strong></li>
                </ul>
            </div>

            <h3 style="color: #ff7675; margin-top: 1.5rem; margin-bottom: 1rem;">❌ المنتجات غير القابلة للاسترجاع</h3>
            <div style="background: rgba(255, 118, 117, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0 0 0.5rem 0;"><strong>المنتجات الرقمية الفورية:</strong></p>
                <ul style="margin: 0; padding-right: 1.5rem;">
                    <li>بطاقات شحن الألعاب (Steam, PlayStation, Xbox, إلخ)</li>
                    <li>أكواد التفعيل الفورية</li>
                    <li>بطاقات الهدايا الرقمية</li>
                    <li>أي منتج تم استخدامه أو تفعيله بالفعل</li>
                </ul>
            </div>

            <h3 style="color: #6c5ce7; margin-top: 1.5rem; margin-bottom: 1rem;">📋 شروط الاسترجاع</h3>
            <div style="background: rgba(108, 92, 231, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <ol style="margin: 0; padding-right: 1.5rem;">
                    <li>يجب تقديم إثبات الشراء (رقم الطلب أو لقطة شاشة من المحادثة)</li>
                    <li>يجب توضيح سبب طلب الاسترجاع بشكل واضح</li>
                    <li>في حالة وجود مشكلة تقنية، يجب إرسال لقطات شاشة توضح المشكلة</li>
                    <li>الاسترجاع يتم بنفس طريقة الدفع الأصلية</li>
                </ol>
            </div>

            <h3 style="color: #fdcb6e; margin-top: 1.5rem; margin-bottom: 1rem;">💬 كيفية طلب الاسترجاع</h3>
            <div style="background: rgba(253, 203, 110, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0;">
                    للتواصل معنا بخصوص طلب استرجاع، يرجى التواصل عبر:
                </p>
                <ul style="margin: 0.5rem 0 0 0; padding-right: 1.5rem;">
                    <li><strong>واتساب:</strong> <span id="refund-whatsapp" style="color: #00b894;"></span></li>
                    <li><strong>البريد الإلكتروني:</strong> <span id="refund-email" style="color: #00b894;"></span></li>
                </ul>
            </div>

            <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; margin-top: 1.5rem; text-align: center;">
                <p style="margin: 0; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    <strong>ملاحظة:</strong> نحن نسعى دائماً لحل أي مشكلة قد تواجهك. لا تتردد في التواصل معنا قبل طلب الاسترجاع، وسنبذل قصارى جهدنا لمساعدتك! 💙
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
function loadProductsFromFirebase() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return; // Exit if not on products page

    // Show loading state
    // Show skeleton loading placeholders
    if (typeof showProductSkeletons === 'function') {
        showProductSkeletons('products-container', 6);
    } else {
        productsContainer.innerHTML = '<div class="loading-products">جاري تحميل المنتجات...</div>';
    }

    productsRef.on('value', (snapshot) => {
        const products = snapshot.val();
        productsContainer.innerHTML = '';

        if (!products || Object.keys(products).length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products-message" style="text-align: center; width: 100%; padding: 4rem 1rem;">
                    <h3 style="color: rgba(255, 255, 255, 0.7); font-size: 1.5rem;">لايوجد اي عروض الان</h3>
                </div>
            `;
            return;
        }

        let visibleCount = 0;
        // Render products from Firebase
        Object.keys(products).forEach(id => {
            const product = products[id];
            // Only show if visible is not false
            if (product.visible !== false) {
                const productCard = createProductCardHTML(id, product);
                productsContainer.innerHTML += productCard;
                visibleCount++;
            }
        });

        // Check if all products were hidden
        if (visibleCount === 0) {
            productsContainer.innerHTML = `
                <div class="no-products-message" style="text-align: center; width: 100%; padding: 4rem 1rem;">
                    <h3 style="color: rgba(255, 255, 255, 0.7); font-size: 1.5rem;">لايوجد اي عروض الان</h3>
                </div>
            `;
        }

        // Re-initialize buttons and events
        initAddToCartButtons();
        initProductCardClick();
        initWishlistHearts();
        initWishlistButton();
        initRecentlyViewedButton();

        // Check for product ID in URL (Deep Linking)
        const urlParams = new URLSearchParams(window.location.search);
        const productIdFromUrl = urlParams.get('product');

        if (productIdFromUrl && products[productIdFromUrl]) {
            // Wait a bit to ensure DOM is ready and animations play nicely
            setTimeout(() => {
                showProductDetails(productIdFromUrl);

                // Scroll to products section
                const productsSection = document.getElementById('products');
                if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                }

                // Clean URL without refreshing
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.pushState({ path: newUrl }, '', newUrl);
            }, 500);
        }
    });
}

let currentCategoryFilter = 'all';

// Render Category Tabs (Called from loadSettings)
function renderCategoryTabs(categoriesString) {
    const tabsContainer = document.getElementById('categories-tabs');
    if (!tabsContainer || !categoriesString) return;

    const categories = categoriesString.split(',').map(c => c.trim()).filter(c => c);

    // Start with "All"
    let html = `<button class="category-tab ${currentCategoryFilter === 'all' ? 'active' : ''}" data-category="all">الكل</button>`;

    categories.forEach(cat => {
        const isActive = currentCategoryFilter === cat ? 'active' : '';
        html += `<button class="category-tab ${isActive}" data-category="${cat}">${cat}</button>`;
    });

    tabsContainer.innerHTML = html;

    // Add click listeners
    const tabs = tabsContainer.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            // Add to clicked
            tab.classList.add('active');

            const selectedCategory = tab.getAttribute('data-category');
            currentCategoryFilter = selectedCategory;
            filterProductsByCategory(selectedCategory);
        });
    });
}

// Filter products by category
function filterProductsByCategory(category) {
    const products = document.querySelectorAll('.product-card');
    const productsContainer = document.getElementById('products-container');
    let visibleCount = 0;

    products.forEach(card => {
        const cardCategory = card.getAttribute('data-category') || 'general';

        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.5s ease-out forwards';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Handle empty state
    const noResultsMsg = document.querySelector('.no-results-category');
    if (visibleCount === 0) {
        if (!noResultsMsg) {
            const msg = document.createElement('div');
            msg.className = 'no-results-category';
            msg.style.textAlign = 'center';
            msg.style.width = '100%';
            msg.style.gridColumn = '1 / -1';
            msg.style.padding = '4rem 1rem';
            msg.style.color = 'rgba(255,255,255,0.7)';
            msg.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 1rem;">📂</div>
                <h3 style="font-size: 1.5rem;">لا توجد منتجات في هذا التصنيف حالياً</h3>
                <p>تفضل بزيارة التصنيفات الأخرى</p>
            `;
            productsContainer.appendChild(msg);
        }
    } else {
        if (noResultsMsg) noResultsMsg.remove();
    }
}

// Create product card HTML from Firebase data
function createProductCardHTML(id, product) {
    const badgeMap = {
        'new': 'جديد',
        'limited': 'عرض محدود',
        'hot': 'الأكثر مبيعاً'
    };

    const badgeHTML = product.badge && product.badge !== 'none'
        ? `<div class="product-badge" data-badge="${product.badge}">${badgeMap[product.badge]}</div>`
        : '';

    const categoryClass = product.category || 'general';

    // Flexible Pricing
    const priceType = product.priceType || 'fixed';
    let price = '';
    let isContactPrice = false;

    if (priceType === 'fixed') {
        price = currentCurrency === 'USD'
            ? `$${product.price.toFixed(2)}`
            : `${(product.price * EXCHANGE_RATE).toFixed(2)} د.ل`;
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
    const heartIcon = isWishlisted ? '🔖' : '📑';
    const heartActiveClass = isWishlisted ? 'active' : '';

    return `
        <div class="product-card ${isOutOfStock ? 'out-of-stock-card' : ''}" data-product-id="${id}" data-category="${categoryClass}">
            ${badgeHTML}
            ${stockBadge}
            <div class="product-image">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" data-src="${product.image}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.shortDesc || product.description.substring(0, 60) + '...'}</p>
                <div class="product-footer">
                    <span class="product-price" data-usd="${product.price || 0}" data-price-type="${priceType}">${price}</span>
                    <div class="product-actions">
                        <button class="wishlist-heart ${heartActiveClass}" 
                            data-product-id="${id}" 
                            data-product-name="${product.name}" 
                            data-product-price="${product.price}" 
                            data-product-image="${product.image}" 
                            data-product-desc="${product.shortDesc || product.description.substring(0, 60) + '...'}"
                            aria-label="إضافة لـ Wishlist">
                            ${heartIcon}
                        </button>
                        ${isContactPrice ? `
                        <a class="contact-price-btn" href="https://wa.me/${CONTACT_NUMBER}?text=${encodeURIComponent('مرحباً، أريد الاستفسار عن سعر: ' + product.name)}" target="_blank" style="text-decoration:none;color:inherit;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            تواصل معنا
                        </a>` : `
                        <button class="add-to-cart-btn" ${addToCartDisabled} data-product-id="${id}" data-product-name="${product.name}" data-product-price="${product.price}" data-product-image="${product.image}" data-product-desc="${product.shortDesc || product.description.substring(0, 60) + '...'}">
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
            // Use global CONTACT_NUMBER loaded from settings
            const message = '';
            const encodedMessage = encodeURIComponent(message);
            const whatsappURL = `https://wa.me/${CONTACT_NUMBER}?text=${encodedMessage}`;
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
    initAddToCartButtons();
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

    // Sync with Header (Cart/Wishlist Counts)
    // Sync with Header (Cart/Wishlist Counts)
    function initHeaderSync() {
        // Also load recently viewed if not loaded
        if (typeof loadRecentlyViewed === 'function') loadRecentlyViewed();

        updateCartCount();
        if (typeof updateWishlistCount === 'function') updateWishlistCount();
        // Update runs after load
        if (typeof updateRecentlyViewedCount === 'function') updateRecentlyViewedCount();
    }

    // Listen for header ready event
    document.addEventListener('header-loaded', initHeaderSync);

    // Check if ready (if header script ran first)
    if (document.getElementById('main-header') && document.getElementById('main-header').innerHTML.trim() !== '') {
        initHeaderSync();
    }

    console.log('ZeroNux Store initialized successfully!');
    // Check for product ID in URL for direct access
    const urlParams = new URLSearchParams(window.location.search);
    const directProductId = urlParams.get('id');
    if (directProductId) {
        // Small delay to ensure styles/scripts are ready, though not strictly necessary
        setTimeout(() => {
            showProductDetails(directProductId);
        }, 500);
    }
});

// Share Product Function
window.shareProduct = function (platform, productId, productName) {
    const productUrl = window.location.origin + window.location.pathname + '?id=' + productId;

    if (platform === 'whatsapp') {
        const text = `شاهد هذا المنتج المميز: ${productName}\n${productUrl}`;
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
                const productName = card.querySelector('.product-name').textContent.toLowerCase();
                // Also search in description for better results
                const productDesc = card.querySelector('.product-description').textContent.toLowerCase();

                if (productName.includes(query) || productDesc.includes(query)) {
                    card.style.display = 'block';
                    // Re-run animation for found items
                    card.style.animation = 'none';
                    card.offsetHeight; /* trigger reflow */
                    card.style.animation = 'fadeInUp 0.5s ease-out forwards';
                    hasVisibleProduct = true;
                } else {
                    card.style.display = 'none';
                }
            });

            // Handle no results
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
                    msg.innerHTML = '<h3>لا توجد نتائج مطابقة لبحثك 🔍</h3>';
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
