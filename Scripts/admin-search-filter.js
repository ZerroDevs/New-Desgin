// ============================================
// ADMIN SEARCH & FILTER
// ============================================
(function () {
    'use strict';

    // Inject styles for search/filter UI
    const style = document.createElement('style');
    style.textContent = `
        .admin-search-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            align-items: center;
        }
        .admin-search-bar input[type="text"] {
            flex: 1;
            min-width: 200px;
            padding: 10px 16px;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 10px;
            background: rgba(0,0,0,0.3);
            color: #fff;
            font-family: 'Cairo', sans-serif;
            font-size: 0.95rem;
            transition: border-color 0.3s;
        }
        .admin-search-bar input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102,126,234,0.15);
        }
        .admin-search-bar input[type="text"]::placeholder {
            color: rgba(255,255,255,0.35);
        }
        .admin-filter-group {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }
        .admin-filter-group select,
        .admin-filter-group input[type="date"] {
            padding: 8px 12px;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 8px;
            background: rgba(0,0,0,0.3);
            color: #fff;
            font-family: 'Cairo', sans-serif;
            font-size: 0.85rem;
            cursor: pointer;
            transition: border-color 0.3s;
        }
        .admin-filter-group select:focus,
        .admin-filter-group input[type="date"]:focus {
            outline: none;
            border-color: #667eea;
        }
        .admin-filter-group select option {
            background: #1a1a2e;
            color: #fff;
        }
        .admin-filter-count {
            font-size: 0.8rem;
            color: rgba(255,255,255,0.45);
            margin-right: 8px;
            white-space: nowrap;
        }
        .admin-search-bar .clear-filters-btn {
            padding: 8px 14px;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 8px;
            background: rgba(244,67,54,0.15);
            color: #f44336;
            font-family: 'Cairo', sans-serif;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.3s;
            white-space: nowrap;
        }
        .admin-search-bar .clear-filters-btn:hover {
            background: rgba(244,67,54,0.3);
        }
        .no-results-message {
            text-align: center;
            padding: 2rem;
            color: rgba(255,255,255,0.4);
            font-size: 1rem;
        }
    `;
    document.head.appendChild(style);

    // ---- Product Search & Filter ----
    let productSearchTerm = '';
    let productVisibilityFilter = 'all';
    let productDebounceTimer;

    function initProductSearch() {
        // Find existing or inject new
        if (document.getElementById('product-search-bar')) return;

        const productsSection = document.querySelector('#tab-dashboard .products-section');
        if (!productsSection) return;

        const heading = productsSection.querySelector('h2');
        if (!heading) return;

        // Create search bar
        const searchBar = document.createElement('div');
        searchBar.className = 'admin-search-bar';
        searchBar.id = 'product-search-bar';
        searchBar.innerHTML = `
            <input type="text" id="admin-product-search" placeholder="🔍 البحث في المنتجات...">
            <div class="admin-filter-group">
                <select id="admin-product-visibility-filter">
                    <option value="all">👁️ الكل</option>
                    <option value="visible">✅ ظاهر</option>
                    <option value="hidden">🙈 مخفي</option>
                </select>
                <span class="admin-filter-count" id="product-filter-count"></span>
                <button class="clear-filters-btn" id="clear-product-filters" style="display:none;">✕ مسح</button>
            </div>
        `;
        heading.after(searchBar);

        // Event listeners
        const searchInput = document.getElementById('admin-product-search');
        const visibilityFilter = document.getElementById('admin-product-visibility-filter');
        const clearBtn = document.getElementById('clear-product-filters');

        searchInput.addEventListener('input', (e) => {
            productSearchTerm = e.target.value.toLowerCase().trim();
            // Debounce to prevent freezing on fast typing
            clearTimeout(productDebounceTimer);
            productDebounceTimer = setTimeout(filterProducts, 300);
        });

        visibilityFilter.addEventListener('change', (e) => {
            productVisibilityFilter = e.target.value;
            filterProducts();
        });

        clearBtn.addEventListener('click', () => {
            productSearchTerm = '';
            productVisibilityFilter = 'all';
            searchInput.value = '';
            visibilityFilter.value = 'all';
            filterProducts();
        });
    }

    function filterProducts() {
        const grid = document.getElementById('products-list');
        if (!grid) return;

        // Use requestAnimationFrame to avoid blocking UI
        requestAnimationFrame(() => {
            const cards = grid.querySelectorAll('.product-card');
            let visibleCount = 0;

            cards.forEach(card => {
                const name = (card.querySelector('h3')?.textContent || '').toLowerCase();
                const desc = (card.querySelector('.description')?.textContent || '').toLowerCase();
                // Check hidden class or button text to determine visibility state
                const isHiddenClass = card.classList.contains('product-hidden');

                let show = true;

                // Search filter
                if (productSearchTerm) {
                    if (!name.includes(productSearchTerm) && !desc.includes(productSearchTerm)) {
                        show = false;
                    }
                }

                // Visibility filter
                if (show) {
                    if (productVisibilityFilter === 'visible' && isHiddenClass) show = false;
                    if (productVisibilityFilter === 'hidden' && !isHiddenClass) show = false;
                }

                card.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            // Update count
            const countEl = document.getElementById('product-filter-count');
            const clearBtn = document.getElementById('clear-product-filters');
            const hasFilters = productSearchTerm || productVisibilityFilter !== 'all';

            if (countEl) countEl.textContent = `${visibleCount} / ${cards.length}`;
            if (clearBtn) clearBtn.style.display = hasFilters ? '' : 'none';
        });
    }

    // ---- Orders Search & Filter ----
    let orderSearchTerm = '';
    let orderStatusFilter = 'all';
    let orderDateFrom = '';
    let orderDateTo = '';
    let orderDebounceTimer;

    function initOrderSearch() {
        if (document.getElementById('order-search-bar')) return;

        const ordersSection = document.querySelector('#tab-orders .form-section');
        if (!ordersSection) return;

        const heading = ordersSection.querySelector('h2');
        if (!heading) return;

        const searchBar = document.createElement('div');
        searchBar.className = 'admin-search-bar';
        searchBar.id = 'order-search-bar';
        searchBar.innerHTML = `
            <input type="text" id="admin-order-search" placeholder="🔍 البحث في الطلبات...">
            <div class="admin-filter-group">
                <select id="admin-order-status-filter">
                    <option value="all">📋 كل الحالات</option>
                    <option value="pending">⏳ قيد الانتظار</option>
                    <option value="completed">✅ مكتملة</option>
                    <option value="cancelled">❌ ملغاة</option>
                </select>
                <input type="date" id="admin-order-date-from" title="من تاريخ">
                <input type="date" id="admin-order-date-to" title="إلى تاريخ">
                <span class="admin-filter-count" id="order-filter-count"></span>
                <button class="clear-filters-btn" id="clear-order-filters" style="display:none;">✕ مسح</button>
            </div>
        `;
        heading.after(searchBar);

        // Event listeners
        const searchInput = document.getElementById('admin-order-search');
        const statusFilter = document.getElementById('admin-order-status-filter');
        const dateFrom = document.getElementById('admin-order-date-from');
        const dateTo = document.getElementById('admin-order-date-to');
        const clearBtn = document.getElementById('clear-order-filters');

        searchInput.addEventListener('input', (e) => {
            orderSearchTerm = e.target.value.toLowerCase().trim();
            clearTimeout(orderDebounceTimer);
            orderDebounceTimer = setTimeout(filterOrders, 300);
        });

        statusFilter.addEventListener('change', (e) => {
            orderStatusFilter = e.target.value;
            filterOrders();
        });

        dateFrom.addEventListener('change', (e) => {
            orderDateFrom = e.target.value;
            filterOrders();
        });

        dateTo.addEventListener('change', (e) => {
            orderDateTo = e.target.value;
            filterOrders();
        });

        clearBtn.addEventListener('click', () => {
            orderSearchTerm = '';
            orderStatusFilter = 'all';
            orderDateFrom = '';
            orderDateTo = '';
            searchInput.value = '';
            statusFilter.value = 'all';
            dateFrom.value = '';
            dateTo.value = '';
            filterOrders();
        });
    }

    function filterOrders() {
        const tbody = document.getElementById('orders-list');
        if (!tbody) return;

        requestAnimationFrame(() => {
            const rows = tbody.querySelectorAll('tr');
            let visibleCount = 0;
            let totalRows = 0;

            rows.forEach(row => {
                // Skip placeholder rows if they have single cell
                const cells = row.querySelectorAll('td');
                if (cells.length < 5) return;

                totalRows++;

                const statusCell = cells[4]?.textContent?.trim().toLowerCase() || '';
                const dateText = (cells[1]?.textContent || '').trim();
                const rowText = row.textContent.toLowerCase();

                let show = true;

                // Search
                if (orderSearchTerm && !rowText.includes(orderSearchTerm)) {
                    show = false;
                }

                // Status filter
                if (show && orderStatusFilter !== 'all') {
                    const statusMap = {
                        'pending': ['انتظار', 'قيد'],
                        'completed': ['مكتمل', 'تم'],
                        'cancelled': ['ملغ', 'مرفوض']
                    };
                    const keywords = statusMap[orderStatusFilter] || [];
                    const matchesStatus = keywords.some(k => statusCell.includes(k));
                    if (!matchesStatus) show = false;
                }

                // Date filter
                if (show && (orderDateFrom || orderDateTo)) {
                    const dateMatch = dateText.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
                    if (dateMatch) {
                        const rowDate = new Date(dateMatch[1]);
                        if (orderDateFrom && rowDate < new Date(orderDateFrom)) show = false;
                        if (orderDateTo && rowDate > new Date(orderDateTo + 'T23:59:59')) show = false;
                    }
                }

                row.style.display = show ? '' : 'none';
                if (show) visibleCount++;
            });

            const countEl = document.getElementById('order-filter-count');
            const clearBtn = document.getElementById('clear-order-filters');
            const hasFilters = orderSearchTerm || orderStatusFilter !== 'all' || orderDateFrom || orderDateTo;

            if (countEl) countEl.textContent = `${visibleCount} / ${totalRows}`;
            if (clearBtn) clearBtn.style.display = hasFilters ? '' : 'none';
        });
    }

    // ---- Targeted Initialization ----
    function setupObservers() {
        // Observer for Products List Changes
        const productsList = document.getElementById('products-list');
        if (productsList) {
            const productObserver = new MutationObserver(() => {
                if (productsList.children.length > 0 && !productsList.querySelector('.loading')) {
                    initProductSearch();
                    if (productSearchTerm || productVisibilityFilter !== 'all') {
                        filterProducts();
                    }
                }
            });
            productObserver.observe(productsList, { childList: true });
        }

        // Observer for Orders List Changes
        const ordersList = document.getElementById('orders-list');
        if (ordersList) {
            const orderObserver = new MutationObserver(() => {
                if (ordersList.children.length > 0 && !ordersList.querySelector('td[colspan]')) {
                    initOrderSearch();
                    if (orderSearchTerm || orderStatusFilter !== 'all') {
                        filterOrders();
                    }
                }
            });
            orderObserver.observe(ordersList, { childList: true });
        }
    }

    // Polling backup in case observers miss the initial load
    function pollForContent() {
        // Try setting up UI every 500ms for a few seconds
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (document.getElementById('products-list')?.children?.length > 0) initProductSearch();
            if (document.getElementById('orders-list')?.children?.length > 0) initOrderSearch();

            // Setup observers once elements exist
            if (document.getElementById('products-list') && document.getElementById('orders-list')) {
                setupObservers();
                clearInterval(interval);
            }

            if (attempts > 20) clearInterval(interval); // Stop after 10s
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', pollForContent);
    } else {
        pollForContent();
    }

    // Expose for external triggering
    window.adminFilterProducts = filterProducts;
    window.adminFilterOrders = filterOrders;
})();
