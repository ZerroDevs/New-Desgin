// ============================================
// ADMIN GLOBAL SEARCH — Expanded
// ============================================
(function () {
    'use strict';

    // References
    const db = firebase.database();

    // Internal Cache
    let searchCache = {
        products: [],
        orders: [],
        customers: [], // Derived from orders
        promos: [],
        reviews: [],
        settings: [] // Flattened settings for search
    };

    // Static Admin Functions
    const adminFunctions = [
        { id: 'func-dashboard', name: 'لوحة التحكم (Dashboard)', keywords: ['dashboard', 'home', 'main', 'stats'], type: 'nav', action: () => switchTab('dashboard') },
        { id: 'func-products', name: 'قائمة المنتجات (Products)', keywords: ['products', 'items', 'inventory'], type: 'nav', action: () => switchTab('dashboard') }, // Assuming dashboard is products
        { id: 'func-orders', name: 'إدارة الطلبات (Orders)', keywords: ['orders', 'sales', 'requests'], type: 'nav', action: () => switchTab('orders') },
        { id: 'func-settings', name: 'الإعدادات العامة (Settings)', keywords: ['settings', 'config', 'setup'], type: 'nav', action: () => switchTab('settings') },
        { id: 'func-promos', name: 'الكوبونات والخصومات (Coupons)', keywords: ['coupons', 'promos', 'discounts', 'codes'], type: 'nav', action: () => switchTab('promos') }, // Assuming tab ID is 'promos' based on common pattern
        { id: 'func-reviews', name: 'التقييمات والآراء (Reviews)', keywords: ['reviews', 'ratings', 'comments', 'stars'], type: 'nav', action: () => switchTab('reviews') },
        { id: 'func-activity', name: 'سجل النشاط (Activity Log)', keywords: ['activity', 'log', 'history', 'audit'], type: 'nav', action: () => switchTab('activity') },
        // Specific Settings Actions (Direct jump if possible, otherwise just open settings)
        { id: 'func-currency', name: 'إعدادات العملة (Currency)', keywords: ['currency', 'exchange', 'rate', 'dollar'], type: 'setting', action: () => { switchTab('settings'); setTimeout(() => document.getElementById('exchange-rate')?.focus(), 300); } },
        { id: 'func-tax', name: 'الضريبة والشحن (Shipping/Tax)', keywords: ['tax', 'shipping', 'delivery', 'cost'], type: 'setting', action: () => switchTab('settings') },
        { id: 'func-theme', name: 'المظهر والألوان (Theme)', keywords: ['theme', 'colors', 'design', 'style', 'mode'], type: 'setting', action: () => switchTab('settings') }
    ];

    let isDataLoaded = false;
    let searchDebounceTimer;

    // ---- UI Injection ----
    function injectSearchUI() {
        // 1. Styles
        const style = document.createElement('style');
        style.textContent = `
            /* Overlay */
            .admin-global-search-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 12, 41, 0.95);
                backdrop-filter: blur(10px);
                z-index: 9999;
                display: none;
                flex-direction: column;
                align-items: center;
                padding-top: 80px;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            .admin-global-search-overlay.open {
                display: flex;
                opacity: 1;
            }

            /* Search Box Container */
            .admin-search-container {
                width: 100%;
                max-width: 700px;
                position: relative;
                padding: 0 1rem;
            }

            /* Input Wrapper */
            .admin-search-input-wrapper {
                position: relative;
                width: 100%;
            }
            .admin-search-icon {
                position: absolute;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1.4rem;
                color: #667eea;
                pointer-events: none;
            }
            .admin-global-search-input {
                width: 100%;
                padding: 18px 60px 18px 20px;
                background: rgba(255, 255, 255, 0.07);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                color: white;
                font-size: 1.2rem;
                font-family: 'Cairo', sans-serif;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transition: all 0.3s;
            }
            .admin-global-search-input:focus {
                outline: none;
                background: rgba(255, 255, 255, 0.12);
                border-color: #667eea;
                box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2), 0 10px 40px rgba(0,0,0,0.4);
            }
            .admin-global-search-input::placeholder {
                color: rgba(255, 255, 255, 0.3);
            }

            /* Close Button */
            .admin-search-close {
                position: absolute;
                top: -50px;
                right: 1rem;
                background: none;
                border: none;
                color: rgba(255,255,255,0.6);
                font-size: 2rem;
                cursor: pointer;
                transition: color 0.2s;
            }
            .admin-search-close:hover {
                color: white;
            }

            /* Results Container */
            .admin-search-results {
                width: 100%;
                max-width: 700px;
                margin-top: 1.5rem;
                max-height: calc(100vh - 180px);
                overflow-y: auto;
                padding: 0 1rem 2rem 1rem;
                scrollbar-width: thin;
                scrollbar-color: rgba(255,255,255,0.1) transparent;
            }
            .admin-search-results::-webkit-scrollbar { width: 6px; }
            .admin-search-results::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

            /* Result Sections */
            .search-section {
                margin-bottom: 2rem;
            }
            .search-section-title {
                font-size: 0.9rem;
                color: rgba(255,255,255,0.4);
                margin-bottom: 0.8rem;
                padding-right: 0.5rem;
                border-right: 3px solid #667eea;
                font-weight: bold;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }

            /* Result Items */
            .search-result-item {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.05);
                padding: 12px;
                border-radius: 10px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
                text-decoration: none;
                color: inherit;
            }
            .search-result-item:hover, .search-result-item.selected {
                background: rgba(102, 126, 234, 0.15);
                border-color: rgba(102, 126, 234, 0.3);
                transform: translateX(-4px);
            }

            .result-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background: rgba(255,255,255,0.05);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            .result-info {
                flex: 1;
                min-width: 0;
            }
            .result-title {
                display: block;
                font-weight: bold;
                margin-bottom: 2px;
                color: rgba(255,255,255,0.9);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .result-meta {
                display: flex;
                gap: 8px;
                font-size: 0.8rem;
                color: rgba(255,255,255,0.5);
                align-items: center;
            }
            .result-badge {
                padding: 2px 6px;
                border-radius: 4px;
                background: rgba(255,255,255,0.1);
                font-size: 0.7rem;
            }

            /* Type Specific Styles */
            .type-product .result-icon { background: rgba(0, 184, 148, 0.15); color: #00b894; }
            .type-order .result-icon { background: rgba(108, 92, 231, 0.15); color: #6c5ce7; }
            .type-customer .result-icon { background: rgba(253, 121, 168, 0.15); color: #fd79a8; }
            .type-function .result-icon { background: rgba(9, 132, 227, 0.15); color: #0984e3; }
            .type-setting .result-icon { background: rgba(178, 190, 195, 0.15); color: #b2bec3; }
            .type-promo .result-icon { background: rgba(255, 118, 117, 0.15); color: #ff7675; }
            .type-review .result-icon { background: rgba(253, 203, 110, 0.15); color: #fdcb6e; }

            .no-results {
                text-align: center;
                padding: 2rem;
                color: rgba(255,255,255,0.3);
                font-size: 1.1rem;
            }
            .result-highlight {
                color: #667eea;
                font-weight: bold;
                background: rgba(102, 126, 234, 0.1);
                padding: 0 2px;
                border-radius: 2px;
            }
        `;
        document.head.appendChild(style);

        // 2. HTML Structure
        const overlay = document.createElement('div');
        overlay.id = 'admin-global-search-overlay';
        overlay.className = 'admin-global-search-overlay';
        overlay.innerHTML = `
            <button class="admin-search-close" onclick="closeAdminSearch()">✕</button>
            <div class="admin-search-container">
                <div class="admin-search-input-wrapper">
                    <span class="admin-search-icon">🔍</span>
                    <input type="text" id="admin-global-search-input" class="admin-global-search-input" placeholder="بحث شامل: وظائف، إعدادات، طلبات، منتجات... (Ctrl + K)">
                </div>
            </div>
            <div class="admin-search-results" id="admin-search-results">
                <!-- Results go here -->
                <div class="no-results" style="display:none">ابحث عن أي شيء...</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // 3. Events
        const input = document.getElementById('admin-global-search-input');
        const overlayEl = document.getElementById('admin-global-search-overlay');

        // Close on escape or outside click
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                openAdminSearch();
            }
            if (e.key === 'Escape' && overlayEl.classList.contains('open')) {
                closeAdminSearch();
            }
        });

        overlayEl.addEventListener('click', (e) => {
            if (e.target === overlayEl) closeAdminSearch();
        });

        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!isDataLoaded) loadAllData();

            clearTimeout(searchDebounceTimer);
            if (query.length === 0) {
                document.getElementById('admin-search-results').innerHTML = '<div class="no-results">ابحث عن أي شيء...</div>';
                return;
            }

            searchDebounceTimer = setTimeout(() => performSearch(query), 200);
        });

        // Trigger loading data on hover
        setTimeout(() => {
            const trigger = document.getElementById('admin-search-trigger');
            if (trigger) {
                trigger.addEventListener('mouseenter', () => {
                    if (!isDataLoaded) loadAllData();
                });
            }
        }, 3000);
    }

    // ---- Data Loading ----
    function loadAllData() {
        if (isDataLoaded) return;

        console.log('Loading expanded admin search data...');

        // 1. Products
        db.ref('products').once('value', snap => {
            const data = snap.val();
            if (data) searchCache.products = Object.entries(data).map(([id, p]) => ({ id, ...p }));
        });

        // 2. Orders (and derive customers)
        db.ref('orders').limitToLast(500).once('value', snap => {
            const data = snap.val();
            if (data) {
                searchCache.orders = Object.entries(data).map(([id, o]) => ({ id, ...o }));

                // Derive customers map
                const customersMap = {};
                searchCache.orders.forEach(order => {
                    const email = order.customerEmail || 'unknown';
                    const phone = order.customerPhone || 'unknown';
                    const key = email !== 'unknown' ? email : phone;

                    if (key !== 'unknown') {
                        if (!customersMap[key]) {
                            customersMap[key] = {
                                id: key,
                                name: order.customerName || 'Zeronux User',
                                email: order.customerEmail,
                                phone: order.customerPhone,
                                totalSpent: 0,
                                orderCount: 0,
                                lastOrderDate: 0
                            };
                        }
                        customersMap[key].totalSpent += parseFloat(order.total) || 0;
                        customersMap[key].orderCount++;
                        if (order.timestamp > customersMap[key].lastOrderDate) {
                            customersMap[key].lastOrderDate = order.timestamp;
                        }
                    }
                });
                searchCache.customers = Object.values(customersMap);
            }
        });

        // 3. Promos / Coupons
        db.ref('promos').once('value', snap => {
            const data = snap.val();
            if (data) searchCache.promos = Object.entries(data).map(([id, p]) => ({ id, ...p }));
        });

        // 4. Reviews
        db.ref('reviews').orderByChild('timestamp').limitToLast(100).once('value', snap => {
            const data = snap.val();
            if (data) searchCache.reviews = Object.entries(data).map(([id, r]) => ({ id, ...r }));
        });

        // 5. Settings (Flatten)
        // We load settings once but searchCache.settings structure will be static or updated on load
        // Actually, we can just search against known setting keys/labels
        searchCache.settings = [
            { key: 'exchangeRate', label: 'سعر الصرف (Exchange Rate)' },
            { key: 'storeCategories', label: 'فئات المتجر (Categories)' },
            { key: 'maintenanceEnabled', label: 'وضع الصيانة (Maintenance Mode)' },
            { key: 'heroTitle', label: 'عنوان الصفحة الرئيسية (Hero Title)' },
            { key: 'contactEmail', label: 'بريد التواصل (Contact Email)' },
            { key: 'phoneNumber', label: 'رقم الهاتف (Phone Number)' },
            { key: 'adminEmails', label: 'مدراء النظام (Admin Emails)' },
            { key: 'announcement', label: 'شريط الإعلانات (Announcements)' }
        ];

        isDataLoaded = true;
    }

    // ---- Search Logic ----
    function performSearch(query) {
        const resultsContainer = document.getElementById('admin-search-results');
        resultsContainer.innerHTML = '';

        if (!query) return;

        // 0. Filter Admin Functions & Settings Maps
        const matchedFunctions = adminFunctions.filter(f => {
            return f.name.toLowerCase().includes(query) || f.keywords.some(k => k.includes(query));
        });

        // 1. Filter Settings (Keys matches)
        const matchedSettings = searchCache.settings.filter(s => {
            return s.label.toLowerCase().includes(query) || s.key.toLowerCase().includes(query);
        });

        // 2. Filter Promos
        const matchedPromos = searchCache.promos.filter(p => {
            return (p.code && p.code.toLowerCase().includes(query));
        }).slice(0, 3);

        // 3. Filter Reviews
        const matchedReviews = searchCache.reviews.filter(r => {
            return (r.name && r.name.toLowerCase().includes(query)) ||
                (r.text && r.text.toLowerCase().includes(query));
        }).slice(0, 3);

        // 4. Filter Products
        const matchedProducts = searchCache.products.filter(p => {
            return (p.name && p.name.toLowerCase().includes(query)) ||
                (p.description && p.description.toLowerCase().includes(query));
        }).slice(0, 3);

        // 5. Filter Orders
        const matchedOrders = searchCache.orders.filter(o => {
            return (o.orderId && o.orderId.toLowerCase().includes(query)) ||
                (o.id && o.id.includes(query)) ||
                (o.customerName && o.customerName.toLowerCase().includes(query)) ||
                (o.customerPhone && o.customerPhone.includes(query));
        }).slice(0, 3);

        // 6. Filter Customers
        const matchedCustomers = searchCache.customers.filter(c => {
            return (c.name && c.name.toLowerCase().includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query)) ||
                (c.phone && c.phone.includes(query));
        }).slice(0, 3);

        // ---- Render ----
        let hasResults = false;

        // Functions
        if (matchedFunctions.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-section';
            section.innerHTML = '<div class="search-section-title">وظائف وغعدادات سريعة</div>';
            matchedFunctions.forEach(f => {
                const el = document.createElement('div');
                el.className = 'search-result-item type-function';
                el.onclick = () => { closeAdminSearch(); f.action(); };
                el.innerHTML = `
                    <div class="result-icon">${f.id.includes('setting') ? '⚙️' : '🔧'}</div>
                    <div class="result-info">
                        <span class="result-title">${highlightMatch(f.name, query)}</span>
                        <div class="result-meta">انتقال سريع</div>
                    </div>
                `;
                section.appendChild(el);
            });
            resultsContainer.appendChild(section);
        }

        // Settings (Direct matches to specific fields)
        if (matchedSettings.length > 0) {
            // Merge with functions visually or separate? Separate is fine.
            // Actually, let's skip this if Functions covered it (Settings match is redundant if "Functions>Settings" exists)
            // But specific settings like "Exchange Rate" are useful.
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-section';
            section.innerHTML = '<div class="search-section-title">إعدادات محددة</div>';
            matchedSettings.forEach(s => {
                const el = document.createElement('div');
                el.className = 'search-result-item type-setting';
                el.onclick = () => { closeAdminSearch(); switchTab('settings'); };
                el.innerHTML = `
                    <div class="result-icon">⚙️</div>
                    <div class="result-info">
                        <span class="result-title">${highlightMatch(s.label, query)}</span>
                        <div class="result-meta">تعديل في الإعدادات</div>
                    </div>
                `;
                section.appendChild(el);
            });
            resultsContainer.appendChild(section);
        }

        // Promos
        if (matchedPromos.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-section';
            section.innerHTML = '<div class="search-section-title">الكوبونات</div>';
            matchedPromos.forEach(p => {
                const el = document.createElement('div');
                el.className = 'search-result-item type-promo';
                el.onclick = () => { closeAdminSearch(); switchTab('promos'); };
                el.innerHTML = `
                    <div class="result-icon">🎟️</div>
                    <div class="result-info">
                        <span class="result-title">${highlightMatch(p.code, query)}</span>
                        <div class="result-meta">
                            <span class="result-badge">${p.discount}% خصم</span>
                            <span>${p.maxUses ? 'محدود' : 'غير محدود'}</span>
                        </div>
                    </div>
                `;
                section.appendChild(el);
            });
            resultsContainer.appendChild(section);
        }

        // Reviews
        if (matchedReviews.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-section';
            section.innerHTML = '<div class="search-section-title">التقييمات</div>';
            matchedReviews.forEach(r => {
                const el = document.createElement('div');
                el.className = 'search-result-item type-review';
                el.onclick = () => { closeAdminSearch(); switchTab('reviews'); };
                el.innerHTML = `
                    <div class="result-icon">⭐</div>
                    <div class="result-info">
                        <span class="result-title">${highlightMatch(r.name || 'مستخدم', query)}</span>
                        <div class="result-meta">
                            <span>${r.rating} نجوم</span>
                            <span style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${highlightMatch(r.text || '', query)}</span>
                        </div>
                    </div>
                `;
                section.appendChild(el);
            });
            resultsContainer.appendChild(section);
        }

        // Products
        if (matchedProducts.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-section';
            section.innerHTML = '<div class="search-section-title">المنتجات</div>';
            matchedProducts.forEach(p => {
                const el = document.createElement('div');
                el.className = 'search-result-item type-product';
                el.onclick = () => {
                    closeAdminSearch();
                    if (window.switchTab) window.switchTab('dashboard');
                    setTimeout(() => {
                        if (window.editProduct) window.editProduct(p.id);
                    }, 500);
                };
                el.innerHTML = `
                    <div class="result-icon">📦</div>
                    <div class="result-info">
                        <span class="result-title">${highlightMatch(p.name, query)}</span>
                        <div class="result-meta">
                            <span class="result-badge">${p.price} د.ل</span>
                            <span>${p.visible === false ? 'مخفي' : 'ظاهر'}</span>
                        </div>
                    </div>
                `;
                section.appendChild(el);
            });
            resultsContainer.appendChild(section);
        }

        // Orders
        if (matchedOrders.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-section';
            section.innerHTML = '<div class="search-section-title">الطلبات</div>';
            matchedOrders.forEach(o => {
                const el = document.createElement('div');
                el.className = 'search-result-item type-order';
                el.onclick = () => {
                    closeAdminSearch();
                    if (window.switchTab) window.switchTab('orders');
                    setTimeout(() => {
                        if (window.viewOrderDetails) window.viewOrderDetails(o.id);
                    }, 500);
                };
                const displayId = o.orderId || o.id.slice(-6);
                el.innerHTML = `
                    <div class="result-icon">📝</div>
                    <div class="result-info">
                        <span class="result-title">طلب #${highlightMatch(displayId, query)}</span>
                        <div class="result-meta">
                            <span>${highlightMatch(o.customerName || 'زائر', query)}</span>
                            <span class="result-badge status-${o.status}">${o.status}</span>
                            <span>${new Date(o.timestamp).toLocaleDateString('ar-EG')}</span>
                        </div>
                    </div>
                `;
                section.appendChild(el);
            });
            resultsContainer.appendChild(section);
        }

        // Customers
        if (matchedCustomers.length > 0) {
            hasResults = true;
            const section = document.createElement('div');
            section.className = 'search-section';
            section.innerHTML = '<div class="search-section-title">العملاء</div>';
            matchedCustomers.forEach(c => {
                const el = document.createElement('div');
                el.className = 'search-result-item type-customer';
                el.onclick = () => {
                    alert(`Customer: ${c.name}\nTotal Spent: ${c.totalSpent.toFixed(2)}\nOrders: ${c.orderCount}\nEmail: ${c.email || '-'}\nPhone: ${c.phone || '-'}`);
                };
                el.innerHTML = `
                    <div class="result-icon">👤</div>
                    <div class="result-info">
                        <span class="result-title">${highlightMatch(c.name, query)}</span>
                        <div class="result-meta">
                            <span>${c.orderCount} طلبات</span>
                            <span>${c.phone || c.email}</span>
                        </div>
                    </div>
                `;
                section.appendChild(el);
            });
            resultsContainer.appendChild(section);
        }

        if (!hasResults) {
            resultsContainer.innerHTML = '<div class="no-results">لا توجد نتائج مطابقة لبحثك</div>';
        }
    }

    // Helper: Highlight Text
    function highlightMatch(text, query) {
        if (!text) return '';
        const lowerText = text.toString().toLowerCase();
        const index = lowerText.indexOf(query);
        if (index >= 0) {
            return text.toString().substring(0, index) +
                `<span class="result-highlight">${text.toString().substring(index, index + query.length)}</span>` +
                text.toString().substring(index + query.length);
        }
        return text;
    }

    // ---- Exports ----
    window.openAdminSearch = function () {
        const overlay = document.getElementById('admin-global-search-overlay');
        const input = document.getElementById('admin-global-search-input');
        if (overlay) {
            overlay.classList.add('open');
            input.focus();
            if (!isDataLoaded) loadAllData();
        }
    };

    window.closeAdminSearch = function () {
        const overlay = document.getElementById('admin-global-search-overlay');
        if (overlay) overlay.classList.remove('open');
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSearchUI);
    } else {
        injectSearchUI();
    }

})();
