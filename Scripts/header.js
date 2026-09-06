document.addEventListener('DOMContentLoaded', () => {
    // DOMAIN GUARD: Redirect 'auth' subdomain to main domain for non-action pages
    if (window.location.hostname === 'auth.zeronux.store') {
        window.location.href = 'https://zeronux.store' + window.location.pathname + window.location.search;
        return; // Stop execution
    }

    // Determine current page for active link highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const headerHTML = `
    <!-- Announcement Bar -->
    <div id="announcement-bar" class="announcement-bar" style="display: none;">
        <div class="announcement-content">
            <span id="announcement-text"></span>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="navbar">
        <div class="container">
            <div class="nav-content">
                <div class="logo">
                     <a href="index.html" style="display: flex; align-items: center; gap: 10px; text-decoration: none;">
                        <img src="Images/Logo-noBG.png" alt="New Desgin Logo" style="height: 52px; width: auto; object-fit: contain;">
                    </a>
                </div>

                <button class="mobile-menu-btn" aria-label="Toggle Menu">
                    ☰
                </button>

                <div class="nav-links">
                    <a href="index.html" class="nav-link ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">الرئيسية</a>
                    <a href="products.html" class="nav-link ${currentPage === 'products.html' ? 'active' : ''}">كافة المنتجات</a>
                    <a href="products.html?category=clothes" class="nav-link">ملابس</a>
                    <a href="products.html?category=perfumes" class="nav-link">عطور</a>
                    <a href="track-order.html" class="nav-link ${currentPage === 'track-order.html' ? 'active' : ''}">تتبع طلبك</a>
                    
                    <!-- Mobile Quick Actions (icon row) -->
                    <div class="mobile-quick-actions">
                        <button class="mobile-quick-btn" onclick="showWishlistDrawer()" title="المفضلة">
                            <span class="quick-icon">❤️</span>
                            <span class="quick-label">المفضلة</span>
                        </button>
                        <button class="mobile-quick-btn" onclick="showRecentlyViewedDrawer()" title="شاهدت مؤخراً">
                            <span class="quick-icon">🕐</span>
                            <span class="quick-label">الأخيرة</span>
                        </button>
                        <button class="mobile-quick-btn" onclick="document.querySelector('.cart-btn').click()"
                            title="السلة">
                            <span class="quick-icon">🛒</span>
                            <span class="quick-label">السلة</span>
                        </button>
                        <a href="support.html" class="mobile-quick-btn" title="الدعم"
                            style="text-decoration: none; color: inherit;">
                            <span class="quick-icon">📞</span>
                            <span class="quick-label">الدعم</span>
                        </a>
                    </div>
                </div>

                <div class="nav-actions">
                    <button class="desktop-search-btn" id="desktop-search-btn" aria-label="Search">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                    <div class="currency-switcher">
                        <button class="currency-btn active" data-currency="USD">
                            <span class="currency-symbol">$</span>
                            <span class="currency-code">USD</span>
                        </button>
                        <button class="currency-btn" data-currency="LYD">
                            <span class="currency-symbol">د.ل</span>
                            <span class="currency-code">LYD</span>
                        </button>
                    </div>
                    <button class="recently-viewed-btn" aria-label="Recently Viewed">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span class="recently-viewed-count">0</span>
                    </button>
                    <button class="wishlist-btn" aria-label="Wishlist">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                        <span class="wishlist-count">0</span>
                    </button>
                    <button class="cart-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M9 2L6 6M18 6L15 2M6 6h12l1 14H5L6 6z" />
                        </svg>
                        <span class="cart-count">0</span>
                    </button>
                </div>
            </div>
        </div>
    </nav>
    
    <!-- Mobile Bottom Navigation Bar -->
    <div class="mobile-bottom-nav">
        <!-- Toggle Button -->
        <button class="mobile-nav-toggle" aria-label="Toggle Navigation">
            <span class="toggle-icon">▼</span>
        </button>
        <a href="index.html" class="mobile-nav-item ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}" id="mobile-nav-home">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">الرئيسية</span>
        </a>
        <a href="products.html" class="mobile-nav-item ${currentPage === 'products.html' ? 'active' : ''}" id="mobile-nav-catalog">
            <span class="nav-icon">🛍️</span>
            <span class="nav-label">المنتجات</span>
        </a>
        <div class="mobile-nav-item" id="mobile-nav-search">
            <span class="nav-icon">🔍</span>
            <span class="nav-label">بحث</span>
        </div>
        <div class="mobile-nav-item relative" id="mobile-nav-cart">
            <span class="nav-icon">🛒</span>
            <span class="cart-count-badge">0</span>
            <span class="nav-label">السلة</span>
        </div>
        <a href="https://wa.me/218916808225" target="_blank" class="mobile-nav-item">
            <span class="nav-icon">💬</span>
            <span class="nav-label">دعم</span>
        </a>
    </div>
    `;

    const headerContainer = document.getElementById('main-header');
    if (headerContainer) {
        headerContainer.innerHTML = headerHTML;
    }


    // Initialize Mobile Menu and Bottom Nav immediately
    initMobileMenuLogic();

    // Initialize Auth Logic
    initAuthLogic();
});

function initMobileMenuLogic() {
    // 1. Mobile Menu Toggle (Hamburger)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        // Toggle menu
        mobileMenuBtn.onclick = (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        };

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== mobileMenuBtn) {
                navLinks.classList.remove('active');
            }
        });

        // Close when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // 2. Search Buttons — Global Search Overlay
    const searchHandler = () => {
        // On index.html with an existing search box, scroll to it
        const onIndexPage = (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'));
        const searchInput = document.getElementById('product-search');
        if (onIndexPage && searchInput) {
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => searchInput.focus(), 400);
            return;
        }
        // On other pages, open global search overlay
        openGlobalSearchOverlay();
    };

    // Mobile bottom nav search
    const mobileSearchBtn = document.getElementById('mobile-nav-search');
    if (mobileSearchBtn) mobileSearchBtn.onclick = searchHandler;

    // Desktop nav search
    const desktopSearchBtn = document.getElementById('desktop-search-btn');
    if (desktopSearchBtn) desktopSearchBtn.onclick = searchHandler;

    // 3. Mobile Bottom Nav Toggle
    const toggleBtn = document.querySelector('.mobile-nav-toggle');
    const bottomNav = document.querySelector('.mobile-bottom-nav');

    if (toggleBtn && bottomNav) {
        // Load saved state
        const isHidden = localStorage.getItem('mobileNavHidden') === 'true';
        if (isHidden) {
            bottomNav.classList.add('nav-hidden');
            toggleBtn.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
        }

        toggleBtn.onclick = () => {
            bottomNav.classList.toggle('nav-hidden');
            const isNowHidden = bottomNav.classList.contains('nav-hidden');
            localStorage.setItem('mobileNavHidden', isNowHidden);

            // Rotate icon
            const icon = toggleBtn.querySelector('.toggle-icon');
            if (icon) icon.style.transform = isNowHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        };
    }

    // 4. Currency Switcher — Persist & Sync across all pages
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
        document.querySelectorAll('.currency-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.currency === savedCurrency);
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.currency-btn');
        if (!btn) return;

        const currency = btn.dataset.currency;

        // Update active state
        document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Save to localStorage
        localStorage.setItem('selectedCurrency', currency);

        // Update global currentCurrency
        window.currentCurrency = currency;
        if (typeof currentCurrency !== 'undefined') {
            currentCurrency = currency;
        }

        // Update prices if updatePrices exists (from app.js)
        if (typeof updatePrices === 'function') {
            updatePrices(currency);
        }

        // Dispatch event for other scripts (students.js, cart.js, etc.)
        document.dispatchEvent(new CustomEvent('currency-change', { detail: { currency } }));
    });
}

function initAuthLogic() {
    // Add specific styles for the user dropdown and button
    const style = document.createElement('style');
    style.innerHTML = `
        .user-avatar-btn {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        .user-avatar-btn:hover {
            transform: scale(1.1);
        }
        .user-dropdown-container {
            z-index: 10001;
            margin-left: 0 !important; /* Reset margin */
        }
    `;
    document.head.appendChild(style);

    // Target the main nav content to place next to logo
    const navContent = document.querySelector('.nav-content');
    const logo = document.querySelector('.logo');

    // Create User Button (Hidden initially)
    const userBtn = document.createElement('div');
    userBtn.className = 'user-dropdown-container';
    userBtn.style.position = 'relative';

    // Insert AFTER the Logo (Visually to the left of logo in RTL, or right of logo in LTR)
    // The user requested "Right of header near the logo". In RTL, Logo is Right-most.
    if (navContent && logo) {
        // navContent is flex row.
        // Logo is first child.
        // Inserting after logo makes it the second child.
        if (logo.nextSibling) {
            navContent.insertBefore(userBtn, logo.nextSibling);
        } else {
            navContent.appendChild(userBtn);
        }
    } else {
        // Fallback to nav-actions if logo not found
        const navActions = document.querySelector('.nav-actions');
        if (navActions) navActions.appendChild(userBtn);
    }

    // Default "Not Signed In" State
    // We might want to HIDE it if not signed in, or show a "Sign In" text?
    // User request implied they want the avatar there.
    // If not signed in, let's keep the Icon but maybe styled better.
    userBtn.innerHTML = `
        <a href="login.html" class="auth-btn" aria-label="Sign In" style="display: flex; align-items: center; justify-content: center; color: white; opacity: 0.8; transition: opacity 0.2s;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
        </a>
    `;

    // Auth State Listener
    if (firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') + '&background=random';
                const photoURL = user.photoURL || defaultAvatar;
                const displayName = user.displayName || 'مستخدم';

                // Check if user is admin
                // We need to fetch the admin list from Firebase Settings
                const db = firebase.database();
                db.ref('settings/adminEmails').once('value').then(snapshot => {
                    const admins = snapshot.val();
                    let isAdmin = false;

                    if (admins && user.email) {
                        // Check if email exists in the values of the admins object/array
                        const adminEmails = Object.values(admins);
                        // Case insensitive check
                        isAdmin = adminEmails.some(email => email.toLowerCase() === user.email.toLowerCase());
                    }

                    const adminBadge = isAdmin ? '<span style="background: #f5576c; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 5px;">مسؤول</span>' : '';
                    const adminLink = isAdmin ? `
                        <a href="admin.html" style="display: flex; align-items: center; gap: 10px; padding: 10px; color: #f5576c; text-decoration: none; border-radius: 8px; transition: background 0.2s; font-weight: bold;">
                            <span>🛠️</span> لوحة التحكم
                        </a>
                    ` : '';

                    userBtn.innerHTML = `
                        <button class="user-avatar-btn" id="user-avatar-btn">
                            <img src="${photoURL}" 
                                 alt="${displayName}" 
                                 onerror="this.src='${defaultAvatar}'"
                                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid ${isAdmin ? '#f5576c' : '#667eea'}; background: #fff;">
                        </button>
                        <div class="user-dropdown-menu" id="user-dropdown" style="display: none; position: absolute; top: 120%; right: -10px; background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); width: 220px; padding: 10px; z-index: 10002; text-align: right; backdrop-filter: blur(10px);">
                            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 5px;">
                                <strong style="display: block; color: white;">${displayName} ${adminBadge}</strong>
                                <small style="color: rgba(255,255,255,0.6); font-size: 12px;">${user.email}</small>
                            </div>
                            
                            ${adminLink}
                            
                            <a href="uorder.html" style="display: flex; align-items: center; gap: 10px; padding: 10px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; transition: background 0.2s;">
                                <span>📦</span> طلباتي
                            </a>
                            <a href="profile.html" style="display: flex; align-items: center; gap: 10px; padding: 10px; color: rgba(255,255,255,0.8); text-decoration: none; border-radius: 8px; transition: background 0.2s;">
                                <span>⚙️</span> الإعدادات
                            </a>
                            <button id="change-password-action" style="background: none; border: none; width: 100%; text-align: right; display: flex; align-items: center; gap: 10px; padding: 10px; color: rgba(255,255,255,0.8); cursor: pointer; border-radius: 8px; font-family: inherit; font-size: inherit; transition: background 0.2s;">
                                <span>🔒</span> تغيير كلمة المرور
                            </button>
                            <button id="logout-action" style="background: none; border: none; width: 100%; text-align: right; display: flex; align-items: center; gap: 10px; padding: 10px; color: #ff4444; cursor: pointer; border-radius: 8px; font-family: inherit; font-size: inherit; margin-top: 5px;">
                                <span>🚪</span> تسجيل الخروج
                            </button>
                        </div>
                    `;

                    // Re-attach listeners since we overwrote innerHTML
                    const avatarBtn = document.getElementById('user-avatar-btn');
                    const dropdown = document.getElementById('user-dropdown');

                    if (avatarBtn && dropdown) {
                        avatarBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                        });

                        // Close dropdown when clicking outside
                        document.addEventListener('click', (e) => {
                            if (!userBtn.contains(e.target) && dropdown.style.display === 'block') {
                                dropdown.style.display = 'none';
                            }
                        });
                    }

                    const logoutBtn = document.getElementById('logout-action');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', () => {
                            firebase.auth().signOut().then(() => {
                                window.location.reload();
                            });
                        });
                    }


                    // Inject Modal HTML into body
                    const modalHTML = `
        <div id="custom-confirm-modal" class="custom-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔐 تغيير كلمة المرور</h3>
                </div>
                <div class="modal-body">
                    <p>هل تريد إرسال رابط لإعادة تعيين كلمة المرور إلى بريدك الإلكتروني؟</p>
                </div>
                <div class="modal-footer">
                    <button id="confirm-yes-btn" class="modal-btn confirm">نعم، أرسل الرابط</button>
                    <button id="confirm-no-btn" class="modal-btn cancel">إلغاء</button>
                </div>
            </div>
        </div>
        <div id="custom-toast" class="custom-toast"></div>
        <style>
            .custom-modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
                z-index: 20000; display: flex; align-items: center; justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            .modal-content {
                background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px; padding: 25px; width: 90%; max-width: 400px;
                text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                transform: translateY(0); animation: slideUp 0.3s ease;
            }
            .modal-header h3 { color: white; margin-bottom: 10px; font-size: 20px; }
            .modal-body p { color: rgba(255,255,255,0.7); margin-bottom: 25px; line-height: 1.6; }
            .modal-footer { display: flex; gap: 10px; justify-content: center; }
            .modal-btn {
                padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;
                font-family: inherit; font-weight: 600; transition: all 0.2s;
            }
            .modal-btn.confirm { background: var(--primary-color, #667eea); color: white; flex: 1; }
            .modal-btn.confirm:hover { filter: brightness(1.1); transform: translateY(-2px); }
            .modal-btn.cancel { background: rgba(255,255,255,0.1); color: white; flex: 1; }
            .modal-btn.cancel:hover { background: rgba(255,255,255,0.2); }
            
            .custom-toast {
                position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                background: #333; color: white; padding: 12px 24px; border-radius: 30px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3); z-index: 20001;
                opacity: 0; pointer-events: none; transition: all 0.3s; font-size: 14px;
            }
            .custom-toast.show { opacity: 1; transform: translateX(-50%) translateY(-10px); }
            .custom-toast.success { background: #4caf50; }
            .custom-toast.error { background: #ff4444; }

            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        </style>
    `;
                    document.body.insertAdjacentHTML('beforeend', modalHTML);

                    // CHANGE PASSWORD LOGIC
                    const changePassBtn = document.getElementById('change-password-action');
                    if (changePassBtn) {
                        changePassBtn.addEventListener('click', (e) => {
                            e.stopPropagation();

                            const modal = document.getElementById('custom-confirm-modal');
                            const yesBtn = document.getElementById('confirm-yes-btn');
                            const noBtn = document.getElementById('confirm-no-btn');

                            modal.style.display = 'flex';

                            // Handle Yes
                            yesBtn.onclick = () => {
                                yesBtn.textContent = "جاري الإرسال...";
                                yesBtn.disabled = true;

                                firebase.auth().sendPasswordResetEmail(user.email)
                                    .then(() => {
                                        modal.style.display = 'none';
                                        showToast("✅ تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.", "success");
                                        yesBtn.textContent = "نعم، أرسل الرابط";
                                        yesBtn.disabled = false;
                                    })
                                    .catch((error) => {
                                        console.error(error);
                                        modal.style.display = 'none';
                                        showToast("❌ فشل الإرسال: " + error.message, "error");
                                        yesBtn.textContent = "نعم، أرسل الرابط";
                                        yesBtn.disabled = false;
                                    });
                            };

                            // Handle No
                            noBtn.onclick = () => {
                                modal.style.display = 'none';
                            };

                            // Close on outside click
                            modal.onclick = (e) => {
                                if (e.target === modal) modal.style.display = 'none';
                            };
                        });
                    }

                    function showToast(msg, type = 'normal') {
                        const toast = document.getElementById('custom-toast');
                        toast.textContent = msg;
                        toast.className = `custom-toast show ${type}`;
                        setTimeout(() => {
                            toast.className = 'custom-toast';
                        }, 4000);
                    }


                }); // End db lookup

            } else {
                // User is signed out
                userBtn.innerHTML = `
                    <a href="login.html" class="auth-btn" aria-label="Sign In" style="display: flex; align-items: center; justify-content: center; color: white; opacity: 0.8; transition: opacity 0.2s;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M20 21a8 8 0 1 0-16 0" />
                        </svg>
                    </a>
                `;
            }
        });
    }
}
