// ============================================
// GLOBAL SEARCH OVERLAY
// ============================================
function openGlobalSearchOverlay() {
    // Prevent duplicates
    if (document.getElementById('global-search-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'global-search-overlay';
    overlay.innerHTML = `
        <div class="gso-container">
            <div class="gso-header">
                <div class="gso-input-wrap">
                    <span class="gso-search-icon">🔍</span>
                    <input type="text" id="gso-input" placeholder="ابحث عن الملابس، العطور، والمنتجات..." autocomplete="off" autofocus>
                </div>
                <button class="gso-close-btn" aria-label="إغلاق">✕</button>
            </div>
            <div class="gso-results" id="gso-results">
                <div class="gso-hint">
                    <span style="font-size:2.5rem">🔎</span>
                    <p>اكتب للبحث في تشكيلات الملابس والعطور والمنتجات</p>
                </div>
            </div>
        </div>
    `;

    // Inject styles (only once)
    if (!document.getElementById('gso-styles')) {
        const style = document.createElement('style');
        style.id = 'gso-styles';
        style.textContent = `
            #global-search-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(7, 11, 20, 0.96);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                z-index: 100000;
                display: flex;
                flex-direction: column;
                animation: gsoFadeIn 0.25s ease-out;
            }
            @keyframes gsoFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes gsoSlideDown {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .gso-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                max-width: 600px;
                width: 100%;
                margin: 0 auto;
                padding: 1rem;
            }
            .gso-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.5rem 0 1rem;
                animation: gsoSlideDown 0.3s ease-out;
            }
            .gso-input-wrap {
                flex: 1;
                position: relative;
            }
            .gso-search-icon {
                position: absolute;
                right: 1rem;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1.1rem;
                pointer-events: none;
            }
            #gso-input {
                width: 100%;
                padding: 1rem 3rem 1rem 1rem;
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(56, 189, 248, 0.2);
                border-radius: 14px;
                color: white;
                font-family: 'Cairo', 'Inter', sans-serif;
                font-size: 1rem;
                direction: rtl;
                outline: none;
                transition: all 0.3s ease;
            }
            #gso-input:focus {
                border-color: #0ea5e9;
                background: rgba(15, 23, 42, 0.95);
                box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.25);
            }
            #gso-input::placeholder { color: rgba(255,255,255,0.4); }
            .gso-close-btn {
                width: 44px; height: 44px;
                border-radius: 12px;
                border: 1px solid rgba(56, 189, 248, 0.2);
                background: rgba(15, 23, 42, 0.6);
                color: white;
                font-size: 1.1rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }
            .gso-close-btn:hover { background: rgba(14, 165, 233, 0.2); border-color: #38bdf8; }
            .gso-results {
                flex: 1;
                overflow-y: auto;
                padding-bottom: 2rem;
                direction: rtl;
            }
            .gso-hint {
                text-align: center;
                color: rgba(255,255,255,0.4);
                padding: 3rem 1rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
            }
            .gso-hint p { margin: 0; font-size: 1rem; }
            .gso-section-title {
                font-size: 0.85rem;
                color: #38bdf8;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 1.25rem 0 0.5rem;
                padding-bottom: 0.4rem;
                border-bottom: 1px solid rgba(56, 189, 248, 0.15);
            }
            .gso-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                color: white;
                border: 1px solid transparent;
                animation: gsoSlideDown 0.3s ease-out both;
            }
            .gso-item:hover, .gso-item:active {
                background: rgba(14, 165, 233, 0.12);
                border-color: rgba(56, 189, 248, 0.25);
                transform: translateX(-3px);
            }
            .gso-item-img {
                width: 50px; height: 50px;
                border-radius: 10px;
                object-fit: cover;
                background: rgba(255,255,255,0.05);
                flex-shrink: 0;
            }
            .gso-item-info {
                flex: 1;
                min-width: 0;
            }
            .gso-item-name {
                font-weight: 600;
                font-size: 0.95rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 2px;
            }
            .gso-item-meta {
                font-size: 0.8rem;
                color: rgba(255,255,255,0.5);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .gso-item-price {
                font-weight: 700;
                font-size: 0.9rem;
                color: #38bdf8;
                white-space: nowrap;
                flex-shrink: 0;
            }
            .gso-no-results {
                text-align: center;
                padding: 3rem 1rem;
                color: rgba(255,255,255,0.4);
            }
            .gso-no-results span { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
            .gso-loading {
                text-align: center;
                padding: 2rem;
                color: #38bdf8;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Focus input
    const input = document.getElementById('gso-input');
    setTimeout(() => input.focus(), 100);

    // Close handlers
    const closeOverlay = () => {
        overlay.style.animation = 'gsoFadeIn 0.2s ease-out reverse';
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
        }, 180);
    };

    overlay.querySelector('.gso-close-btn').onclick = closeOverlay;
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
    });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeOverlay();
            document.removeEventListener('keydown', escHandler);
        }
    });

    // Debounced search
    let searchTimeout;
    let cachedProducts = null;
    let cachedBooks = null;

    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performGlobalSearch(input.value.trim()), 300);
    });

    function performGlobalSearch(query) {
        const resultsContainer = document.getElementById('gso-results');
        if (!resultsContainer) return;

        if (!query) {
            resultsContainer.innerHTML = `
                <div class="gso-hint">
                    <span style="font-size:2.5rem">🔎</span>
                    <p>اكتب للبحث في المنتجات والكتب</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = '<div class="gso-loading">جاري البحث...</div>';

        // Fetch data (cache after first load)
        const db = window.database || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
        if (!db) {
            resultsContainer.innerHTML = '<div class="gso-no-results"><span>⚠️</span><p>قاعدة البيانات غير متوفرة</p></div>';
            return;
        }

        const fetchProducts = cachedProducts
            ? Promise.resolve(cachedProducts)
            : db.ref('products').once('value').then(snap => { cachedProducts = snap.val() || {}; return cachedProducts; });

        fetchProducts.then(products => {
            const q = query.toLowerCase();
            let html = '';

            // Search products
            const productResults = [];
            Object.entries(products).forEach(([id, p]) => {
                if (p.visible === false) return;
                const name = (p.name || '').toLowerCase();
                const desc = (p.description || p.shortDesc || '').toLowerCase();
                const exact = name.includes(q) || desc.includes(q);
                const fuzzy = !exact && q.length > 2 && name.split(' ').some(w => levenshteinDist(q, w) <= 2);
                if (exact || fuzzy) {
                    productResults.push({ id, ...p });
                }
            });

            if (productResults.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="gso-no-results">
                        <span>🤔</span>
                        <p>لم نجد نتائج لـ "${query}"</p>
                        <p style="font-size:0.85rem;margin-top:0.5rem">جرب كلمات مفتاحية أخرى</p>
                    </div>
                `;
                return;
            }

            // Render product results
            html += `<div class="gso-section-title">🛍️ المنتجات (${productResults.length})</div>`;
            productResults.forEach((p, i) => {
                const price = p.priceType === 'contact' ? '📞 تواصل' :
                    p.priceType === 'negotiable' ? '🤝 تفاوض' :
                        p.price ? `${parseFloat(p.price).toFixed(2)} د.ل` : '';
                html += `
                    <a href="product.html?id=${p.id}" class="gso-item" style="animation-delay: ${i * 0.05}s">
                        <img class="gso-item-img" src="${p.image || 'Images/Logo-noBG.png'}" alt="${p.name}" onerror="this.src='Images/Logo-noBG.png'">
                        <div class="gso-item-info">
                            <div class="gso-item-name">${p.name}</div>
                            <div class="gso-item-meta">${p.shortDesc || (p.description || '').substring(0, 50)}</div>
                        </div>
                        <div class="gso-item-price">${price}</div>
                    </a>
                `;
            });

            resultsContainer.innerHTML = html;
        }).catch(err => {
            console.error('Global search error:', err);
            resultsContainer.innerHTML = '<div class="gso-no-results"><span>⚠️</span><p>حدث خطأ أثناء البحث</p></div>';
        });
    }
}

// Levenshtein distance for fuzzy matching
function levenshteinDist(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
