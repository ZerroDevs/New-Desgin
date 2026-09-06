// ============================================
// ADMIN NEWSLETTER — Manage Subscribers
// ============================================
(function () {
    'use strict';

    const NEWSLETTER_REF = 'newsletter';

    // ---- Inject Styles ----
    function injectNewsletterStyles() {
        if (document.getElementById('admin-newsletter-styles')) return;
        const style = document.createElement('style');
        style.id = 'admin-newsletter-styles';
        style.textContent = `
            .newsletter-card {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s;
                margin-bottom: 8px;
            }
            .newsletter-card:hover {
                border-color: rgba(255,255,255,0.15);
                background: rgba(255,255,255,0.06);
            }
            .newsletter-email {
                font-weight: 500;
                font-size: 0.95rem;
                color: #fff;
            }
            .newsletter-date {
                font-size: 0.75rem;
                color: rgba(255,255,255,0.4);
                margin-top: 4px;
            }
            .newsletter-actions button {
                padding: 6px 12px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Cairo', sans-serif;
                font-size: 0.75rem;
                transition: all 0.2s;
                background: rgba(255,59,48,0.15);
                color: #ff6b6b;
            }
            .newsletter-actions button:hover {
                background: rgba(255,59,48,0.3);
            }
            .newsletter-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
                gap: 1rem;
            }
            .btn-send-email {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
            }
            .btn-send-email:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(102,126,234,0.4);
            }
            .admin-stat-card {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 1rem;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    // ---- Inject Tab Content ----
    function injectNewsletterTab() {
        const main = document.querySelector('.admin-main');
        if (main && !document.getElementById('tab-newsletter')) {
            const tabContent = document.createElement('div');
            tabContent.id = 'tab-newsletter';
            tabContent.className = 'tab-content';
            tabContent.innerHTML = `
                <section class="form-section">
                    <div class="newsletter-header">
                        <div>
                            <h2 style="margin:0;">📧 النشرة البريدية (Newsteller)</h2>
                            <p style="color:rgba(255,255,255,0.4); font-size:0.85rem; margin-top:5px;">إدارة المشتركين في القائمة البريدية</p>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn-send-email" onclick="copyAllEmails()" style="background:rgba(255,255,255,0.1);">
                                📋 نسخ الكل
                            </button>
                            <a href="#" id="mailto-btn" class="btn-send-email" target="_blank">
                                🚀 إرسال للجميع
                            </a>
                        </div>
                    </div>

                    <div id="newsletter-stats" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin-bottom:1.5rem;">
                        <div class="admin-stat-card">
                            <div class="admin-stat-value" id="total-subscribers" style="color:#00b894; font-size:1.8rem; font-weight:800;">0</div>
                            <div class="admin-stat-label" style="font-size:0.75rem; color:rgba(255,255,255,0.4);">مشترك نشط</div>
                        </div>
                    </div>

                    <div id="newsletter-list" style="display:flex; flex-direction:column; gap:10px;">
                        <div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.4);">جاري التحميل...</div>
                    </div>
                </section>
            `;
            main.appendChild(tabContent);
        }
    }

    let allSubscribers = [];

    function loadSubscribers() {
        const db = firebase.database();
        db.ref(NEWSLETTER_REF).orderByChild('timestamp').once('value').then(snapshot => {
            const data = snapshot.val();
            allSubscribers = [];
            if (data) {
                // Firebase keys usually have commas instead of dots if we used safe keys
                // Or simply objects
                allSubscribers = Object.entries(data).map(([key, val]) => ({
                    id: key,
                    email: val.email || key.replace(/,/g, '.'), // fallback
                    timestamp: val.timestamp || Date.now()
                }));
                // Sort newest first
                allSubscribers.sort((a, b) => b.timestamp - a.timestamp);
            }
            renderSubscribers();
            updateMailtoLink();
        });
    }

    function renderSubscribers() {
        const listEl = document.getElementById('newsletter-list');
        const countEl = document.getElementById('total-subscribers');

        if (!listEl) return;

        if (countEl) countEl.textContent = allSubscribers.length;

        if (allSubscribers.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:2rem; color:rgba(255,255,255,0.3);">لا يوجد مشتركين حتى الآن 📭</div>';
            return;
        }

        listEl.innerHTML = allSubscribers.map(sub => {
            const date = new Date(sub.timestamp).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
            return `
                <div class="newsletter-card">
                    <div>
                        <div class="newsletter-email">${sub.email}</div>
                        <div class="newsletter-date">📅 ${date}</div>
                    </div>
                    <div class="newsletter-actions">
                        <button onclick="deleteSubscriber('${sub.id}')">🗑️ حذف</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateMailtoLink() {
        const btn = document.getElementById('mailto-btn');
        if (!btn) return;

        if (allSubscribers.length === 0) {
            btn.href = '#';
            btn.classList.add('disabled');
            return;
        }

        const emails = allSubscribers.map(s => s.email).join(',');
        // mailto limit is often 2000 chars, so for large lists this might break, but fine for now.
        // Using BCC to hide emails from each other
        btn.href = `mailto:noreply@zeronux.store?bcc=${emails}&subject=نشرة أخبار متجر زيرونكس&body=مرحباً،\n\nإليكم أحدث العروض من متجر زيرونكس...`;
    }

    window.deleteSubscriber = function (id) {
        if (!confirm('هل أنت متأكد من حذف هذا المشترك؟')) return;
        firebase.database().ref(NEWSLETTER_REF + '/' + id).remove().then(() => {
            if (typeof showNotification === 'function') showNotification('تم الحذف بنجاح');
            loadSubscribers();
        });
    };

    window.copyAllEmails = function () {
        const emails = allSubscribers.map(s => s.email).join(', ');
        navigator.clipboard.writeText(emails).then(() => {
            if (typeof showNotification === 'function') showNotification('📋 تم نسخ جميع الإيميلات', 'success');
        });
    };

    // ---- Init ----
    function init() {
        injectNewsletterStyles();
        injectNewsletterTab();

        let wasActive = false;

        // Check loop to handle "Reload on Open"
        setInterval(() => {
            const tab = document.getElementById('tab-newsletter');
            if (!tab) return;

            const isActive = tab.classList.contains('active') || tab.style.display === 'block';

            if (isActive && !wasActive) {
                // Just opened -> Reload
                loadSubscribers();
            }

            wasActive = isActive;
        }, 500);

        // Reload on sidebar click (Reload on Click)
        document.addEventListener('click', (e) => {
            // Admin Sidebar uses 'data-sidebar-tab', internal tabs use 'data-tab'
            const btn = e.target.closest('[data-sidebar-tab="newsletter"], [data-tab="newsletter"]');

            if (btn) {
                const list = document.getElementById('newsletter-list');
                const count = document.getElementById('total-subscribers');

                // Only if tab is already created (it should be)
                if (list) {
                    // Add simple loading indicator if not already there to show responsiveness
                    if (!list.innerHTML.includes('جاري التحديث')) {
                        list.style.opacity = '0.5';
                    }
                    if (count) count.textContent = '...';

                    loadSubscribers();

                    // Reset opacity after load (loadSubscribers re-renders list anyway)
                    setTimeout(() => { if (list) list.style.opacity = '1'; }, 500);
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }
})();
