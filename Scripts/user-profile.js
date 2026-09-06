// ============================================
// USER PROFILE — Save customer info for faster checkout
// ============================================
(function () {
    'use strict';

    const PROFILE_REF = 'userProfiles';

    // Get or create visitor ID (shared with support.js)
    function getVisitorId() {
        let id = localStorage.getItem('support_visitor_id');
        if (!id) {
            id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('support_visitor_id', id);
        }
        return id;
    }

    // ---- Get Current ID (UID or Visitor ID) ----
    function getCurrentId() {
        if (firebase.auth().currentUser) {
            return firebase.auth().currentUser.uid;
        }
        return getVisitorId();
    }

    // ---- Save Profile ----
    window.saveUserProfile = function (data) {
        const db = firebase.database();
        const userId = getCurrentId();
        const isAuth = !!firebase.auth().currentUser;

        // If user is just a visitor, we save to 'userProfiles/visitor_...'
        // If user is logged in, we save to 'userProfiles/uid'
        // Ideally, we should migrate visitor data to uid on login (handled in auth listener below)

        const profileData = {
            id: userId,
            isAuth: isAuth,
            name: data.name || '',
            phone: data.phone || '',
            city: data.city || '',
            address: data.address || '',
            notes: data.notes || '',
            updatedAt: Date.now()
        };

        // Also cache in localStorage for instant load
        localStorage.setItem('user_profile', JSON.stringify(profileData));

        return db.ref(PROFILE_REF + '/' + userId).update(profileData);
    };

    // ---- Load Profile ----
    window.loadUserProfile = function (callback) {
        // First try localStorage (instant)
        // BUT check if the cached profile matches current auth state
        const cached = localStorage.getItem('user_profile');
        const currentUser = firebase.auth().currentUser;

        if (cached) {
            try {
                const profile = JSON.parse(cached);

                // If logged in, but cache is visitor -> ignore cache (fetch fresh)
                // If not logged in, but cache is auth -> ignore cache
                let isValidCache = true;
                if (currentUser && profile.id !== currentUser.uid) isValidCache = false;
                if (!currentUser && profile.isAuth) isValidCache = false;

                if (isValidCache) {
                    if (callback) callback(profile);
                    // We still fetch in background to update
                }
            } catch (e) { /* fall through */ }
        }

        // Then try Firebase
        const db = firebase.database();
        const userId = getCurrentId();

        db.ref(PROFILE_REF + '/' + userId).once('value').then(snapshot => {
            const profile = snapshot.val();
            if (profile) {
                localStorage.setItem('user_profile', JSON.stringify(profile));
                if (callback) callback(profile);
            } else {
                if (callback) callback(null);
            }
        }).catch(err => {
            console.warn('Profile load error:', err);
            if (callback) callback(null);
        });
    };

    // ---- Get Profile (sync from cache) ----
    window.getUserProfile = function () {
        try {
            return JSON.parse(localStorage.getItem('user_profile')) || null;
        } catch (e) {
            return null;
        }
    };

    // ---- Auto-fill cart fields ----
    function autoFillCartFields() {
        // Watch for cart modal to appear and auto-fill
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('cart-modal-overlay')) {
                        const profile = getUserProfile();
                        if (profile) {
                            const nameInput = node.querySelector('#customer-name');
                            if (nameInput && profile.name && !nameInput.value) {
                                nameInput.value = profile.name;
                            }
                            const phoneInput = node.querySelector('#customer-phone');
                            if (phoneInput && profile.phone && !phoneInput.value) {
                                phoneInput.value = profile.phone;
                            }
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true });
    }

    // ---- Auto-fill support ticket form ----
    function autoFillSupportForm() {
        const nameInput = document.getElementById('ticket-name');
        const contactInput = document.getElementById('ticket-contact');
        if (!nameInput && !contactInput) return;

        const profile = getUserProfile();
        if (!profile) return;

        if (nameInput && !nameInput.value && profile.name) {
            nameInput.value = profile.name;
        }
        if (contactInput && !contactInput.value && profile.phone) {
            contactInput.value = profile.phone;
        }
    }

    // ---- Save profile from completed order ----
    // Hook into completeOrder — we listen for the cart being emptied
    const originalCompleteOrder = window.completeOrder;
    if (originalCompleteOrder) {
        window.completeOrder = function () {
            // Grab fields before the cart modal is destroyed
            const nameInput = document.getElementById('customer-name');
            const phoneInput = document.getElementById('customer-phone');

            const name = nameInput ? nameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';

            if (name || phone) {
                const existing = getUserProfile() || {};
                const update = { ...existing };
                if (name) update.name = name;
                if (phone) update.phone = phone;

                saveUserProfile(update);
            }

            // Call original
            return originalCompleteOrder.apply(this, arguments);
        };
    }

    // ---- Profile Icon in Header ----
    function injectProfileIcon() {
        // Add a small profile link near the header
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions || document.getElementById('profile-icon-btn')) return;

        const profile = getUserProfile();

        const btn = document.createElement('button');
        btn.id = 'profile-icon-btn';
        btn.title = 'حسابي';
        btn.style.cssText = `
            background: none;
            border: none;
            font-size: 1.3rem;
            cursor: pointer;
            padding: 6px;
            border-radius: 50%;
            transition: all 0.2s;
            position: relative;
        `;
        btn.textContent = '👤';

        if (profile && profile.name) {
            btn.title = profile.name;
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showProfileModal();
        });

        headerActions.prepend(btn);
    }

    // ---- Profile Modal ----
    window.showProfileModal = function () {
        // Remove existing
        const existing = document.querySelector('.profile-modal-overlay');
        if (existing) existing.remove();

        const profile = getUserProfile() || {};

        const overlay = document.createElement('div');
        overlay.className = 'profile-modal-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
            z-index: 9999; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(145deg, rgba(26,26,46,0.95), rgba(22,33,62,0.98));
            border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
            padding: 2rem; max-width: 420px; width: 92%; direction: rtl; color: white;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6);
            animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; font-size: 1.3rem;">👤 بياناتي</h2>
                <span class="profile-close-btn" style="font-size: 24px; cursor: pointer; color: rgba(255,255,255,0.5); width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.05);">×</span>
            </div>
            <p style="color: rgba(255,255,255,0.4); font-size: 0.8rem; margin-bottom: 1.5rem;">
                احفظ بياناتك لتعبئة تلقائية أسرع عند الطلب والدعم الفني
            </p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <label style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 4px; display: block;">الاسم</label>
                    <input type="text" id="profile-name" value="${profile.name || ''}" placeholder="اسمك الكريم"
                        style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-family: 'Cairo', sans-serif; font-size: 0.9rem; box-sizing: border-box;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 4px; display: block;">📞 رقم الهاتف</label>
                    <input type="tel" id="profile-phone" value="${profile.phone || ''}" placeholder="09XXXXXXXX"
                        oninput="this.value = this.value.replace(/[^0-9+]/g, '')" inputmode="numeric"
                        style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-family: 'Cairo', sans-serif; font-size: 0.9rem; box-sizing: border-box;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 4px; display: block;">🏙️ المدينة</label>
                    <input type="text" id="profile-city" value="${profile.city || ''}" placeholder="طرابلس، بنغازي..."
                        style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-family: 'Cairo', sans-serif; font-size: 0.9rem; box-sizing: border-box;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 4px; display: block;">📍 العنوان</label>
                    <input type="text" id="profile-address" value="${profile.address || ''}" placeholder="العنوان بالتفصيل"
                        style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-family: 'Cairo', sans-serif; font-size: 0.9rem; box-sizing: border-box;">
                </div>
                <div>
                    <label style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 4px; display: block;">📝 ملاحظات</label>
                    <textarea id="profile-notes" placeholder="ملاحظات إضافية..." rows="2"
                        style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: white; font-family: 'Cairo', sans-serif; font-size: 0.9rem; resize: none; box-sizing: border-box;">${profile.notes || ''}</textarea>
                </div>
            </div>
            <button id="profile-save-btn" style="
                width: 100%; margin-top: 1.5rem; padding: 12px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white; border: none; border-radius: 12px;
                font-family: 'Cairo', sans-serif; font-size: 0.95rem; font-weight: 600;
                cursor: pointer; transition: all 0.2s;
            ">💾 حفظ البيانات</button>
            <button id="profile-clear-btn" style="
                width: 100%; margin-top: 8px; padding: 10px;
                background: transparent; color: rgba(255,255,255,0.3);
                border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
                font-family: 'Cairo', sans-serif; font-size: 0.8rem;
                cursor: pointer; transition: all 0.2s;
            ">🗑️ مسح البيانات</button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close
        modal.querySelector('.profile-close-btn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        // Save
        document.getElementById('profile-save-btn').addEventListener('click', () => {
            const data = {
                name: document.getElementById('profile-name').value.trim(),
                phone: document.getElementById('profile-phone').value.trim(),
                city: document.getElementById('profile-city').value.trim(),
                address: document.getElementById('profile-address').value.trim(),
                notes: document.getElementById('profile-notes').value.trim()
            };

            saveUserProfile(data).then(() => {
                if (typeof showNotification === 'function') {
                    showNotification('تم حفظ بياناتك بنجاح! 👤');
                }
                overlay.remove();
            }).catch(err => {
                console.error('Profile save error:', err);
            });
        });

        // Clear
        document.getElementById('profile-clear-btn').addEventListener('click', () => {
            localStorage.removeItem('user_profile');
            const visitorId = getVisitorId();
            firebase.database().ref(PROFILE_REF + '/' + visitorId).remove();
            if (typeof showNotification === 'function') {
                showNotification('تم مسح بياناتك');
            }
            overlay.remove();
        });
    };

    // ---- Auth State Observer to Sync Data ----
    // This runs once when auth state is determined
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User just logged in (or we just loaded and found they are logged in)

            // Check if we have "Visitor Data" in localStorage that needs to be transferred?
            // Strategy:
            // 1. Check if we have a visitor profile in localStorage (with no isAuth or different ID)
            // 2. If so, read it.
            // 3. Read the user's REAL profile from DB.
            // 4. If real profile is empty, fill it with visitor data.
            // 5. Clear sensitive visitor traces.

            const cached = localStorage.getItem('user_profile');
            if (cached) {
                try {
                    const localProfile = JSON.parse(cached);
                    // If local profile is NOT the current user (e.g. it was a guest session)
                    if (localProfile.id !== user.uid) {
                        // We have guest data!
                        console.log("Syncing guest data to new user account...");

                        // Fetch remote profile first to avoid overwriting existing data
                        const db = firebase.database();
                        db.ref(PROFILE_REF + '/' + user.uid).once('value').then(snapshot => {
                            const remoteProfile = snapshot.val();

                            // If remote profile is empty/incomplete, use local data
                            // We prioritize remote data if it exists
                            const mergedData = {
                                id: user.uid,
                                isAuth: true,
                                name: (remoteProfile && remoteProfile.name) || localProfile.name || user.displayName || '',
                                phone: (remoteProfile && remoteProfile.phone) || localProfile.phone || '',
                                city: (remoteProfile && remoteProfile.city) || localProfile.city || '',
                                address: (remoteProfile && remoteProfile.address) || localProfile.address || '',
                                notes: (remoteProfile && remoteProfile.notes) || localProfile.notes || '',
                                updatedAt: Date.now()
                            };

                            // Save merged data to DB
                            db.ref(PROFILE_REF + '/' + user.uid).update(mergedData).then(() => {
                                // Update local cache
                                localStorage.setItem('user_profile', JSON.stringify(mergedData));
                                console.log("Profile sync complete.");

                                // Refresh UI
                                autoFillSupportForm();
                            });
                        });
                    }
                } catch (e) { }
            }
        }
    });

    // ---- Init ----
    function init() {
        autoFillCartFields();
        autoFillSupportForm();
        injectProfileIcon();

        // Trigger load
        loadUserProfile(() => {
            autoFillSupportForm();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 300);
    }
})();
