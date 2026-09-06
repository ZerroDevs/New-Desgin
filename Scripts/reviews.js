// ============================================
// PRODUCT REVIEWS & RATINGS — Storefront
// ============================================
(function () {
    'use strict';

    const REVIEWS_REF = 'reviews';

    // Get visitor ID (shared with user-profile.js and support.js)
    function getVisitorId() {
        let id = localStorage.getItem('support_visitor_id');
        if (!id) {
            id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('support_visitor_id', id);
        }
        return id;
    }

    // ---- Inject Styles ----
    function injectReviewStyles() {
        if (document.getElementById('review-styles')) return;
        const style = document.createElement('style');
        style.id = 'review-styles';
        style.textContent = `
            /* Card Stars */
            .product-card-stars {
                display: flex;
                align-items: center;
                gap: 4px;
                margin: 4px 0;
                font-size: 0.8rem;
            }
            .product-card-stars .stars-display {
                color: #f5a623;
                letter-spacing: 1px;
                font-size: 0.75rem;
            }
            .product-card-stars .rating-count {
                color: rgba(255,255,255,0.4);
                font-size: 0.7rem;
            }

            /* Modal Review Section */
            .reviews-section {
                padding: 1.5rem 2rem;
                border-top: 1px solid rgba(255,255,255,0.08);
            }
            .reviews-section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            .reviews-section-header h3 {
                font-size: 1.2rem;
                margin: 0;
                font-family: 'Outfit', sans-serif;
            }
            .write-review-btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                border: none;
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'Cairo', sans-serif;
                font-size: 0.8rem;
                font-weight: 600;
                transition: all 0.2s;
            }
            .write-review-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 15px rgba(102,126,234,0.4);
            }

            /* Review Summary */
            .review-summary {
                display: flex;
                align-items: center;
                gap: 1.5rem;
                padding: 1rem;
                background: rgba(255,255,255,0.03);
                border-radius: 12px;
                margin-bottom: 1rem;
            }
            .review-avg {
                text-align: center;
                min-width: 70px;
            }
            .review-avg-number {
                font-size: 2.2rem;
                font-weight: 800;
                color: #f5a623;
                line-height: 1;
            }
            .review-avg-stars {
                color: #f5a623;
                font-size: 0.9rem;
                margin-top: 4px;
            }
            .review-avg-count {
                font-size: 0.75rem;
                color: rgba(255,255,255,0.4);
                margin-top: 2px;
            }
            .review-bars {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .review-bar-row {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.75rem;
            }
            .review-bar-label {
                min-width: 14px;
                color: rgba(255,255,255,0.5);
            }
            .review-bar-track {
                flex: 1;
                height: 6px;
                background: rgba(255,255,255,0.08);
                border-radius: 3px;
                overflow: hidden;
            }
            .review-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #f5a623, #f7c948);
                border-radius: 3px;
                transition: width 0.4s ease;
            }

            /* Review List */
            .reviews-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-height: 300px;
                overflow-y: auto;
                padding-right: 4px;
            }
            .reviews-list::-webkit-scrollbar { width: 4px; }
            .reviews-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            .review-item {
                padding: 1rem;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 10px;
                transition: all 0.2s;
            }
            .review-item:hover {
                border-color: rgba(255,255,255,0.12);
            }
            .review-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            .review-item-name {
                font-weight: 600;
                font-size: 0.9rem;
            }
            .review-item-date {
                font-size: 0.7rem;
                color: rgba(255,255,255,0.35);
            }
            .review-item-stars {
                color: #f5a623;
                font-size: 0.8rem;
                margin-bottom: 6px;
            }
            .review-item-text {
                color: rgba(255,255,255,0.7);
                font-size: 0.85rem;
                line-height: 1.5;
            }
            .no-reviews-msg {
                text-align: center;
                padding: 2rem 1rem;
                color: rgba(255,255,255,0.3);
                font-size: 0.9rem;
            }

            /* Review Form */
            .review-form-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(10px);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            .review-form-modal {
                background: linear-gradient(145deg, rgba(26,26,46,0.97), rgba(22,33,62,0.98));
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 2rem;
                max-width: 400px;
                width: 92%;
                direction: rtl;
                color: white;
                animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .review-form-modal h3 {
                margin: 0 0 6px 0;
                font-size: 1.2rem;
            }
            .review-form-modal .form-subtitle {
                color: rgba(255,255,255,0.4);
                font-size: 0.8rem;
                margin-bottom: 1.2rem;
            }
            .star-selector {
                display: flex;
                gap: 6px;
                font-size: 1.8rem;
                margin-bottom: 1rem;
                direction: ltr;
            }
            .star-selector span {
                cursor: pointer;
                transition: all 0.15s;
                filter: grayscale(1) opacity(0.4);
            }
            .star-selector span.active {
                filter: none;
                transform: scale(1.15);
            }
            .star-selector span:hover {
                filter: none;
                transform: scale(1.2);
            }
            .review-input {
                width: 100%;
                padding: 10px 14px;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.12);
                background: rgba(255,255,255,0.06);
                color: white;
                font-family: 'Cairo', sans-serif;
                font-size: 0.9rem;
                box-sizing: border-box;
                margin-bottom: 10px;
            }
            .review-input::placeholder { color: rgba(255,255,255,0.3); }
            textarea.review-input { resize: none; min-height: 80px; }
            .review-submit-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 12px;
                font-family: 'Cairo', sans-serif;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 6px;
            }
            .review-submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102,126,234,0.4);
            }
            .review-submit-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
        `;
        document.head.appendChild(style);
    }

    // ---- Star HTML Helpers ----
    function starsHTML(rating, size) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        let stars = '';
        for (let i = 0; i < full; i++) stars += '★';
        for (let i = 0; i < half; i++) stars += '★'; // half looks like full in text
        for (let i = 0; i < empty; i++) stars += '☆';
        return stars;
    }

    // ---- Cache for loaded reviews ----
    const reviewsCache = {};

    // ---- Load Reviews for a Product ----
    function loadProductReviews(productId, callback) {
        if (reviewsCache[productId]) {
            callback(reviewsCache[productId]);
            return;
        }

        const db = firebase.database();
        db.ref(REVIEWS_REF).orderByChild('productId').equalTo(productId).once('value').then(snapshot => {
            const data = snapshot.val();
            let reviews = [];
            if (data) {
                reviews = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
                reviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
            reviewsCache[productId] = reviews;
            callback(reviews);
        }).catch(err => {
            console.warn('Review load error:', err);
            callback([]);
        });
    }

    // ---- Calculate Stats ----
    function calcStats(reviews) {
        if (!reviews || reviews.length === 0) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] };
        const dist = [0, 0, 0, 0, 0]; // 1-5 stars
        let sum = 0;
        reviews.forEach(r => {
            const s = Math.min(5, Math.max(1, r.rating || 0));
            dist[s - 1]++;
            sum += s;
        });
        return { avg: sum / reviews.length, count: reviews.length, dist };
    }

    // ---- Inject Stars on Product Cards (after products load) ----
    window.injectCardRatings = function () {
        const cards = document.querySelectorAll('.product-card[data-product-id]');
        cards.forEach(card => {
            if (card.querySelector('.product-card-stars')) return; // already injected
            const productId = card.getAttribute('data-product-id');
            const descEl = card.querySelector('.product-description');
            if (!descEl) return;

            // Create placeholder
            const starsEl = document.createElement('div');
            starsEl.className = 'product-card-stars';
            starsEl.innerHTML = '<span class="stars-display" style="opacity:0.3">☆☆☆☆☆</span>';
            descEl.insertAdjacentElement('afterend', starsEl);

            // Load reviews
            loadProductReviews(productId, (reviews) => {
                const stats = calcStats(reviews);
                if (stats.count > 0) {
                    starsEl.innerHTML = `
                        <span class="stars-display">${starsHTML(stats.avg)}</span>
                        <span class="rating-count">(${stats.count})</span>
                    `;
                } else {
                    starsEl.innerHTML = `<span class="stars-display" style="opacity:0.3">☆☆☆☆☆</span><span class="rating-count" style="opacity:0.3">لا تقييمات</span>`;
                }
            });
        });
    };

    // ---- Build Reviews Section for Product Modal ----
    window.buildReviewsSection = function (productId) {
        const container = document.createElement('div');
        container.className = 'reviews-section';
        container.id = 'product-reviews-section';
        container.innerHTML = `
            <div class="reviews-section-header">
                <h3>⭐ التقييمات والآراء</h3>
                <button class="write-review-btn" onclick="window.openReviewForm('${productId}')">✍️ اكتب تقييمك</button>
            </div>
            <div id="reviews-loading" style="text-align:center; padding:1rem; color:rgba(255,255,255,0.3); font-size:0.85rem;">
                جاري تحميل التقييمات...
            </div>
        `;

        // Load reviews
        loadProductReviews(productId, (reviews) => {
            const loadingEl = container.querySelector('#reviews-loading');
            if (!loadingEl) return;

            const stats = calcStats(reviews);

            if (reviews.length === 0) {
                loadingEl.innerHTML = `
                    <div class="no-reviews-msg">
                        <div style="font-size:2.5rem; margin-bottom:8px;">📝</div>
                        لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!
                    </div>
                `;
                return;
            }

            // Build summary
            let barsHTML = '';
            for (let i = 5; i >= 1; i--) {
                const count = stats.dist[i - 1];
                const pct = stats.count > 0 ? (count / stats.count * 100) : 0;
                barsHTML += `
                    <div class="review-bar-row">
                        <span class="review-bar-label">${i}</span>
                        <div class="review-bar-track"><div class="review-bar-fill" style="width:${pct}%"></div></div>
                    </div>
                `;
            }

            // Build review items
            let itemsHTML = '';
            reviews.forEach(r => {
                const date = new Date(r.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
                itemsHTML += `
                    <div class="review-item">
                        <div class="review-item-header">
                            <span class="review-item-name">👤 ${r.name || 'زائر'}</span>
                            <span class="review-item-date">${date}</span>
                        </div>
                        <div class="review-item-stars">${starsHTML(r.rating)}</div>
                        ${r.text ? `<div class="review-item-text">${r.text}</div>` : ''}
                    </div>
                `;
            });

            loadingEl.outerHTML = `
                <div class="review-summary">
                    <div class="review-avg">
                        <div class="review-avg-number">${stats.avg.toFixed(1)}</div>
                        <div class="review-avg-stars">${starsHTML(stats.avg)}</div>
                        <div class="review-avg-count">${stats.count} تقييم</div>
                    </div>
                    <div class="review-bars">${barsHTML}</div>
                </div>
                <div class="reviews-list">${itemsHTML}</div>
            `;
        });

        return container;
    };

    // ---- Open Review Form ----
    window.openReviewForm = function (productId) {
        // Remove existing
        const existing = document.querySelector('.review-form-overlay');
        if (existing) existing.remove();

        const profile = typeof getUserProfile === 'function' ? getUserProfile() : null;

        const overlay = document.createElement('div');
        overlay.className = 'review-form-overlay';

        overlay.innerHTML = `
            <div class="review-form-modal">
                <h3>✍️ اكتب تقييمك</h3>
                <p class="form-subtitle">شاركنا رأيك في هذا المنتج</p>
                
                <div class="star-selector" id="review-star-selector">
                    <span data-star="1">⭐</span>
                    <span data-star="2">⭐</span>
                    <span data-star="3">⭐</span>
                    <span data-star="4">⭐</span>
                    <span data-star="5">⭐</span>
                </div>

                <input type="text" class="review-input" id="review-name" placeholder="اسمك" value="${profile && profile.name ? profile.name : ''}">
                <textarea class="review-input" id="review-text" placeholder="اكتب رأيك هنا... (اختياري)"></textarea>
                
                <button class="review-submit-btn" id="review-submit-btn" disabled>إرسال التقييم ⭐</button>
                <button style="width:100%; margin-top:6px; padding:8px; background:transparent; border:1px solid rgba(255,255,255,0.08); border-radius:10px; color:rgba(255,255,255,0.3); cursor:pointer; font-family:'Cairo',sans-serif;" onclick="this.closest('.review-form-overlay').remove()">إلغاء</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Star selector logic
        let selectedRating = 0;
        const starSelector = document.getElementById('review-star-selector');
        const submitBtn = document.getElementById('review-submit-btn');
        const stars = starSelector.querySelectorAll('span');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.star);
                stars.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.star) <= selectedRating);
                });
                submitBtn.disabled = false;
            });

            star.addEventListener('mouseenter', () => {
                const hoverVal = parseInt(star.dataset.star);
                stars.forEach(s => {
                    const val = parseInt(s.dataset.star);
                    s.style.filter = val <= hoverVal ? 'none' : 'grayscale(1) opacity(0.4)';
                    s.style.transform = val <= hoverVal ? 'scale(1.15)' : 'scale(1)';
                });
            });
        });

        starSelector.addEventListener('mouseleave', () => {
            stars.forEach(s => {
                const val = parseInt(s.dataset.star);
                s.style.filter = val <= selectedRating ? 'none' : 'grayscale(1) opacity(0.4)';
                s.style.transform = val <= selectedRating ? 'scale(1.15)' : 'scale(1)';
            });
        });

        // Submit
        submitBtn.addEventListener('click', () => {
            if (selectedRating === 0) return;
            submitBtn.disabled = true;
            submitBtn.textContent = 'جاري الإرسال...';

            const name = document.getElementById('review-name').value.trim() || 'زائر';
            const text = document.getElementById('review-text').value.trim();
            const visitorId = getVisitorId();

            const reviewData = {
                productId: productId,
                visitorId: visitorId,
                name: name,
                rating: selectedRating,
                text: text,
                timestamp: Date.now()
            };

            firebase.database().ref(REVIEWS_REF).push(reviewData).then(() => {
                // Clear cache for this product
                delete reviewsCache[productId];

                overlay.remove();
                if (typeof showNotification === 'function') {
                    showNotification('تم إرسال تقييمك بنجاح! ⭐');
                }

                // Refresh reviews section if visible
                const existingSection = document.getElementById('product-reviews-section');
                if (existingSection) {
                    const newSection = buildReviewsSection(productId);
                    existingSection.replaceWith(newSection);
                }

                // Refresh card stars
                setTimeout(() => {
                    const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
                    if (card) {
                        const starsEl = card.querySelector('.product-card-stars');
                        if (starsEl) starsEl.remove();
                    }
                    injectCardRatings();
                }, 500);
            }).catch(err => {
                console.error('Review submit error:', err);
                submitBtn.textContent = 'حدث خطأ، حاول مرة أخرى';
                submitBtn.disabled = false;
            });
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    };

    // ---- Init ----
    function init() {
        injectReviewStyles();

        // Inject stars on cards once products are rendered
        // Use MutationObserver to detect when product cards appear
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('product-card')) {
                            setTimeout(injectCardRatings, 100);
                            return;
                        }
                        if (node.querySelector && node.querySelector('.product-card')) {
                            setTimeout(injectCardRatings, 100);
                            return;
                        }
                    }
                }
            }
        });

        const grid = document.getElementById('products-grid') || document.querySelector('.products-grid');
        if (grid) {
            observer.observe(grid, { childList: true, subtree: true });
        } else {
            // Fallback: observe body
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Also inject on existing cards
        setTimeout(injectCardRatings, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 200);
    }
})();
