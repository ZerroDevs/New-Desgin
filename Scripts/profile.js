/**
 * New Desgin - User Profile & Luxury Account Dashboard
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {

        // UI Element References
        const loadingOverlay = document.getElementById('loading-overlay');
        const userHeroAvatar = document.getElementById('user-hero-avatar');
        const userHeroName = document.getElementById('user-hero-name');
        const userHeroEmail = document.getElementById('user-hero-email');
        const userHeroPhone = document.getElementById('user-hero-phone');

        const heroStatOrders = document.getElementById('hero-stat-orders');
        const heroStatSpent = document.getElementById('hero-stat-spent');
        const heroStatWishlist = document.getElementById('hero-stat-wishlist');

        const kpiTotalSpent = document.getElementById('kpi-total-spent');
        const kpiTotalOrders = document.getElementById('kpi-total-orders');
        const kpiWishlistCount = document.getElementById('kpi-wishlist-count');

        const badgeOrderCount = document.getElementById('badge-order-count');
        const badgeWishlistCount = document.getElementById('badge-wishlist-count');

        // Forms
        const personalForm = document.getElementById('personal-form');
        const pName = document.getElementById('p-name');
        const pPhone = document.getElementById('p-phone');
        const pCity = document.getElementById('p-city');
        const pAddress = document.getElementById('p-address');
        const pEmail = document.getElementById('p-email');
        const pNotes = document.getElementById('p-notes');
        const btnSavePersonal = document.getElementById('btn-save-personal');

        const preferencesForm = document.getElementById('preferences-form');
        const btnSavePref = document.getElementById('btn-save-pref');
        const customShoeContainer = document.getElementById('custom-shoe-size-container');
        const customShoeInput = document.getElementById('custom-shoe-size');

        // Tab Navigation
        const navItems = document.querySelectorAll('.nav-item[data-tab]');
        const tabPanels = document.querySelectorAll('.tab-panel');

        let currentUser = null;
        let userProfileData = {};
        let userOrders = [];
        let currentOrderFilter = 'all';

        // --- 1. Tab Switching ---
        window.switchProfileTab = function (tabName) {
            navItems.forEach(item => {
                if (item.dataset.tab === tabName) item.classList.add('active');
                else item.classList.remove('active');
            });

            tabPanels.forEach(panel => {
                if (panel.id === `tab-${tabName}`) panel.classList.add('active');
                else panel.classList.remove('active');
            });

            if (tabName === 'wishlist') renderWishlist();
            if (tabName === 'orders') renderOrders();
        };

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.tab;
                if (target) switchProfileTab(target);
            });
        });

        // Logout Handlers
        function handleLogout() {
            if (confirm('هل تريد بالتأكيد تسجيل الخروج من حسابك؟')) {
                firebase.auth().signOut().then(() => {
                    window.location.href = 'index.html';
                });
            }
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        const logoutSecBtn = document.getElementById('btn-logout-sec');
        if (logoutSecBtn) logoutSecBtn.addEventListener('click', handleLogout);

        // Password Reset Button
        const resetPassBtn = document.getElementById('btn-reset-password');
        if (resetPassBtn) {
            resetPassBtn.addEventListener('click', () => {
                if (!currentUser || !currentUser.email) return;
                resetPassBtn.disabled = true;
                resetPassBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

                firebase.auth().sendPasswordResetEmail(currentUser.email).then(() => {
                    showToast('✅ تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
                    resetPassBtn.innerHTML = '<i class="fas fa-check"></i> تم إرسال الرابط';
                }).catch(err => {
                    console.error('Password reset error:', err);
                    showToast('❌ تعذر إرسال الرابط: ' + (err.message || 'حدث خطأ'), 'error');
                    resetPassBtn.disabled = false;
                    resetPassBtn.innerHTML = '<i class="fas fa-key"></i> إعادة المحاولة';
                });
            });
        }

        // --- Shoe Size Radio Listener (Custom 'Other' size toggle) ---
        document.querySelectorAll('input[name="shoe_size"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'other') {
                    if (customShoeContainer) {
                        customShoeContainer.style.display = 'block';
                        if (customShoeInput) customShoeInput.focus();
                    }
                } else {
                    if (customShoeContainer) customShoeContainer.style.display = 'none';
                }
            });
        });

        // --- 2. Auth State & Data Sync ---
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = 'login.html?redirect=profile.html';
                return;
            }
            currentUser = user;

            // Load profile from DB
            if (window.loadUserProfile) {
                window.loadUserProfile((profile) => {
                    userProfileData = profile || {};
                    populateProfileUI(user, userProfileData);
                    loadUserOrders(user.uid);
                    updateWishlistStats();
                });
            } else {
                populateProfileUI(user, {});
                loadUserOrders(user.uid);
                updateWishlistStats();
            }
        });

        function populateProfileUI(user, profile) {
            const name = profile.name || user.displayName || 'عميل New Desgin';
            const email = user.email || '';
            const phone = profile.phone || 'غير مسجل';

            // Hero
            userHeroName.textContent = name;
            userHeroEmail.textContent = email;
            userHeroPhone.textContent = phone;

            const initials = name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'ND';
            userHeroAvatar.textContent = initials;

            // Form
            pName.value = name;
            pEmail.value = email;
            pPhone.value = profile.phone || '';
            pCity.value = profile.city || '';
            pAddress.value = profile.address || '';
            pNotes.value = profile.notes || '';

            // Preferences (No default auto-checks unless saved in DB)
            if (profile.preferences) {
                // Clothes size
                if (profile.preferences.clothes_size) {
                    const r = document.querySelector(`input[name="clothes_size"][value="${profile.preferences.clothes_size}"]`);
                    if (r) r.checked = true;
                }

                // Shoe size
                if (profile.preferences.shoe_size) {
                    const standardSizes = ['39', '40', '41', '42', '43', '44', '45'];
                    if (standardSizes.includes(profile.preferences.shoe_size)) {
                        const r = document.querySelector(`input[name="shoe_size"][value="${profile.preferences.shoe_size}"]`);
                        if (r) r.checked = true;
                        if (customShoeContainer) customShoeContainer.style.display = 'none';
                    } else {
                        // Custom shoe size
                        const otherRadio = document.getElementById('shoe-size-other-radio');
                        if (otherRadio) otherRadio.checked = true;
                        if (customShoeContainer) customShoeContainer.style.display = 'block';
                        if (customShoeInput) customShoeInput.value = profile.preferences.shoe_size === 'other' ? '' : profile.preferences.shoe_size;
                    }
                }

                // Fragrance notes
                if (Array.isArray(profile.preferences.fragrance_notes)) {
                    document.querySelectorAll('input[name="fragrance_notes"]').forEach(cb => {
                        cb.checked = profile.preferences.fragrance_notes.includes(cb.value);
                    });
                }
            }

            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }

        // --- 3. Save Personal Info ---
        if (personalForm) {
            personalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                btnSavePersonal.disabled = true;
                btnSavePersonal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

                const updatedData = {
                    name: pName.value.trim(),
                    phone: pPhone.value.trim(),
                    city: pCity.value.trim(),
                    address: pAddress.value.trim(),
                    notes: pNotes.value.trim()
                };

                try {
                    if (window.saveUserProfile) {
                        await window.saveUserProfile(updatedData);
                    }
                    userHeroName.textContent = updatedData.name;
                    userHeroPhone.textContent = updatedData.phone || 'غير مسجل';
                    const initials = updatedData.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'ND';
                    userHeroAvatar.textContent = initials;

                    showToast('✅ تم تحديث بياناتك بنجاح', 'success');
                } catch (err) {
                    console.error('Error saving profile:', err);
                    showToast('❌ تعذر حفظ التغييرات', 'error');
                } finally {
                    btnSavePersonal.disabled = false;
                    btnSavePersonal.innerHTML = '<i class="fas fa-save"></i> حفظ البيانات';
                }
            });
        }

        // --- 4. Save Preferences ---
        if (preferencesForm) {
            preferencesForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                btnSavePref.disabled = true;
                btnSavePref.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

                const clothesSize = document.querySelector('input[name="clothes_size"]:checked')?.value || '';
                
                let shoeSize = document.querySelector('input[name="shoe_size"]:checked')?.value || '';
                if (shoeSize === 'other') {
                    const customVal = customShoeInput ? customShoeInput.value.trim() : '';
                    shoeSize = customVal || 'other';
                }

                const fragranceNotes = Array.from(document.querySelectorAll('input[name="fragrance_notes"]:checked')).map(cb => cb.value);

                const prefData = {
                    clothes_size: clothesSize,
                    shoe_size: shoeSize,
                    fragrance_notes: fragranceNotes
                };

                try {
                    if (window.saveUserProfile) {
                        await window.saveUserProfile({ preferences: prefData });
                    }
                    showToast('✨ تم حفظ تفضيلات المقاسات والعطور بنجاح', 'success');
                } catch (err) {
                    console.error('Error saving preferences:', err);
                    showToast('❌ تعذر حفظ التفضيلات', 'error');
                } finally {
                    btnSavePref.disabled = false;
                    btnSavePref.innerHTML = '<i class="fas fa-check"></i> حفظ التفضيلات';
                }
            });
        }

        // --- 5. Orders & Live Tracking ---
        function loadUserOrders(uid) {
            const db = firebase.database();
            db.ref('orders').orderByChild('userId').equalTo(uid).once('value').then(snapshot => {
                const data = snapshot.val();
                if (data) {
                    userOrders = Object.entries(data).map(([key, val]) => ({
                        id: key,
                        ...val
                    })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                } else {
                    userOrders = [];
                }

                updateOrdersAndStats();
            }).catch(err => {
                console.warn('Orders query error, trying email fallback:', err);
                db.ref('orders').once('value').then(snapshot => {
                    const data = snapshot.val();
                    if (data && currentUser && currentUser.email) {
                        userOrders = Object.entries(data)
                            .map(([key, val]) => ({ id: key, ...val }))
                            .filter(o => o.userId === uid || (o.customer && o.customer.email === currentUser.email) || o.email === currentUser.email)
                            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    } else {
                        userOrders = [];
                    }
                    updateOrdersAndStats();
                }).catch(() => {
                    userOrders = [];
                    updateOrdersAndStats();
                });
            });
        }

        function updateOrdersAndStats() {
            // Stats Calculations
            const orderCount = userOrders.length;
            const totalSpent = userOrders.reduce((sum, ord) => sum + (parseFloat(ord.total) || 0), 0);

            heroStatOrders.textContent = orderCount;
            heroStatSpent.textContent = totalSpent.toLocaleString() + ' د.ل';
            kpiTotalSpent.textContent = totalSpent.toLocaleString() + ' د.ل';
            kpiTotalOrders.textContent = orderCount;
            badgeOrderCount.textContent = orderCount;

            // Render Orders Tab & Latest Order Widget
            renderOrders();
            renderLatestOrderPreview();
            updateOrderCounts();
        }

        function updateOrderCounts() {
            const allCount = userOrders.length;
            const pendingCount = userOrders.filter(o => !o.status || o.status === 'pending').length;
            const shippedCount = userOrders.filter(o => o.status === 'shipped' || o.status === 'processing').length;
            const completedCount = userOrders.filter(o => o.status === 'completed').length;

            const cAll = document.getElementById('count-all');
            const cPend = document.getElementById('count-pending');
            const cShip = document.getElementById('count-shipped');
            const cComp = document.getElementById('count-completed');

            if (cAll) cAll.textContent = allCount;
            if (cPend) cPend.textContent = pendingCount;
            if (cShip) cShip.textContent = shippedCount;
            if (cComp) cComp.textContent = completedCount;
        }

        // Filter button listeners
        document.querySelectorAll('.order-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentOrderFilter = btn.dataset.filter || 'all';
                renderOrders();
            });
        });

        function renderOrders() {
            const container = document.getElementById('orders-full-list');
            if (!container) return;

            let filtered = userOrders;
            if (currentOrderFilter === 'pending') filtered = userOrders.filter(o => !o.status || o.status === 'pending');
            else if (currentOrderFilter === 'shipped') filtered = userOrders.filter(o => o.status === 'shipped' || o.status === 'processing');
            else if (currentOrderFilter === 'completed') filtered = userOrders.filter(o => o.status === 'completed');

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 50px 20px; color: #94a3b8;">
                        <i class="fas fa-box-open" style="font-size: 3rem; color: rgba(56,189,248,0.3); margin-bottom: 15px;"></i>
                        <h3>لا توجد طلبات في هذا القسم</h3>
                        <p style="margin: 10px 0 20px;">تسوق أرقى الملابس والعطور الحصرية وأطلب الآن بكل سهولة.</p>
                        <a href="products.html" class="btn btn-primary"><i class="fas fa-shopping-bag"></i> تصفح المنتجات</a>
                    </div>
                `;
                return;
            }

            let html = '';
            filtered.forEach(order => {
                const dateStr = order.timestamp ? new Date(order.timestamp).toLocaleDateString('ar-LY', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'تاريخ غير محدد';

                const status = (order.status || 'pending').toLowerCase();
                let statusLabel = 'قيد المعالجة';
                let statusTagClass = 'status-pending';
                let step = 1;

                if (status === 'processing') {
                    statusLabel = 'جاري التجهيز';
                    statusTagClass = 'status-processing';
                    step = 2;
                } else if (status === 'shipped') {
                    statusLabel = 'قيد الشحن والتوصيل';
                    statusTagClass = 'status-shipped';
                    step = 3;
                } else if (status === 'completed') {
                    statusLabel = 'تم التسليم بنجاح';
                    statusTagClass = 'status-completed';
                    step = 4;
                } else if (status === 'cancelled') {
                    statusLabel = 'ملغي';
                    statusTagClass = 'status-cancelled';
                    step = 0;
                }

                // Items preview
                const items = order.items || order.cart || [];
                const itemsText = items.length > 0
                    ? items.map(it => `<strong>${it.name || 'منتج'}</strong> (x${it.quantity || 1})`).join(' ، ')
                    : (order.productName ? `<strong>${order.productName}</strong>` : 'تفاصيل المنتجات');

                const totalFormatted = order.currency === 'LYD' || !order.currency
                    ? `${(parseFloat(order.total) || 0).toLocaleString()} د.ل`
                    : `$${(parseFloat(order.total) || 0).toLocaleString()}`;

                html += `
                    <div class="luxury-order-card">
                        <div class="order-top-bar">
                            <div class="order-ref">
                                <i class="fas fa-receipt" style="color: #38bdf8;"></i>
                                <span>طلب #${(order.id || '').substring(order.id ? order.id.length - 6 : 0).toUpperCase()}</span>
                                <span class="order-status-tag ${statusTagClass}">${statusLabel}</span>
                            </div>
                            <div style="font-size: 0.85rem; color: #94a3b8;">
                                <i class="far fa-calendar-alt"></i> ${dateStr}
                            </div>
                        </div>

                        <!-- Stepper Tracker -->
                        ${status !== 'cancelled' ? `
                            <div class="order-track-stepper">
                                <div class="step-item ${step >= 1 ? 'active' : ''}">
                                    <div class="step-bullet"><i class="fas fa-check"></i></div>
                                    <div class="step-label">تم الاستلام</div>
                                </div>
                                <div class="step-item ${step >= 2 ? 'active' : ''}">
                                    <div class="step-bullet"><i class="fas fa-box"></i></div>
                                    <div class="step-label">التجهيز</div>
                                </div>
                                <div class="step-item ${step >= 3 ? 'active' : ''}">
                                    <div class="step-bullet"><i class="fas fa-truck"></i></div>
                                    <div class="step-label">الشحن</div>
                                </div>
                                <div class="step-item ${step >= 4 ? 'active' : ''}">
                                    <div class="step-bullet"><i class="fas fa-home"></i></div>
                                    <div class="step-label">التسليم</div>
                                </div>
                            </div>
                        ` : ''}

                        <div class="order-items-preview">
                            <i class="fas fa-tshirt" style="color: #38bdf8; margin-left: 6px;"></i> ${itemsText}
                        </div>

                        <div class="order-bottom-actions">
                            <div class="order-price-total">
                                <span style="font-size: 0.85rem; color: #94a3b8; font-weight: 500;">الإجمالي: </span>
                                ${totalFormatted}
                            </div>
                            <div class="order-action-btns">
                                <a href="track-order.html?orderId=${encodeURIComponent(order.id)}" class="btn-track">
                                    <i class="fas fa-location-arrow"></i> تتبع الشحنة
                                </a>
                                <button type="button" class="btn-invoice-user" onclick="if(window.generateInvoice) window.generateInvoice('${order.id}'); else alert('جاري تجهيز الفاتورة');">
                                    <i class="fas fa-file-invoice"></i> الفاتورة
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        function renderLatestOrderPreview() {
            const container = document.getElementById('latest-order-container');
            if (!container) return;

            if (userOrders.length === 0) {
                container.innerHTML = `
                    <div style="background: rgba(11, 19, 43, 0.6); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 14px; padding: 35px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;">
                        <div style="font-size: 2.2rem; color: rgba(56, 189, 248, 0.5);"><i class="fas fa-box-open"></i></div>
                        <p style="color: #cbd5e1; font-size: 0.95rem; margin: 0;">لا توجد لديك طلبات سابقة حتى الآن.</p>
                        <a href="products.html" class="btn btn-primary" style="margin-top: 6px; font-size: 0.95rem; padding: 10px 24px;">
                            <i class="fas fa-shopping-bag"></i> ابدأ التسوق الآن
                        </a>
                    </div>
                `;
                return;
            }

            const latest = userOrders[0];
            const items = latest.items || latest.cart || [];
            const itemsSummary = items.length > 0
                ? items.map(i => `${i.name} (x${i.quantity || 1})`).join(', ')
                : 'طلب New Desgin';

            const totalFormatted = latest.currency === 'LYD' || !latest.currency
                ? `${(parseFloat(latest.total) || 0).toLocaleString()} د.ل`
                : `$${(parseFloat(latest.total) || 0).toLocaleString()}`;

            container.innerHTML = `
                <div style="background: rgba(11, 19, 43, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 14px; padding: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <div style="font-weight: 700; color: #ffffff; font-size: 1.05rem; margin-bottom: 4px;">
                            طلب #${(latest.id || '').substring(latest.id ? latest.id.length - 6 : 0).toUpperCase()}
                        </div>
                        <div style="color: #cbd5e1; font-size: 0.88rem;">${itemsSummary}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #38bdf8;">${totalFormatted}</div>
                        <a href="track-order.html?orderId=${encodeURIComponent(latest.id)}" class="btn-track" style="padding: 8px 16px; font-size: 0.85rem;">
                            <i class="fas fa-location-arrow"></i> تتبع
                        </a>
                    </div>
                </div>
            `;
        }

        // --- 6. Wishlist Management ---
        function updateWishlistStats() {
            let wishlist = [];
            try {
                wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            } catch (e) {
                wishlist = [];
            }

            const count = wishlist.length;
            heroStatWishlist.textContent = count;
            kpiWishlistCount.textContent = count;
            badgeWishlistCount.textContent = count;
        }

        function renderWishlist() {
            const container = document.getElementById('wishlist-grid-container');
            const emptyMsg = document.getElementById('wishlist-empty-msg');
            if (!container) return;

            let wishlist = [];
            try {
                wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            } catch (e) {
                wishlist = [];
            }

            updateWishlistStats();

            if (wishlist.length === 0) {
                container.innerHTML = '';
                if (emptyMsg) emptyMsg.style.display = 'block';
                return;
            }

            if (emptyMsg) emptyMsg.style.display = 'none';

            let html = '';
            wishlist.forEach(item => {
                const img = item.image || item.image1 || 'Images/Logo-noBG.png';
                const priceFormatted = item.currency === 'USD' ? `$${item.price}` : `${item.price} د.ل`;

                html += `
                    <div class="wishlist-item-card">
                        <img src="${img}" alt="${item.name || 'منتج'}" class="wishlist-img" onerror="this.src='Images/Logo-noBG.png'">
                        <div class="wishlist-info">
                            <h4>${item.name || 'منتج فاخر'}</h4>
                            <div class="wishlist-price">${priceFormatted}</div>
                        </div>
                        <div class="wishlist-actions">
                            <button type="button" class="btn btn-primary" style="flex: 1; padding: 8px; font-size: 0.85rem;" onclick="addToCartFromWishlist('${item.id || item.name}')">
                                <i class="fas fa-cart-plus"></i> أضف للسلة
                            </button>
                            <button type="button" class="btn btn-secondary" style="padding: 8px 12px; color: #f87171;" onclick="removeFromWishlist('${item.id || item.name}')" title="حذف من المفضلة">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        window.removeFromWishlist = function (itemId) {
            try {
                let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                wishlist = wishlist.filter(it => (it.id !== itemId && it.name !== itemId));
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                renderWishlist();
                showToast('🗑️ تم الحذف من المفضلة', 'info');
            } catch (e) {
                console.error(e);
            }
        };

        window.addToCartFromWishlist = function (itemId) {
            try {
                const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                const item = wishlist.find(it => (it.id === itemId || it.name === itemId));
                if (item && window.Cart) {
                    window.Cart.addItem({
                        id: item.id || 'w_' + Date.now(),
                        name: item.name,
                        price: item.price,
                        image: item.image || item.image1 || 'Images/Logo-noBG.png',
                        category: item.category || 'clothes'
                    });
                    showToast('🛒 تمت إضافة ' + item.name + ' إلى السلة', 'success');
                } else {
                    showToast('🛒 تمت الإضافة إلى سلة التسوق', 'success');
                }
            } catch (e) {
                console.error(e);
            }
        };

        // --- Toast Notification Helper ---
        function showToast(message, type = 'info') {
            if (window.showNotification) {
                window.showNotification(message);
                return;
            }

            let toast = document.getElementById('profile-global-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'profile-global-toast';
                toast.style.cssText = 'position: fixed; bottom: 25px; left: 25px; z-index: 100000; background: #0f172a; border: 1px solid #38bdf8; color: #ffffff; padding: 12px 24px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: Cairo, sans-serif; font-weight: 600; font-size: 0.95rem; transition: all 0.3s ease; transform: translateY(100px); opacity: 0;';
                document.body.appendChild(toast);
            }

            toast.textContent = message;
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';

            setTimeout(() => {
                toast.style.transform = 'translateY(100px)';
                toast.style.opacity = '0';
            }, 3500);
        }

    });
})();
