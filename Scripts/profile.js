(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {

        // --- UI References ---
        const tabs = document.querySelectorAll('.nav-item[data-tab]');
        const panels = document.querySelectorAll('.tab-panel');
        const loadingOverlay = document.getElementById('loading-overlay');
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const sidebarName = document.getElementById('sidebar-name');
        const sidebarEmail = document.getElementById('sidebar-email');
        const welcomeName = document.getElementById('welcome-name');
        const navOrderCount = document.getElementById('nav-order-count');

        // Stats Refs
        const statTotalSpent = document.getElementById('stat-total-spent');
        const statTotalOrders = document.getElementById('stat-total-orders');
        const statWishlistCount = document.getElementById('stat-wishlist-count');
        const latestOrderPreview = document.getElementById('latest-order-preview');

        // Form Refs
        const profileForm = document.getElementById('profile-form');
        const saveBtn = document.getElementById('save-btn');
        const pName = document.getElementById('p-name');
        const pPhone = document.getElementById('p-phone');
        const pCity = document.getElementById('p-city');
        const pAddress = document.getElementById('p-address');
        const pEmail = document.getElementById('p-email');
        const pNotes = document.getElementById('p-notes');
        const changePassBtn = document.getElementById('change-pass-btn');

        let currentUser = null;
        let userProfile = null;
        let userOrders = [];

        // --- 1. Tab Navigation ---
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                // Redirect Orders to uorder.html
                if (target === 'orders') {
                    window.location.href = 'uorder.html';
                    return;
                }

                // Active Class on Nav
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show Panel
                panels.forEach(p => p.classList.remove('active'));
                document.getElementById(`tab-${target}`).classList.add('active');

                // If specific tab needs refresh
                if (target === 'wishlist') renderWishlist();
                if (target === 'orders') renderOrders();
            });
        });

        // Logout from Sidebar
        const logoutBtn = document.getElementById('logout-btn-sidebar');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                firebase.auth().signOut().then(() => window.location.href = 'index.html');
            });
        }

        // --- 2. Auth & Data Loading ---
        firebase.auth().onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            currentUser = user;

            // Load Profile Data
            loadUserProfile((profile) => {
                userProfile = profile || {};
                updateUI(user, userProfile);
                loadOrders(user.uid);
            });
        });

        function updateUI(user, profile) {
            // Sidebar & Header
            const name = profile.name || user.displayName || 'المستخدم';
            const email = user.email;

            sidebarName.textContent = name;
            sidebarEmail.textContent = email;
            welcomeName.textContent = name;

            // Avatar
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            sidebarAvatar.textContent = initials;

            // Form Fields
            pName.value = name;
            pEmail.value = email;
            pPhone.value = profile.phone || '';
            pCity.value = profile.city || '';
            pAddress.value = profile.address || '';
            pNotes.value = profile.notes || '';

            loadingOverlay.style.display = 'none';
        }

        // --- 3. Save Profile ---
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '⏳ جاري الحفظ...';

            const data = {
                name: pName.value.trim(),
                phone: pPhone.value.trim(),
                city: pCity.value.trim(),
                address: pAddress.value.trim(),
                notes: pNotes.value.trim()
            };

            try {
                await saveUserProfile(data);

                // Update specific UI parts
                sidebarName.textContent = data.name;
                welcomeName.textContent = data.name;
                const initials = data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                sidebarAvatar.textContent = initials;

                if (window.showNotification) window.showNotification('✅ تم حفظ التغييرات');
                else alert('✅ تم حفظ التغييرات');

            } catch (err) {
                console.error(err);
                alert('❌ حدث خطأ');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        });

        // --- 4. Load Orders & Stats ---
        function loadOrders(uid) {
            const db = firebase.database();

            // Query orders by userId
            db.ref('orders').orderByChild('userId').equalTo(uid).once('value')
                .then(snapshot => {
                    const ordersObj = snapshot.val();
                    if (ordersObj) {
                        // Convert to array and sort desc
                        userOrders = Object.entries(ordersObj).map(([key, val]) => ({
                            id: key,
                            ...val
                        })).sort((a, b) => b.timestamp - a.timestamp);
                    } else {
                        userOrders = [];
                    }

                    updateStats();
                    renderOrders();
                    renderLatestOrder();
                });
        }

        function updateStats() {
            // 1. Total Count
            navOrderCount.textContent = userOrders.length;
            statTotalOrders.textContent = userOrders.length;

            // 2. Total Spent
            const totalSpent = userOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
            statTotalSpent.textContent = '$' + totalSpent.toLocaleString();

            // 3. Wishlist Count
            // Assuming 'wishlist' array is available globally (from app.js logic)
            // But app.js might not expose it directly as a variable we can read instantly if it loads async.
            // Let's try reading from localStorage directly for immediate stats
            try {
                const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                statWishlistCount.textContent = storedWishlist.length;
            } catch (e) {
                statWishlistCount.textContent = '0';
            }
        }

        function renderOrders() {
            const container = document.getElementById('orders-list-container');
            if (userOrders.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">
                        <div style="font-size: 3rem; margin-bottom: 10px;">📦</div>
                        <p>لا توجد طلبات سابقة.</p>
                        <a href="index.html" style="color: var(--primary); text-decoration: none; margin-top: 10px; display: inline-block;">تصفح المنتجات</a>
                    </div>
                `;
                return;
            }

            let html = '';
            userOrders.forEach(order => {
                const date = new Date(order.timestamp).toLocaleDateString('ar-LY', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                let statusClass = 'status-pending';
                let statusText = 'قيد المعالجة';
                if (order.status === 'completed') { statusClass = 'status-completed'; statusText = 'مكتمل'; }
                if (order.status === 'cancelled') { statusClass = 'status-cancelled'; statusText = 'ملغى'; }

                // Items list summary
                const items = order.items || order.cart;
                const itemsSummary = items ? items.map(i => `${i.name} (x${i.quantity || 1})`).join(', ') : 'تفاصيل غير متوفرة';

                html += `
                    <div class="order-card">
                        <div class="order-header">
                            <div class="order-id">
                                <span>#${order.id.substring(order.id.length - 6).toUpperCase()}</span>
                                <span class="order-status ${statusClass}">${statusText}</span>
                            </div>
                            <div class="order-date">${date}</div>
                        </div>
                        <div class="order-items">
                            <p style="color: rgba(255,255,255,0.7); line-height: 1.5;">${itemsSummary}</p>
                        </div>
                        <div class="order-footer">
                            <div class="order-total">${order.currency === 'LYD' ? parseFloat(order.total).toLocaleString() + ' د.ل' : '$' + parseFloat(order.total).toLocaleString()}</div>
                            <button class="invoice-btn" onclick="generateInvoice('${order.id}')">
                                <span>📄</span> الفاتورة
                            </button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function renderLatestOrder() {
            const container = document.getElementById('latest-order-preview');
            if (userOrders.length === 0) {
                container.innerHTML = '<p style="color: rgba(255,255,255,0.5);">لا توجد طلبات حديثة.</p>';
                return;
            }

            const order = userOrders[0];
            const date = new Date(order.timestamp).toLocaleDateString('ar-LY');
            let statusText = 'قيد المعالجة';
            if (order.status === 'completed') statusText = 'مكتمل';

            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: white;">#${order.id.substring(order.id.length - 6).toUpperCase()}</span>
                    <span style="font-size: 0.85rem; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 12px; color: rgba(255,255,255,0.8);">${statusText}</span>
                </div>
                <div style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-bottom: 15px;">
                    ${date} • ${order.currency === 'LYD' ? parseFloat(order.total).toLocaleString() + ' د.ل' : '$' + parseFloat(order.total).toLocaleString()}
                </div>
                <button onclick="document.querySelector('[data-tab=\\'orders\\']').click()" style="width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; border-radius: 8px; cursor: pointer;">
                    عرض التفاصيل
                </button>
            `;
        }

        // --- 5. Render Wishlist ---
        function renderWishlist() {
            const container = document.getElementById('wishlist-container');
            const emptyState = document.getElementById('wishlist-empty');

            // Re-read from storage to ensure fresh data
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

            if (wishlist.length === 0) {
                container.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';
            let html = '';

            wishlist.forEach(item => {
                // Determine price display (reusing logic or simplified)
                // For simplicity in this bespoke view:
                const price = parseFloat(item.price).toLocaleString();

                html += `
                    <div class="wishlist-card">
                        <div class="wishlist-remove" onclick="removeWishlistItem('${item.id}')">✕</div>
                        <img src="${item.image}" class="wishlist-img" alt="${item.name}">
                        <div class="wishlist-info">
                            <div class="wishlist-title">${item.name}</div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                                <div class="wishlist-price">$${price}</div>
                                <a href="index.html?product=${item.id}" style="font-size: 0.8rem; padding: 4px 8px; background: var(--primary); color: white; border-radius: 6px; text-decoration: none;">عرض</a>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        // Global function for removing wishlist item
        window.removeWishlistItem = function (id) {
            let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            wishlist = wishlist.filter(item => item.id !== id);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));

            // Trigger refresh
            renderWishlist();
            updateStats();

            // Also notify app.js to update header badge potentially? 
            // Better to dispatch event
            // But simplest is to just show notification
            if (window.showNotification) window.showNotification('تم الحذف من القائمة');
        };

        // --- 6. Change Password (Reused) ---
        if (changePassBtn) {
            changePassBtn.addEventListener('click', () => {
                const modal = document.getElementById('custom-confirm-modal');
                const yesBtn = document.getElementById('confirm-yes-btn');
                const noBtn = document.getElementById('confirm-no-btn');

                if (modal && yesBtn) {
                    modal.style.display = 'flex';
                    // Clone to remove old listeners
                    const newYes = yesBtn.cloneNode(true);
                    const newNo = noBtn.cloneNode(true);
                    yesBtn.parentNode.replaceChild(newYes, yesBtn);
                    noBtn.parentNode.replaceChild(newNo, noBtn);

                    newYes.onclick = () => {
                        newYes.textContent = "جاري الإرسال...";
                        newYes.disabled = true;
                        firebase.auth().sendPasswordResetEmail(currentUser.email)
                            .then(() => {
                                modal.style.display = 'none';
                                alert("✅ تم إرسال رابط التعيين إلى بريدك");
                            })
                            .catch(err => {
                                modal.style.display = 'none';
                                alert("❌ " + err.message);
                            })
                            .finally(() => {
                                newYes.textContent = "نعم، أرسل الرابط";
                                newYes.disabled = false;
                            });
                    };
                    newNo.onclick = () => modal.style.display = 'none';
                    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
                }
            });
        }

    });
})();
