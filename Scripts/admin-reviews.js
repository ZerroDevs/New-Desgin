// ============================================
// ADMIN REVIEWS — Moderate product reviews
// ============================================
(function () {
    'use strict';

    const REVIEWS_REF = 'reviews';

    // ---- Inject Styles ----
    function injectAdminReviewStyles() {
        if (document.getElementById('admin-review-styles')) return;
        const style = document.createElement('style');
        style.id = 'admin-review-styles';
        style.textContent = `
            .admin-review-card {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 1.2rem;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                transition: all 0.2s;
            }
            .admin-review-card:hover {
                border-color: rgba(255,255,255,0.15);
                background: rgba(255,255,255,0.06);
            }
            .admin-review-info { flex: 1; }
            .admin-review-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 6px;
                flex-wrap: wrap;
            }
            .admin-review-name {
                font-weight: 600;
                font-size: 0.95rem;
            }
            .admin-review-product {
                background: rgba(102,126,234,0.15);
                color: #a4b4ff;
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 0.75rem;
            }
            .admin-review-date {
                font-size: 0.72rem;
                color: rgba(255,255,255,0.3);
            }
            .admin-review-stars {
                color: #f5a623;
                font-size: 0.85rem;
                margin-bottom: 4px;
            }
            .admin-review-text {
                color: rgba(255,255,255,0.65);
                font-size: 0.85rem;
                line-height: 1.5;
            }
            .admin-review-actions {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .admin-review-actions button {
                padding: 6px 12px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Cairo', sans-serif;
                font-size: 0.75rem;
                transition: all 0.2s;
            }
            .admin-review-delete {
                background: rgba(255,59,48,0.15);
                color: #ff6b6b;
            }
            .admin-review-delete:hover {
                background: rgba(255,59,48,0.3);
            }
            .admin-stat-card {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 1rem;
                text-align: center;
            }
            .admin-stat-value {
                font-size: 1.8rem;
                font-weight: 800;
                margin-bottom: 4px;
            }
            .admin-stat-label {
                font-size: 0.75rem;
                color: rgba(255,255,255,0.4);
            }
        `;
        document.head.appendChild(style);
    }

    // ---- Inject Tab (same pattern as admin-seo.js) ----
    function injectReviewsTab() {
        const tabs = document.querySelector('.admin-tabs');
        if (!tabs || document.getElementById('tab-btn-reviews')) return;

        // Add tab button before Settings
        const settingsBtn = tabs.querySelector('[onclick*="settings"]');
        if (settingsBtn) {
            const reviewsBtn = document.createElement('button');
            reviewsBtn.className = 'tab-btn';
            reviewsBtn.id = 'tab-btn-reviews';
            reviewsBtn.setAttribute('onclick', "switchTab('reviews')");
            reviewsBtn.innerHTML = '<span>⭐</span> التقييمات';
            settingsBtn.before(reviewsBtn);
        }

        // Tab content panel
        const main = document.querySelector('.admin-main');
        if (main) {
            const tabContent = document.createElement('div');
            tabContent.id = 'tab-reviews';
            tabContent.className = 'tab-content';
            tabContent.innerHTML = `
                <section class="form-section">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
                        <h2 style="margin:0;">⭐ إدارة التقييمات</h2>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <select id="reviews-filter" style="padding:8px 14px; border-radius:8px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:white; cursor:pointer; font-family:'Cairo',sans-serif;">
                                <option value="all">الكل</option>
                                <option value="5">5 نجوم</option>
                                <option value="4">4 نجوم</option>
                                <option value="3">3 نجوم</option>
                                <option value="2">نجمتان</option>
                                <option value="1">نجمة واحدة</option>
                            </select>
                        </div>
                    </div>

                    <div id="admin-reviews-stats" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:12px; margin-bottom:1.5rem;"></div>

                    <div id="admin-reviews-list" style="display:flex; flex-direction:column; gap:10px;">
                        <div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.4);">اضغط على التبويب لتحميل التقييمات</div>
                    </div>
                </section>
            `;
            main.appendChild(tabContent);
        }
    }

    let allAdminReviews = [];
    let reviewsLoaded = false;

    function loadAdminReviews() {
        const db = firebase.database();
        db.ref(REVIEWS_REF).orderByChild('timestamp').once('value').then(snapshot => {
            const data = snapshot.val();
            allAdminReviews = [];
            if (data) {
                allAdminReviews = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
                allAdminReviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
            renderAdminReviews();
        });
    }

    function renderAdminReviews() {
        const filterEl = document.getElementById('reviews-filter');
        const filter = filterEl ? filterEl.value : 'all';
        let filtered = allAdminReviews;
        if (filter !== 'all') {
            filtered = allAdminReviews.filter(r => r.rating === parseInt(filter));
        }

        // Stats
        const statsEl = document.getElementById('admin-reviews-stats');
        if (!statsEl) return;

        const total = allAdminReviews.length;
        const avg = total > 0 ? (allAdminReviews.reduce((s, r) => s + (r.rating || 0), 0) / total) : 0;
        const fiveStars = allAdminReviews.filter(r => r.rating === 5).length;
        const lowStars = allAdminReviews.filter(r => r.rating <= 2).length;

        statsEl.innerHTML = `
            <div class="admin-stat-card"><div class="admin-stat-value" style="color:#f5a623;">${total}</div><div class="admin-stat-label">إجمالي التقييمات</div></div>
            <div class="admin-stat-card"><div class="admin-stat-value" style="color:#00b894;">${avg.toFixed(1)}</div><div class="admin-stat-label">متوسط التقييم</div></div>
            <div class="admin-stat-card"><div class="admin-stat-value" style="color:#f5a623;">${fiveStars}</div><div class="admin-stat-label">5 نجوم ⭐</div></div>
            <div class="admin-stat-card"><div class="admin-stat-value" style="color:#ff6b6b;">${lowStars}</div><div class="admin-stat-label">تقييمات سلبية</div></div>
        `;

        // List
        const listEl = document.getElementById('admin-reviews-list');
        if (!listEl) return;

        if (filtered.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.3);">لا توجد تقييمات</div>';
            return;
        }

        const starsHTML = (rating) => {
            let s = '';
            for (let i = 1; i <= 5; i++) s += i <= rating ? '★' : '☆';
            return s;
        };

        // Load product names for display
        firebase.database().ref('products').once('value').then(snap => {
            const products = snap.val() || {};

            listEl.innerHTML = filtered.map(r => {
                const productName = products[r.productId] ? products[r.productId].name : r.productId;
                const date = new Date(r.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
                return `
                    <div class="admin-review-card">
                        <div class="admin-review-info">
                            <div class="admin-review-header">
                                <span class="admin-review-name">👤 ${r.name || 'زائر'}</span>
                                <span class="admin-review-product">${productName}</span>
                                <span class="admin-review-date">${date}</span>
                            </div>
                            <div class="admin-review-stars">${starsHTML(r.rating)}</div>
                            ${r.text ? `<div class="admin-review-text">${r.text}</div>` : '<div class="admin-review-text" style="font-style:italic; opacity:0.4;">بدون تعليق</div>'}
                        </div>
                        <div class="admin-review-actions">
                            <button class="admin-review-delete" onclick="deleteAdminReview('${r.id}')">🗑️ حذف</button>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    // Delete review
    window.deleteAdminReview = function (reviewId) {
        if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

        firebase.database().ref(REVIEWS_REF + '/' + reviewId).remove().then(() => {
            if (typeof showNotification === 'function') {
                showNotification('تم حذف التقييم ✅');
            }
            loadAdminReviews();
        }).catch(err => {
            console.error('Delete review error:', err);
        });
    };

    // ---- Init ----
    function init() {
        injectAdminReviewStyles();
        injectReviewsTab();

        // Load reviews when old tab button is clicked
        const tabBtn = document.getElementById('tab-btn-reviews');
        if (tabBtn) {
            tabBtn.addEventListener('click', () => {
                loadAdminReviews();
            });
        }

        // Also detect tab activation via sidebar / switchTab()
        const checkTab = setInterval(() => {
            const tabPanel = document.getElementById('tab-reviews');
            if (tabPanel) {
                clearInterval(checkTab);
                const observer = new MutationObserver(() => {
                    if (tabPanel.classList.contains('active')) {
                        loadAdminReviews();
                    }
                });
                observer.observe(tabPanel, { attributes: true, attributeFilter: ['class'] });
            }
        }, 500);

        // Filter change
        setTimeout(() => {
            const filterEl = document.getElementById('reviews-filter');
            if (filterEl) {
                filterEl.addEventListener('change', () => renderAdminReviews());
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 300);
    }
})();
