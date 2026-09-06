// ============================================
// FIREBASE CONFIGURATION
// ============================================
// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Config moved to Scripts/firebase-config.js

// Initialize References
const database = window.database || firebase.database();
const auth = window.auth || firebase.auth();
const productsRef = database.ref('products');
const settingsRef = database.ref('settings');
const promosRef = database.ref('promos');
const ordersRef = database.ref('orders');
const studentBooksRef = database.ref('studentBooks');
const bookRequestsRef = database.ref('bookRequests');

// ============================================
// ADMIN SECURITY CHECK
// ============================================
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is in admin list
    settingsRef.child('adminEmails').once('value').then(snapshot => {
        const admins = snapshot.val();
        let isAdmin = false;

        if (admins && user.email) {
            const adminEmails = Object.values(admins);
            isAdmin = adminEmails.some(email => email.toLowerCase() === user.email.toLowerCase());
        }

        if (!isAdmin) {
            // Show unauthorized overlay
            document.body.style.opacity = '1';
            document.getElementById('unauthorized-overlay').style.display = 'flex';
            // Hide other content just in case
            document.getElementById('admin-dashboard').style.display = 'none';
            document.getElementById('login-screen').style.display = 'none';
        } else {
            // User is admin, show UI
            document.body.style.opacity = '1';
            document.body.style.pointerEvents = 'auto'; // Re-enable clicks
        }
    });
});

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to the clicked tab button
    const clickedBtn = document.querySelector(`.tab-btn[onclick*="'${tabName}'"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    const tabContent = document.getElementById(`tab-${tabName}`);
    if (tabContent) {
        tabContent.classList.add('active');
    } else {
        console.error(`Tab content not found: tab-${tabName}`);
    }
}


// ============================================
// ORDERS MANAGEMENT
// ============================================
function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">جاري التحميل...</td></tr>';

    ordersRef.on('value', (snapshot) => {
        const orders = snapshot.val();
        ordersList.innerHTML = '';

        if (!orders) {
            ordersList.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">لا توجد طلبات بعد</td></tr>';
            updateOrderStats(0, 0, 0);
            return;
        }

        const ordersArray = Object.entries(orders).map(([id, data]) => ({ id, ...data }));
        ordersArray.sort((a, b) => b.timestamp - a.timestamp); // Newest first

        let pendingCount = 0;
        let completedCount = 0;
        let cancelledCount = 0;

        ordersArray.forEach(order => {
            // Count by status
            if (order.status === 'pending') pendingCount++;
            else if (order.status === 'completed') completedCount++;
            else if (order.status === 'cancelled') cancelledCount++;

            const row = document.createElement('tr');
            const date = new Date(order.timestamp);
            const formattedDate = date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusText = {
                'pending': 'قيد الانتظار',
                'processing': 'قيد التنفيذ',
                'shipped': 'تم الشحن',
                'completed': 'مكتملة',
                'cancelled': 'ملغاة'
            };

            // Calculate approximate USD value for the switcher
            const isLyd = order.currency === 'LYD';
            const totalUSD = isLyd ? (order.finalTotal / (window.exchangeRate || 9)) : order.finalTotal;
            const displayPrice = isLyd ? `${order.finalTotal.toFixed(2)} د.ل` : `$${parseFloat(order.finalTotal).toFixed(2)}`;

            row.innerHTML = `
                <td><input type="checkbox" class="bulk-check" value="${order.id}" data-type="orders"></td>
                <td><strong>${order.orderId || order.id.slice(-6)}</strong></td>
                <td>${formattedDate}</td>
                <td>
                    <div style="font-weight:bold;">${order.customerName || 'زائر'}</div>
                    <div style="font-size:0.8rem; color:rgba(255,255,255,0.5);">${order.customerPhone || ''}</div>
                </td>
                <td>${order.items ? order.items.length : 0} منتج</td>
                <td><span class="price-display" data-usd="${parseFloat(totalUSD).toFixed(2)}">${displayPrice}</span></td>
                <td><span class="order-status-badge status-${order.status}">${statusText[order.status] || order.status}</span></td>
                <td>
                    <div class="order-actions">
                        <button class="btn btn-secondary" onclick="viewOrderDetails('${order.id}')" title="عرض التفاصيل">👁️</button>
                        <button class="btn btn-secondary" onclick="generateInvoice('${order.id}')" title="طباعة فاتورة" style="background: rgba(102,126,234,0.15); border-color: rgba(102,126,234,0.3);">🖨️</button>
                        <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-select" style="padding: 0.4rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 6px; cursor: pointer;">
                            <option value="">تغيير الحالة</option>
                            <option value="pending" ${order.status === 'pending' ? 'disabled' : ''}>قيد الانتظار</option>
                            <option value="processing" ${order.status === 'processing' ? 'disabled' : ''}>قيد التنفيذ</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'disabled' : ''}>تم الشحن</option>
                            <option value="completed" ${order.status === 'completed' ? 'disabled' : ''}>مكتملة</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'disabled' : ''}>ملغاة</option>
                        </select>
                        <button class="btn btn-danger" onclick="deleteOrder('${order.id}')" title="حذف">🗑️</button>
                    </div>
                </td>
            `;
            ordersList.appendChild(row);
        });

        updateOrderStats(pendingCount, completedCount, cancelledCount);
    });
}

function updateOrderStats(pending, completed, cancelled) {
    document.getElementById('orders-pending').textContent = pending;
    document.getElementById('orders-completed').textContent = completed;
    document.getElementById('orders-cancelled').textContent = cancelled;
}

function updateOrderStatus(orderId, newStatus) {
    if (!newStatus) return;

    ordersRef.child(orderId).update({
        status: newStatus,
        lastUpdated: Date.now()
    }).then(() => {
        showNotification(`تم تحديث حالة الطلب إلى: ${newStatus === 'pending' ? 'قيد الانتظار' : newStatus === 'completed' ? 'مكتملة' : 'ملغاة'}`);
        if (window.adminLog) window.adminLog.orderStatus(orderId, newStatus === 'pending' ? 'قيد الانتظار' : newStatus === 'completed' ? 'مكتملة' : 'ملغاة');
    }).catch(error => {
        showNotification('حدث خطأ: ' + error.message, 'error');
    });
}

function deleteOrder(orderId) {
    showConfirmModal(
        'حذف الطلب',
        'هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.',
        () => {
            ordersRef.child(orderId).remove()
                .then(() => {
                    showNotification('تم حذف الطلب بنجاح');
                    if (window.adminLog) window.adminLog.orderDeleted(orderId);
                })
                .catch(error => {
                    showNotification('حدث خطأ: ' + error.message, 'error');
                });
        }
    );
}

function viewOrderDetails(orderId) {
    ordersRef.child(orderId).once('value', (snapshot) => {
        const order = snapshot.val();
        if (!order) {
            showNotification('الطلب غير موجود', 'error');
            return;
        }

        const date = new Date(order.timestamp);
        const formattedDate = date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusText = {
            'pending': 'قيد الانتظار',
            'processing': 'قيد التنفيذ',
            'shipped': 'تم الشحن',
            'completed': 'مكتملة',
            'cancelled': 'ملغاة'
        };

        let itemsHtml = order.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span>${item.name}</span>
                <span>${order.currency === 'LYD' ? `${item.price.toFixed(2)} د.ل` : `$${item.price.toFixed(2)}`}</span>
            </div>
        `).join('');

        const discountHtml = order.discount ? `
            <div style="color: #4caf50; margin-top: 0.5rem;">
                <strong>كود الخصم:</strong> ${order.discount.code} (-${order.discount.value}%)
            </div>
        ` : '';

        const contentHtml = `
            <h2 style="margin: 0 0 1.5rem 0; color: #667eea;">📋 تفاصيل الطلب</h2>
            
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0.5rem 0;"><strong>رقم الطلب:</strong> ${order.orderId}</p>
                <p style="margin: 0.5rem 0;"><strong>التاريخ:</strong> ${formattedDate}</p>
                <p style="margin: 0.5rem 0;"><strong>الحالة:</strong> <span class="order-status-badge status-${order.status}">${statusText[order.status] || order.status}</span></p>
                ${order.customerName ? `<p style="margin: 0.5rem 0;"><strong>👤 العميل:</strong> ${order.customerName}</p>` : ''}
                ${order.customerPhone ? `<p style="margin: 0.5rem 0; color: #4facfe;"><strong>📞 رقم الهاتف:</strong> ${order.customerPhone}</p>` : ''}
            </div>
            
            <h3 style="margin: 1.5rem 0 1rem 0;">المنتجات:</h3>
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                ${itemsHtml}
                <div style="display: flex; justify-content: space-between; padding: 1rem 0 0.5rem 0; margin-top: 1rem; border-top: 2px solid rgba(255,255,255,0.2); font-weight: bold;">
                    <span>المجموع الأصلي:</span>
                    <span>${order.currency === 'LYD' ? `${order.total.toFixed(2)} د.ل` : `$${order.total.toFixed(2)}`}</span>
                </div>
                ${discountHtml}
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 1.2rem; font-weight: bold; color: #4caf50;">
                    <span>المجموع النهائي:</span>
                    <span>${order.currency === 'LYD' ? `${order.finalTotal.toFixed(2)} د.ل` : `$${order.finalTotal.toFixed(2)}`}</span>
                </div>
            </div>
        `;

        showCustomModal(contentHtml, { width: '500px' });
    });
}

// ============================================
// PROMO CODES MANAGEMENT
// ============================================
// Load Promo Codes
function loadPromos() {
    const promoList = document.getElementById('promo-list');
    promoList.innerHTML = '<p style="color:white; opacity:0.7;">جاري التحميل...</p>';

    promosRef.on('value', (snapshot) => {
        const promos = snapshot.val();
        promoList.innerHTML = '';

        if (!promos || Object.keys(promos).length === 0) {
            promoList.innerHTML = '<p style="color:white; opacity:0.5; grid-column: 1/-1;">لا توجد كوبونات نشطة حالياً</p>';
            return;
        }

        Object.keys(promos).forEach(id => {
            const promo = promos[id];
            const promoCard = document.createElement('div');
            promoCard.className = 'product-card'; // Reuse style
            promoCard.style.padding = '1rem';
            promoCard.style.border = '1px solid rgba(0, 184, 148, 0.3)';

            // Format Date
            let expiryText = 'غير محدد';
            if (promo.expiryDate) {
                expiryText = new Date(promo.expiryDate).toLocaleDateString('ar-EG');
            }

            // Usage
            const usageText = promo.maxUses ? `${promo.usedCount || 0}/${promo.maxUses}` : `${promo.usedCount || 0} (مفتوح)`;

            promoCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="margin:0; color:#00b894; font-family:monospace; font-size:1.2rem;">${promo.code}</h3>
                    <span style="background:#00b894; color:white; padding:2px 8px; border-radius:4px;">${promo.discount}%-</span>
                </div>
                <div style="font-size:0.9rem; color:rgba(255,255,255,0.7); line-height:1.6;">
                    <p style="margin:0;">📅 ينتهي: ${expiryText}</p>
                    <p style="margin:0;">👥 الاستخدام: ${usageText}</p>
                </div>
                <button onclick="deletePromo('${id}')" style="width:100%; margin-top:10px; background:rgba(245, 87, 108, 0.1); color:#f5576c; border:1px solid #f5576c; padding:5px; border-radius:4px; cursor:pointer;">حذف الكوبون</button>
            `;
            promoList.appendChild(promoCard);
        });
    });
}

// Add New Promo
document.getElementById('promo-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const code = document.getElementById('promo-code').value.toUpperCase().trim();
    const discount = parseInt(document.getElementById('promo-discount').value);
    const expiry = document.getElementById('promo-expiry').value;
    const limit = document.getElementById('promo-limit').value;

    if (!code || !discount) return;

    const newPromo = {
        code: code,
        discount: discount,
        expiryDate: expiry ? new Date(expiry).getTime() : null,
        maxUses: limit ? parseInt(limit) : null,
        usedCount: 0,
        createdAt: Date.now()
    };

    promosRef.push(newPromo)
        .then(() => {
            showNotification('تم إنشاء الكوبون بنجاح! 🎟️');
            if (window.adminLog) window.adminLog.promoCreated(code);
            document.getElementById('promo-form').reset();
        })
        .catch(err => showNotification('خطأ: ' + err.message, 'error'));
});

// Delete Promo
window.deletePromo = function (id) {
    showConfirmModal(
        'حذف الكوبون',
        'هل أنت متأكد من حذف هذا الكوبون؟',
        () => {
            promosRef.child(id).remove().then(() => {
                if (window.adminLog) window.adminLog.promoDeleted(id.slice(-6));
            });
        }
    );
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================
// Theme Presets Logic
window.applyThemePreset = function (preset) {
    const primaryInput = document.getElementById('theme-primary');
    const secondaryInput = document.getElementById('theme-secondary');
    const accentInput = document.getElementById('theme-accent');
    const bgPrimaryInput = document.getElementById('theme-bg-primary');
    const bgSecondaryInput = document.getElementById('theme-bg-secondary');
    const textPrimaryInput = document.getElementById('theme-text-primary');
    const textSecondaryInput = document.getElementById('theme-text-secondary');

    const presetNameInput = document.getElementById('theme-preset-name');

    if (preset === 'purple') {
        primaryInput.value = '#667eea';
        secondaryInput.value = '#f5576c';
        accentInput.value = '#4facfe';
        bgPrimaryInput.value = '#0f0f1e';
        bgSecondaryInput.value = '#1a1a2e';
        textPrimaryInput.value = '#ffffff';
        textSecondaryInput.value = '#b3b3b3';
        presetNameInput.value = 'purple';
    } else if (preset === 'red') {
        primaryInput.value = '#e53935';
        secondaryInput.value = '#ff5252';
        accentInput.value = '#ff1744';
        bgPrimaryInput.value = '#1a0505';
        bgSecondaryInput.value = '#2d0a0a';
        textPrimaryInput.value = '#ffffff';
        textSecondaryInput.value = '#ffa8a8';
        presetNameInput.value = 'red';
    } else if (preset === 'blue') {
        primaryInput.value = '#1e88e5';
        secondaryInput.value = '#42a5f5';
        accentInput.value = '#2979ff';
        bgPrimaryInput.value = '#05131a';
        bgSecondaryInput.value = '#0a232e';
        textPrimaryInput.value = '#ffffff';
        textSecondaryInput.value = '#a8d5ff';
        presetNameInput.value = 'blue';
    } else if (preset === 'pitchblack') {
        primaryInput.value = '#ffffff';
        secondaryInput.value = '#333333';
        accentInput.value = '#ffffff';
        bgPrimaryInput.value = '#000000';
        bgSecondaryInput.value = '#0a0a0a';
        textPrimaryInput.value = '#e0e0e0';
        textSecondaryInput.value = '#888888';
        presetNameInput.value = 'pitchblack';
    } else if (preset === 'light') {
        primaryInput.value = '#2563eb';
        secondaryInput.value = '#1d4ed8';
        accentInput.value = '#3b82f6';
        bgPrimaryInput.value = '#f3f4f6';
        bgSecondaryInput.value = '#ffffff';
        textPrimaryInput.value = '#111827';
        textSecondaryInput.value = '#4b5563';
        presetNameInput.value = 'light';
    } else {
        presetNameInput.value = 'custom';
    }
};

// Listen for color changes to set preset to custom
['theme-primary', 'theme-secondary', 'theme-accent', 'theme-bg-primary', 'theme-bg-secondary', 'theme-text-primary', 'theme-text-secondary'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        document.getElementById('theme-preset-name').value = 'custom';
    });
});

// Toggle Effect Controls Visibility
let isAdminPreviewEnabled = false;

document.getElementById('theme-effect').addEventListener('change', function () {
    const controls = document.querySelector('.effect-controls');
    if (controls) {
        controls.style.display = this.value ? 'block' : 'none';

        // Update live preview if enabled
        if (window.SeasonalEffects && isAdminPreviewEnabled) {
            window.SeasonalEffects.init({
                type: this.value,
                speed: parseFloat(document.getElementById('effect-speed').value) || 1.0,
                density: parseFloat(document.getElementById('effect-density').value) || 1.0,
                size: parseFloat(document.getElementById('effect-size').value) || 1.0
            });
        }
    }
});

// Update live preview on slider change
['effect-speed', 'effect-density', 'effect-size'].forEach(id => {
    document.getElementById(id).addEventListener('input', function () {
        if (window.SeasonalEffects && isAdminPreviewEnabled) {
            window.SeasonalEffects.init({
                type: document.getElementById('theme-effect').value,
                speed: parseFloat(document.getElementById('effect-speed').value) || 1.0,
                density: parseFloat(document.getElementById('effect-density').value) || 1.0,
                size: parseFloat(document.getElementById('effect-size').value) || 1.0
            });
        }
    });
});

// Toggle Preview Button
document.getElementById('toggle-effect-preview').addEventListener('click', function () {
    isAdminPreviewEnabled = !isAdminPreviewEnabled;

    if (isAdminPreviewEnabled) {
        this.innerHTML = '👁️ عرض/إخفاء التأثير هنا (Toggle Preview)';
        this.style.opacity = '1';
        // Show effect
        if (window.SeasonalEffects) {
            window.SeasonalEffects.init({
                type: document.getElementById('theme-effect').value,
                speed: parseFloat(document.getElementById('effect-speed').value) || 1.0,
                density: parseFloat(document.getElementById('effect-density').value) || 1.0,
                size: parseFloat(document.getElementById('effect-size').value) || 1.0
            });
        }
    } else {
        this.innerHTML = '👁️‍🗨️ المعاينة متوقفة (Preview Off)';
        this.style.opacity = '0.7';
        // Hide effect
        if (window.SeasonalEffects) {
            window.SeasonalEffects.init({ type: 'none' });
        }
    }
});

// Reset Effect Defaults
document.getElementById('reset-effect-defaults').addEventListener('click', function () {
    // Reset inputs
    document.getElementById('effect-speed').value = 1.0;
    document.getElementById('effect-density').value = 1.0;
    document.getElementById('effect-size').value = 1.0;

    // Reset labels
    document.getElementById('effect-speed-val').textContent = '1.0x';
    document.getElementById('effect-density-val').textContent = '1.0x';
    document.getElementById('effect-size-val').textContent = '1.0x';

    // Update live preview
    if (window.SeasonalEffects && isAdminPreviewEnabled) {
        window.SeasonalEffects.init({
            type: document.getElementById('theme-effect').value,
            speed: 1.0,
            density: 1.0,
            size: 1.0
        });
    }

    showNotification('تم استعادة الإعدادات الافتراضية للتأثير', 'success');
});

// Save Effect Settings Independently
document.getElementById('save-effect-settings').addEventListener('click', function () {
    const effect = document.getElementById('theme-effect').value;
    const effectConfig = {
        speed: parseFloat(document.getElementById('effect-speed').value) || 1.0,
        density: parseFloat(document.getElementById('effect-density').value) || 1.0,
        size: parseFloat(document.getElementById('effect-size').value) || 1.0
    };

    // Update Firebase
    const updates = {};
    updates['theme/effect'] = effect;
    updates['theme/effectConfig'] = effectConfig;
    updates['lastUpdated'] = Date.now();

    settingsRef.update(updates)
        .then(() => {
            showNotification('تم حفظ تأثيرات الطقس بنجاح! 💾');
        })
        .catch((error) => {
            showNotification('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        });
});

// ============================================
// GROQ API KEY VISIBILITY TOGGLE
// ============================================
window.toggleGroqKeyVisibility = function () {
    const input = document.getElementById('groq-api-key');
    const btn = document.getElementById('toggle-groq-key');
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '👁️';
        btn.style.background = 'rgba(100, 255, 218, 0.15)';
        btn.style.borderColor = 'rgba(100, 255, 218, 0.4)';
    } else {
        input.type = 'password';
        btn.textContent = '👁️\u200d🗨️';
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
    }
};

// System prompts cache (per model)
let aiSystemPrompts = {};
const AI_DEFAULT_PROMPT = 'أنت مساعد ذكاء اصطناعي لمتجر إلكتروني. أجب باللغة العربية بشكل مختصر ومفيد.';

// Chat history for the mini chat
let aiChatHistory = [];

// Model selector change handler — also loads per-model system prompt
// document.getElementById('groq-model-select').addEventListener('change', function () {
//     const modelId = this.value;
//     const models = window.AdminAI ? window.AdminAI.MODELS : null;
//     const info = models ? models[modelId] : null;

//     if (info) {
//         document.getElementById('model-info-name').textContent = info.name;
//         document.getElementById('model-info-params').textContent = info.params;
//         document.getElementById('model-info-ctx').textContent = (info.context >= 131072 ? '128K' : Math.round(info.context / 1024) + 'K') + ' ctx';
//         document.getElementById('model-info-desc').textContent = info.description;
//     }

//     // Load the system prompt for this model
//     const key = modelId.replace(/[\/\.]/g, '_');
//     const stored = aiSystemPrompts[key];
//     document.getElementById('ai-system-prompt').value = stored || AI_DEFAULT_PROMPT;
//     document.getElementById('system-prompt-status').textContent = stored ? '✅ محفوظ' : '📝 افتراضي';
// });

// Save system prompt for the current model
window.saveSystemPrompt = function () {
    const modelId = document.getElementById('groq-model-select').value;
    const key = modelId.replace(/[\/\.]/g, '_');
    const prompt = document.getElementById('ai-system-prompt').value.trim();

    if (!prompt) {
        showNotification('أدخل موجه النظام أولاً', 'error');
        return;
    }

    aiSystemPrompts[key] = prompt;

    settingsRef.update({ aiSystemPrompts: aiSystemPrompts })
        .then(() => {
            document.getElementById('system-prompt-status').textContent = '✅ تم الحفظ!';
            showNotification('💾 تم حفظ موجه النظام لـ ' + modelId);
        })
        .catch(err => showNotification('خطأ: ' + err.message, 'error'));
};

// Reset system prompt to default
window.resetSystemPrompt = function () {
    const modelId = document.getElementById('groq-model-select').value;
    const key = modelId.replace(/[\/\.]/g, '_');

    document.getElementById('ai-system-prompt').value = AI_DEFAULT_PROMPT;
    delete aiSystemPrompts[key];

    settingsRef.update({ aiSystemPrompts: aiSystemPrompts })
        .then(() => {
            document.getElementById('system-prompt-status').textContent = '📝 افتراضي';
            showNotification('🔄 تم استعادة الموجه الافتراضي');
        })
        .catch(err => showNotification('خطأ: ' + err.message, 'error'));
};

// System Prompt Presets
const PROMPT_PRESETS = {
    product: '🛍️ أنت كاتب محتوى تسويقي محترف لمتجر إلكتروني يبيع منتجات رقمية (برامج، ألعاب، اشتراكات). مهمتك كتابة أوصاف منتجات جذابة واحترافية باللغة العربية. اجعل الوصف تسويقياً ومقنعاً ومختصراً بدون حشو. استخدم لغة تشجع على الشراء. لا تضف علامات اقتباس أو عناوين — أعد النص الخام فقط.',
    announcement: '📢 أنت كاتب إعلانات محترف لمتجر إلكتروني. مهمتك كتابة نصوص إعلانية قصيرة وجذابة لشريط الإعلانات. يجب أن تكون النصوص مختصرة (سطر واحد فقط)، مع إيموجي مناسبة، ولغة تحفيزية تشجع على التفاعل والشراء. أعد نص الإعلان فقط بدون أي شرح.',
    support: '🎧 أنت موظف دعم عملاء ودود ومحترف لمتجر إلكتروني يبيع منتجات رقمية. ساعد العملاء بأسلوب مهذب وصبور. قدم حلولاً واضحة ومختصرة. إذا لم تعرف الإجابة، وجّه العميل للتواصل مع الإدارة. أجب دائماً باللغة العربية. كن متعاطفاً مع مشاكل العملاء.',
    seo: '🔍 أنت خبير SEO محترف. مهمتك كتابة عناوين ميتا (meta titles) وأوصاف ميتا (meta descriptions) وكلمات مفتاحية محسّنة لمحركات البحث باللغة العربية. اجعل العناوين جذابة وتحتوي على الكلمات المفتاحية الرئيسية. الأوصاف يجب أن تكون بين 150-160 حرف.',
    translator: '🌐 أنت مترجم محترف متخصص في الترجمة بين العربية والإنجليزية في مجال التقنية والمنتجات الرقمية. ترجم النصوص بدقة مع الحفاظ على المعنى والسياق. إذا احتوى النص على مصطلحات تقنية، استخدم الترجمة المتعارف عليها. أعد الترجمة فقط بدون أي شرح.',
    email: '✉️ أنت كاتب إيميلات محترف لمتجر إلكتروني. مهمتك كتابة رسائل بريد إلكتروني احترافية وودية باللغة العربية. تشمل: رسائل ترحيب، تأكيد الطلبات، عروض ترويجية، متابعة العملاء، واستعادة السلات المتروكة. اجعل الإيميل مختصراً وجذاباً مع دعوة واضحة للإجراء (CTA). أعد نص الإيميل فقط.',
    general: '🤖 أنت مساعد ذكاء اصطناعي ذكي ومفيد لمتجر إلكتروني. أجب على الأسئلة باللغة العربية بشكل مختصر ومفيد. يمكنك المساعدة في كتابة المحتوى، تحليل البيانات، اقتراح أفكار تسويقية، والإجابة على الأسئلة العامة. كن ودوداً ومحترفاً.'
};

window.loadPromptPreset = function (presetKey) {
    const prompt = PROMPT_PRESETS[presetKey];
    if (prompt) {
        document.getElementById('ai-system-prompt').value = prompt;
        document.getElementById('system-prompt-status').textContent = '⚡ قالب — اضغط حفظ لتثبيته';
        showNotification('⚡ تم تحميل القالب — اضغط "حفظ الموجه" لحفظه للنموذج الحالي');
    }
};

// Get the active system prompt for current model
function getActiveSystemPrompt() {
    const modelId = document.getElementById('groq-model-select').value;
    const key = modelId.replace(/[\/\.]/g, '_');
    return aiSystemPrompts[key] || AI_DEFAULT_PROMPT;
}

// ---------- Mini AI Chat ----------

window.sendAIChatMessage = async function () {
    const input = document.getElementById('ai-chat-input');
    const messagesDiv = document.getElementById('ai-chat-messages');
    const sendBtn = document.getElementById('ai-chat-send-btn');
    const userText = input.value.trim();

    if (!userText) return;
    if (!window.AdminAI || !window.AdminAI.getApiKey()) {
        showNotification('أضف مفتاح Groq API في الإعدادات → AI / API', 'error');
        return;
    }

    // Clear placeholder if first message
    if (aiChatHistory.length === 0) {
        messagesDiv.innerHTML = '';
    }

    // Add user message
    aiChatHistory.push({ role: 'user', content: userText });
    appendChatBubble('user', userText, messagesDiv);
    input.value = '';

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    messagesDiv.innerHTML += `<div id="${typingId}" style="display: flex; gap: 8px; align-items: flex-start;">
        <span style="font-size: 1.2rem;">🤖</span>
        <div style="background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 10px; padding: 10px 14px; color: rgba(255,255,255,0.5); font-size: 0.9rem;">
            <span class="ai-typing-dots">⏳ يفكر...</span>
        </div>
    </div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    sendBtn.disabled = true;
    sendBtn.textContent = '⏳...';

    try {
        const messages = [
            { role: 'system', content: getActiveSystemPrompt() },
            ...aiChatHistory
        ];

        const response = await window.AdminAI.chat('', { messages });

        // Remove typing indicator
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        // Add AI response
        aiChatHistory.push({ role: 'assistant', content: response });
        appendChatBubble('assistant', response, messagesDiv);

    } catch (error) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();
        appendChatBubble('error', error.message, messagesDiv);
    }

    sendBtn.disabled = false;
    sendBtn.textContent = 'إرسال ➤';
};

function appendChatBubble(role, text, container) {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; gap: 8px; align-items: flex-start;';

    if (role === 'user') {
        div.style.flexDirection = 'row-reverse';
        div.innerHTML = `
            <span style="font-size: 1.2rem;">👤</span>
            <div style="background: rgba(100, 255, 218, 0.08); border: 1px solid rgba(100, 255, 218, 0.2); border-radius: 10px; padding: 10px 14px; color: rgba(255,255,255,0.85); font-size: 0.9rem; max-width: 80%; word-wrap: break-word; white-space: pre-wrap;">${escapeHtml(text)}</div>
        `;
    } else if (role === 'assistant') {
        div.innerHTML = `
            <span style="font-size: 1.2rem;">🤖</span>
            <div style="background: rgba(102, 126, 234, 0.08); border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 10px; padding: 10px 14px; color: rgba(255,255,255,0.85); font-size: 0.9rem; max-width: 80%; word-wrap: break-word; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(text)}</div>
        `;
    } else {
        div.innerHTML = `
            <span style="font-size: 1.2rem;">⚠️</span>
            <div style="background: rgba(244, 67, 54, 0.08); border: 1px solid rgba(244, 67, 54, 0.2); border-radius: 10px; padding: 10px 14px; color: #ef5350; font-size: 0.85rem; max-width: 80%;">${escapeHtml(text)}</div>
        `;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

window.clearAIChat = function () {
    aiChatHistory = [];
    document.getElementById('ai-chat-messages').innerHTML = `<div style="color: rgba(255,255,255,0.25); text-align: center; padding: 30px 10px; font-size: 0.9rem;">🤖 ابدأ محادثة مع الذكاء الاصطناعي...</div>`;
};


// Test AI Connection
window.testAIConnection = async function () {
    const btn = document.getElementById('test-ai-connection');
    const resultDiv = document.getElementById('ai-test-result');

    btn.disabled = true;
    btn.textContent = '⏳ جاري الاختبار...';
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="color: #4facfe; padding: 10px;">⏳ جاري الاتصال بـ Groq API...</div>';

    try {
        if (!window.AdminAI) throw new Error('ملف admin-ai.js غير محمّل');

        const result = await window.AdminAI.testConnection();

        if (result.success) {
            resultDiv.innerHTML = `
                <div style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); border-radius: 8px; padding: 12px;">
                    <div style="color: #81c784; font-weight: bold;">✅ الاتصال ناجح!</div>
                    <div style="color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-top: 5px;">
                        🤖 النموذج: ${result.model}<br>
                        💬 الرد: ${result.message}
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3); border-radius: 8px; padding: 12px;">
                    <div style="color: #ef5350; font-weight: bold;">❌ فشل الاتصال</div>
                    <div style="color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-top: 5px;">${result.message}</div>
                </div>
            `;
        }
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="background: rgba(244, 67, 54, 0.1); border: 1px solid rgba(244, 67, 54, 0.3); border-radius: 8px; padding: 12px;">
                <div style="color: #ef5350; font-weight: bold;">❌ خطأ</div>
                <div style="color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-top: 5px;">${error.message}</div>
            </div>
        `;
    }

    btn.disabled = false;
    btn.textContent = '✅ اختبار الاتصال';
};

// AI Enhance - Short Description
window.aiEnhanceShortDesc = async function () {
    const productName = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const currentDesc = document.getElementById('product-short-desc').value.trim();
    const btn = event.target.closest('button');

    if (!productName) {
        showNotification('أدخل اسم المنتج أولاً', 'error');
        return;
    }
    if (!window.AdminAI || !window.AdminAI.getApiKey()) {
        showNotification('أضف مفتاح Groq API في الإعدادات → AI / API', 'error');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ جاري التحسين...';

    try {
        let prompt;
        if (currentDesc) {
            prompt = `حسّن هذا الوصف المختصر لمنتج رقمي اسمه "${productName}" (تصنيف: ${category}): "${currentDesc}". اكتب وصفاً مختصراً جذاباً في سطر واحد فقط باللغة العربية. أعد الوصف المحسّن فقط بدون أي شرح إضافي.`;
        } else {
            prompt = `اكتب وصفاً مختصراً جذاباً (سطر واحد فقط) لمنتج رقمي اسمه "${productName}" في تصنيف "${category}". باللغة العربية. أعد الوصف فقط بدون أي شرح.`;
        }

        const result = await window.AdminAI.chat(prompt, {
            systemPrompt: 'أنت كاتب محتوى تسويقي محترف. اكتب أوصاف منتجات قصيرة وجذابة. أعد النص فقط بدون علامات اقتباس أو شرح.',
            maxTokens: 100,
            temperature: 0.8
        });

        document.getElementById('product-short-desc').value = result.replace(/^["']|["']$/g, '').trim();
        showNotification('✨ تم تحسين الوصف المختصر بالذكاء الاصطناعي');
    } catch (error) {
        showNotification('خطأ: ' + error.message, 'error');
    }

    btn.disabled = false;
    btn.textContent = originalText;
};

// AI Enhance - Full Description
window.aiEnhanceFullDesc = async function () {
    const productName = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const currentDesc = document.getElementById('product-description').value.trim();
    const btn = event.target.closest('button');

    if (!productName) {
        showNotification('أدخل اسم المنتج أولاً', 'error');
        return;
    }
    if (!window.AdminAI || !window.AdminAI.getApiKey()) {
        showNotification('أضف مفتاح Groq API في الإعدادات → AI / API', 'error');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ جاري التحسين...';

    try {
        let prompt;
        if (currentDesc) {
            prompt = `حسّن هذا الوصف التفصيلي لمنتج رقمي اسمه "${productName}" (تصنيف: ${category}): "${currentDesc}". اكتب وصفاً تفصيلياً جذاباً ومقنعاً (3-5 أسطر) باللغة العربية. أعد الوصف المحسّن فقط بدون أي شرح إضافي.`;
        } else {
            prompt = `اكتب وصفاً تفصيلياً جذاباً ومقنعاً (3-5 أسطر) لمنتج رقمي اسمه "${productName}" في تصنيف "${category}". يجب أن يكون تسويقياً واحترافياً باللغة العربية. أعد الوصف فقط بدون أي شرح.`;
        }

        const result = await window.AdminAI.chat(prompt, {
            systemPrompt: 'أنت كاتب محتوى تسويقي محترف لمتجر إلكتروني. اكتب أوصاف منتجات مفصلة وجذابة خالية من الحشو. أعد النص فقط بدون علامات اقتباس.',
            maxTokens: 300,
            temperature: 0.8
        });

        document.getElementById('product-description').value = result.replace(/^["']|["']$/g, '').trim();
        showNotification('✨ تم تحسين الوصف الكامل بالذكاء الاصطناعي');
    } catch (error) {
        showNotification('خطأ: ' + error.message, 'error');
    }

    btn.disabled = false;
    btn.textContent = originalText;
};

// AI Generate Features List
window.aiGenerateFeatures = async function () {
    const productName = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const currentFeatures = document.getElementById('product-features').value.trim();
    const btn = event.target.closest('button');

    if (!productName) {
        showNotification('أدخل اسم المنتج أولاً', 'error');
        return;
    }
    if (!window.AdminAI || !window.AdminAI.getApiKey()) {
        showNotification('أضف مفتاح Groq API في الإعدادات → AI / API', 'error');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ جاري التوليد...';

    try {
        let prompt;
        if (currentFeatures) {
            prompt = `حسّن قائمة مميزات منتج رقمي اسمه "${productName}" (تصنيف: ${category}).
المميزات الحالية:
${currentFeatures}

أعد كتابة المميزات بتنسيق: إيموجي|عنوان الميزة|وصف مختصر للميزة
كل سطر ميزة واحدة. استخدم إيموجي مناسب لكل ميزة. الوصف مختصر وجذاب باللغة العربية.
أعد القائمة فقط بدون أي شرح أو عناوين إضافية.`;
        } else {
            prompt = `اكتب 4-6 مميزات لمنتج رقمي اسمه "${productName}" في تصنيف "${category}".

التنسيق المطلوب: إيموجي|عنوان الميزة|وصف مختصر للميزة
كل سطر ميزة واحدة فقط.
مثال:
🚀|سرعة فائقة|أداء عالي بدون تأخير
🔒|حماية متقدمة|تشفير كامل لبياناتك

استخدم إيموجي مناسب لكل ميزة. الوصف مختصر وجذاب باللغة العربية.
أعد القائمة فقط بدون أي شرح أو عناوين إضافية.`;
        }

        const result = await window.AdminAI.chat(prompt, {
            systemPrompt: 'أنت كاتب محتوى محترف. أعد فقط قائمة المميزات بالتنسيق المطلوب (إيموجي|عنوان|وصف) بدون أي نص إضافي أو علامات اقتباس أو عناوين.',
            maxTokens: 400,
            temperature: 0.8
        });

        document.getElementById('product-features').value = result.replace(/^["'`\s]+|["'`\s]+$/g, '').trim();
        showNotification('🏷️ تم توليد المميزات بالذكاء الاصطناعي');
    } catch (error) {
        showNotification('خطأ: ' + error.message, 'error');
    }

    btn.disabled = false;
    btn.textContent = originalText;
};

// AI Enhance - Meta Description (SEO)
window.aiEnhanceMetaDesc = async function () {
    const productName = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const currentDesc = document.getElementById('product-meta-desc').value.trim();
    const fullDesc = document.getElementById('product-description').value.trim();
    const btn = event.target.closest('button');

    if (!productName) {
        showNotification('أدخل اسم المنتج أولاً', 'error');
        return;
    }
    if (!window.AdminAI || !window.AdminAI.getApiKey()) {
        showNotification('أضف مفتاح Groq API في الإعدادات → AI / API', 'error');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ جاري التحسين...';

    try {
        let prompt;
        const context = fullDesc ? `معلومات عن المنتج: "${fullDesc.substring(0, 300)}..."` : '';

        if (currentDesc) {
            prompt = `حسّن وصف الميتا (Meta Description) التالي لصفحة منتج "${productName}" (${category}). الوصف الحالي: "${currentDesc}". ${context}
            اكتب وصفاً جديداً جذاباً لمحركات البحث (SEO) باللغة العربية. يجب أن يكون بين 140 و 160 حرفاً. ركز على الكلمات المفتاحية والدعوة لاتخاذ إجراء.`;
        } else {
            prompt = `اكتب وصف ميتا (Meta Description) احترافي لصفحة منتج "${productName}" (${category}). ${context}
            الوصف يجب أن يكون جذاباً، متوافقاً مع SEO، وباللغة العربية. الحد الأقصى 160 حرفاً.`;
        }

        const result = await window.AdminAI.chat(prompt, {
            systemPrompt: 'أنت خبير SEO. اكتب أوصاف ميتا (Meta Descriptions) دقيقة وجذابة. الرد يجب أن يكون النص فقط (بدون عناوين أو شرح). الطول: 140-160 حرف.',
            maxTokens: 100,
            temperature: 0.7
        });

        const finalDesc = result.replace(/^["']|["']$/g, '').trim().substring(0, 160);
        document.getElementById('product-meta-desc').value = finalDesc;

        // Update counter
        const counter = document.getElementById('meta-desc-count');
        if (counter) counter.textContent = finalDesc.length + ' / 160';

        showNotification('✨ تم تحسين وصف SEO بنجاح');
    } catch (error) {
        showNotification('خطأ: ' + error.message, 'error');
    }

    btn.disabled = false;
    btn.textContent = originalText;
};

// Meta Description Character Counter
document.addEventListener('DOMContentLoaded', () => {
    const metaInput = document.getElementById('product-meta-desc');
    const metaCounter = document.getElementById('meta-desc-count');
    if (metaInput && metaCounter) {
        metaInput.addEventListener('input', function () {
            const count = this.value.length;
            metaCounter.textContent = count + ' / 160';
            if (count > 160) {
                metaCounter.style.color = '#f44336';
            } else {
                metaCounter.style.color = 'rgba(255,255,255,0.4)';
            }
        });
    }
});

// ---------- Translation & Dialect Handlers ----------

window.translateAllFields = async function (direction) {
    if (!window.AITranslator) {
        showNotification('وحدة الترجمة غير محمّلة', 'error');
        return;
    }

    const statusDiv = document.getElementById('translator-status');
    const dirLabel = direction === 'ar-to-en' ? 'عربي → English' : 'English → عربي';
    statusDiv.style.display = 'block';
    statusDiv.textContent = `⏳ جاري الترجمة (${dirLabel})...`;
    statusDiv.style.color = '#4dd0e1';

    try {
        const count = await window.AITranslator.translateProductFields(direction);
        if (count > 0) {
            statusDiv.textContent = `✅ تمت ترجمة ${count} حقول بنجاح`;
            statusDiv.style.color = '#64ffda';
            showNotification(`🌐 تمت ترجمة ${count} حقول (${dirLabel})`);
        } else {
            statusDiv.textContent = '⚠️ لا توجد حقول تحتوي على نص للترجمة';
            statusDiv.style.color = '#ffb74d';
        }
    } catch (error) {
        statusDiv.textContent = '❌ خطأ: ' + error.message;
        statusDiv.style.color = '#ef5350';
        showNotification('خطأ في الترجمة: ' + error.message, 'error');
    }

    setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
};

window.adaptToDialect = async function () {
    const dialectKey = document.getElementById('dialect-select').value;
    if (!dialectKey) {
        showNotification('اختر لهجة أولاً', 'error');
        return;
    }
    if (!window.AITranslator) {
        showNotification('وحدة الترجمة غير محمّلة', 'error');
        return;
    }

    const dialect = window.AITranslator.DIALECTS[dialectKey];
    const statusDiv = document.getElementById('translator-status');
    statusDiv.style.display = 'block';
    statusDiv.textContent = `⏳ جاري التحويل إلى ${dialect.name}...`;
    statusDiv.style.color = '#ffb74d';

    try {
        const count = await window.AITranslator.adaptProductDialect(dialectKey);
        if (count > 0) {
            statusDiv.textContent = `✅ تم تحويل ${count} حقول إلى ${dialect.name}`;
            statusDiv.style.color = '#64ffda';
            showNotification(`🗣️ تم تحويل ${count} حقول إلى ${dialect.name} ${dialect.flag}`);
        } else {
            statusDiv.textContent = '⚠️ لا توجد حقول تحتوي على نص للتحويل';
            statusDiv.style.color = '#ffb74d';
        }
    } catch (error) {
        statusDiv.textContent = '❌ خطأ: ' + error.message;
        statusDiv.style.color = '#ef5350';
        showNotification('خطأ في التحويل: ' + error.message, 'error');
    }

    // Reset dropdown
    document.getElementById('dialect-select').selectedIndex = 0;
    setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
};

// ============================================
// AI MULTI-PROVIDER HANDLERS
// ============================================

window.switchAIProvider = function (providerId) {
    // UI Updates
    document.querySelectorAll('.ai-provider-tab').forEach(btn => {
        const isTarget = btn.dataset.provider === providerId;
        btn.classList.toggle('active', isTarget);

        // Reset styles first
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = 'rgba(255,255,255,0.6)';
        btn.style.borderColor = 'transparent';

        if (isTarget) {
            if (providerId === 'groq') {
                btn.style.background = 'rgba(245,80,54,0.12)';
                btn.style.color = '#f55036';
                btn.style.borderColor = '#f55036';
            } else if (providerId === 'cerebras') {
                btn.style.background = 'rgba(255,107,53,0.12)';
                btn.style.color = '#ff6b35';
                btn.style.borderColor = 'rgba(255,107,53,0.5)';
            } else if (providerId === 'sambanova') {
                btn.style.background = 'rgba(255,140,0,0.12)';
                btn.style.color = '#ff8c00';
                btn.style.borderColor = 'rgba(255,140,0,0.5)';
            } else if (providerId === 'openrouter') {
                btn.style.background = 'rgba(99,102,241,0.12)';
                btn.style.color = '#6366f1';
                btn.style.borderColor = 'rgba(99,102,241,0.5)';
            }
        }
    });

    const provider = window.AdminAI.getProviders()[providerId];
    if (!provider) return;

    // Update Provider Card
    const card = document.getElementById('ai-provider-card');
    card.style.background = `${provider.color}08`; // 5% opacity
    card.style.borderColor = `${provider.color}26`; // 15% opacity

    document.getElementById('ai-provider-icon').textContent = provider.icon;
    document.getElementById('ai-provider-title').textContent = `${provider.name} API Key`;
    document.getElementById('ai-provider-title').style.color = provider.color;
    document.getElementById('ai-provider-desc').textContent = provider.description;

    const link = document.getElementById('ai-provider-link');
    link.href = provider.website;

    const keyInput = document.getElementById('ai-api-key');
    keyInput.placeholder = provider.keyPlaceholder;
    // Load key from AdminAI state
    keyInput.value = window.AdminAI.getApiKey(providerId) || '';

    // Update AdminAI State
    window.AdminAI.setCurrentProvider(providerId);

    // Populate Models
    populateAIModels(providerId);
};

window.populateAIModels = function (providerId) {
    const models = window.AdminAI.getModels(providerId);
    const select = document.getElementById('groq-model-select');
    select.innerHTML = '';

    Object.entries(models).forEach(([id, model]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${model.icon} ${model.name}`;
        select.appendChild(option);
    });

    if (select.options.length > 0) {
        select.selectedIndex = 0;
        updateAIModelInfo();
    }
};

window.updateAIModelInfo = function () {
    const select = document.getElementById('groq-model-select');
    const modelId = select.value;
    const model = window.AdminAI.getModelInfo(modelId);

    if (model) {
        document.getElementById('model-info-name').textContent = model.name;
        document.getElementById('model-info-desc').textContent = model.description;
        document.getElementById('model-info-params').textContent = model.params;
        document.getElementById('model-info-ctx').textContent = (model.context / 1024) + 'K ctx';
    }
};

window.toggleAIKeyVisibility = function () {
    const input = document.getElementById('ai-api-key');
    input.type = input.type === 'password' ? 'text' : 'password';
};

window.testAIConnection = async function () {
    const btn = document.getElementById('test-ai-connection');
    const resultDiv = document.getElementById('ai-test-result');
    const originalText = btn.textContent;

    // Update local key before testing
    const currentProvider = window.AdminAI.getCurrentProvider();
    const currentKey = document.getElementById('ai-api-key').value.trim();
    window.AdminAI.setApiKey(currentProvider, currentKey);

    btn.disabled = true;
    btn.textContent = '⏳ جاري الاختبار...';
    resultDiv.style.display = 'none';

    try {
        const result = await window.AdminAI.testConnection();
        resultDiv.style.display = 'block';
        if (result.success) {
            resultDiv.innerHTML = `
                <div style="background: rgba(76, 175, 80, 0.1); color: #81c784; padding: 10px; border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.2);">
                    <strong>✅ نجح الاتصال!</strong><br>
                    <small>الرد: "${result.message}"</small><br>
                    <small>النموذج: ${result.model} | المزود: ${result.provider}</small>
                </div>
            `;
            showNotification('✅ تم الاتصال بنجاح!');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="background: rgba(244, 67, 54, 0.1); color: #e57373; padding: 10px; border-radius: 8px; border: 1px solid rgba(244, 67, 54, 0.2);">
                <strong>❌ فشل الاتصال</strong><br>
                <small>${error.message}</small>
            </div>
        `;
        showNotification('❌ فشل اختبار الاتصال', 'error');
    }

    btn.disabled = false;
    btn.textContent = originalText;
};

// Event Listeners for Model Change & Key Input
document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('groq-model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', window.updateAIModelInfo);
    }
    const keyInput = document.getElementById('ai-api-key');
    if (keyInput) {
        keyInput.addEventListener('input', (e) => {
            window.AdminAI.setApiKey(window.AdminAI.getCurrentProvider(), e.target.value.trim());
        });
    }
});

// Load settings (exchange rate, phone, facebook, email, theme, admins)
function loadSettings() {
    settingsRef.once('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            if (settings.exchangeRate) {
                document.getElementById('exchange-rate').value = settings.exchangeRate;
                window.exchangeRate = parseFloat(settings.exchangeRate);
                document.dispatchEvent(new CustomEvent('settings-loaded'));
            }
            if (settings.phoneNumber) document.getElementById('contact-phone').value = settings.phoneNumber;
            if (settings.facebookUrl) document.getElementById('facebook-url').value = settings.facebookUrl;
            if (settings.contactEmail) document.getElementById('contact-email').value = settings.contactEmail;

            // Hero Settings
            if (settings.heroTitle) document.getElementById('hero-title').value = settings.heroTitle;
            if (settings.heroSubtitle) document.getElementById('hero-subtitle').value = settings.heroSubtitle;
            if (settings.heroDescription) document.getElementById('hero-description').value = settings.heroDescription;
            if (settings.heroImage) document.getElementById('hero-image').value = settings.heroImage;

            // Populate Categories Dropdown and Input
            if (settings.storeCategories) {
                document.getElementById('store-categories').value = settings.storeCategories;
                populateCategoryDropdown(settings.storeCategories);
            } else {
                // Default defaults
                populateCategoryDropdown('برامج, ألعاب, اشتراكات');
            }

            // Announcement Bar
            if (settings.announcementEnabled !== undefined) {
                document.getElementById('announcement-enabled').checked = settings.announcementEnabled;
            }
            if (settings.announcementInterval) {
                document.getElementById('announcement-interval').value = settings.announcementInterval;
            }

            // Load Active Announcements
            if (settings.announcements) {
                activeAnnouncements = settings.announcements || [];
            } else if (settings.announcementText) {
                // Migration: If old text exists but no new list, create one item
                activeAnnouncements = [{
                    text: settings.announcementText,
                    backgroundColor: '#667eea',
                    textColor: '#ffffff'
                }];
            } else {
                activeAnnouncements = [];
            }
            renderAnnouncementsList();

            // Admin Emails
            const ownerEmail = settings.ownerEmail // Fallback or default
            window.ownerEmail = ownerEmail; // Store globally for actions
            loadAdminEmails(settings.adminEmails, ownerEmail);

            // Maintenance Mode
            if (settings.maintenanceEnabled !== undefined) {
                const checkbox = document.getElementById('maintenance-enabled');
                checkbox.checked = settings.maintenanceEnabled;
                document.getElementById('maintenance-fields').style.display = settings.maintenanceEnabled ? 'flex' : 'none';
            }
            if (settings.maintenancePreset) {
                document.getElementById('maintenance-preset').value = settings.maintenancePreset;
                if (settings.maintenancePreset === 'custom') {
                    document.getElementById('custom-message-field').style.display = 'block';
                }
            }
            if (settings.maintenanceCustomMessage) {
                document.getElementById('maintenance-custom-message').value = settings.maintenanceCustomMessage;
            }



            // Theme Settings
            if (settings.theme) {
                if (settings.theme.primary) document.getElementById('theme-primary').value = settings.theme.primary;
                if (settings.theme.secondary) document.getElementById('theme-secondary').value = settings.theme.secondary;
                if (settings.theme.accent) document.getElementById('theme-accent').value = settings.theme.accent;
                if (settings.theme.bgPrimary) document.getElementById('theme-bg-primary').value = settings.theme.bgPrimary;
                if (settings.theme.bgSecondary) document.getElementById('theme-bg-secondary').value = settings.theme.bgSecondary;
                if (settings.theme.textPrimary) document.getElementById('theme-text-primary').value = settings.theme.textPrimary;
                if (settings.theme.textSecondary) document.getElementById('theme-text-secondary').value = settings.theme.textSecondary;
                if (settings.theme.preset) document.getElementById('theme-preset-name').value = settings.theme.preset;
                if (settings.theme.effect) document.getElementById('theme-effect').value = settings.theme.effect;

                // Load Effect Config
                const effectConfig = settings.theme.effectConfig || { speed: 1.0, density: 1.0, size: 1.0 };
                document.getElementById('effect-speed').value = effectConfig.speed || 1.0;
                document.getElementById('effect-speed-val').textContent = (effectConfig.speed || 1.0) + 'x';

                document.getElementById('effect-density').value = effectConfig.density || 1.0;
                document.getElementById('effect-density-val').textContent = (effectConfig.density || 1.0) + 'x';

                document.getElementById('effect-size').value = effectConfig.size || 1.0;
                document.getElementById('effect-size-val').textContent = (effectConfig.size || 1.0) + 'x';

                // Update live effect if available
                if (window.SeasonalEffects && settings.theme.effect && isAdminPreviewEnabled) {
                    window.SeasonalEffects.init({
                        type: settings.theme.effect,
                        ...effectConfig
                    });
                } else if (window.SeasonalEffects) {
                    // Ensure it's off if preview is disabled, even if setting exists
                    window.SeasonalEffects.init({ type: 'none' });
                }
            }
        } else {
            // Default exchange rate
            document.getElementById('exchange-rate').value = 9;
            window.exchangeRate = 9;
            populateCategoryDropdown('برامج, ألعاب, اشتراكات');
            loadAdminEmails(null);
        }
    });
}

function loadAdminEmails(adminEmails, ownerEmail) {
    const list = document.getElementById('admin-emails-list');
    const addContainer = document.getElementById('admin-add-container');
    const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';
    const isOwner = currentUserEmail && ownerEmail && currentUserEmail.toLowerCase() === ownerEmail.toLowerCase();

    list.innerHTML = '';

    // Toggle Add Container Visibility
    if (addContainer) {
        addContainer.style.display = isOwner ? 'flex' : 'none';
    }

    if (!adminEmails || Object.keys(adminEmails).length === 0) {
        list.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">لا يوجد مسؤولين إضافيين.</p>';
        return;
    }

    Object.entries(adminEmails).forEach(([key, email]) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.marginBottom = '5px';
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.padding = '8px';
        item.style.borderRadius = '4px';

        let deleteBtn = '';
        // Only show delete button if current user is owner
        // AND the email in the list is NOT the owner (owner can't delete themselves here, though logic handles it)
        if (isOwner && email.toLowerCase() !== ownerEmail.toLowerCase()) {
            deleteBtn = `<button onclick="removeAdminEmail('${key}')" type="button" style="background: none; border: none; color: #ff4444; cursor: pointer;">🗑️</button>`;
        } else if (email.toLowerCase() === ownerEmail.toLowerCase()) {
            deleteBtn = `<span style="color: gold; font-size: 0.8rem;">👑 المالك</span>`;
        }

        item.innerHTML = `
            <span>${email}</span>
            ${deleteBtn}
        `;
        list.appendChild(item);
    });
}

window.addAdminEmail = function () {
    const emailInput = document.getElementById('new-admin-email');
    const email = emailInput.value.trim();

    // Owner Check
    const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';
    const ownerEmail = window.ownerEmail;

    if (!ownerEmail || currentUserEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
        showNotification('عذراً، فقط المالك يمكنه إضافة مسؤولين.', 'error');
        return;
    }

    if (!email) {
        showNotification('الرجاء إدخال البريد الإلكتروني', 'error');
        return;
    }

    // Create a safe key for Firebase path (replace . with , or just use push)
    // Using push is safer for lists.
    // Or we can sanitize email to use as key: email.replace(/\./g, ',')
    const emailKey = email.replace(/\./g, ',');

    settingsRef.child('adminEmails').child(emailKey).set(email)
        .then(() => {
            showNotification('تم إضافة المسؤول بنجاح');
            emailInput.value = '';
            // Reload settings to update UI
            loadSettings();
        })
        .catch(err => {
            showNotification('خطأ: ' + err.message, 'error');
        });
};

window.removeAdminEmail = function (key) {
    // Owner Check
    const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';
    const ownerEmail = window.ownerEmail;

    if (!ownerEmail || currentUserEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
        showNotification('عذراً، فقط المالك يمكنه حذف المسؤولين.', 'error');
        return;
    }

    showConfirmModal('حذف مسؤول', 'هل أنت متأكد من إزالة هذا البريد من قائمة المسؤولين؟', () => {
        settingsRef.child('adminEmails').child(key).remove()
            .then(() => {
                showNotification('تم إزالة المسؤول');
                loadSettings();
            })
            .catch(err => {
                showNotification('خطأ: ' + err.message, 'error');
            });
    });
};

function populateCategoryDropdown(categoriesString) {
    const select = document.getElementById('product-category');
    const currentVal = select.value;
    select.innerHTML = '<option value="general">عام</option>';

    if (categoriesString) {
        const categories = categoriesString.split(',').map(c => c.trim()).filter(c => c);
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    }

    // Restore selection if possible, otherwise default
    // We only restore if the option exists now
    // Actually for 'Edit' mode, we need to set value AFTER populating.
}

// Save settings handler
document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const exchangeRate = parseFloat(document.getElementById('exchange-rate').value);
    const phoneNumber = document.getElementById('contact-phone').value;
    const facebookUrl = document.getElementById('facebook-url').value;
    const contactEmail = document.getElementById('contact-email').value;

    const heroTitle = document.getElementById('hero-title').value;
    const heroSubtitle = document.getElementById('hero-subtitle').value;
    const heroDescription = document.getElementById('hero-description').value;
    const heroImage = document.getElementById('hero-image').value;

    const storeCategories = document.getElementById('store-categories').value;

    const announcementEnabled = document.getElementById('announcement-enabled').checked;
    const announcementInterval = parseInt(document.getElementById('announcement-interval').value) || 5;
    // Announcements list is already in activeAnnouncements global var, we save it from there

    const maintenanceEnabled = document.getElementById('maintenance-enabled').checked;
    const maintenancePreset = document.getElementById('maintenance-preset').value;
    const maintenanceCustomMessage = document.getElementById('maintenance-custom-message').value;

    // Theme Data
    const themeData = {
        primary: document.getElementById('theme-primary').value,
        secondary: document.getElementById('theme-secondary').value,
        accent: document.getElementById('theme-accent').value,
        bgPrimary: document.getElementById('theme-bg-primary').value,
        bgSecondary: document.getElementById('theme-bg-secondary').value,
        textPrimary: document.getElementById('theme-text-primary').value,
        textSecondary: document.getElementById('theme-text-secondary').value,
        preset: document.getElementById('theme-preset-name').value,
        // Save Effect
        effect: document.getElementById('theme-effect').value,
        effectConfig: {
            speed: parseFloat(document.getElementById('effect-speed').value) || 1.0,
            density: parseFloat(document.getElementById('effect-density').value) || 1.0,
            size: parseFloat(document.getElementById('effect-size').value) || 1.0
        }
    };

    const settingsData = {
        exchangeRate: exchangeRate,
        phoneNumber: phoneNumber,
        facebookUrl: facebookUrl,
        contactEmail: contactEmail,
        heroTitle: heroTitle,
        heroSubtitle: heroSubtitle,
        heroDescription: heroDescription,
        heroImage: heroImage,
        storeCategories: storeCategories,
        announcementEnabled: announcementEnabled,
        announcementInterval: announcementInterval,
        announcements: activeAnnouncements, // Save the array
        maintenanceEnabled: maintenanceEnabled,
        maintenancePreset: maintenancePreset,
        maintenanceCustomMessage: maintenanceCustomMessage,

        // AI Settings
        aiProvider: window.AdminAI ? window.AdminAI.getCurrentProvider() : 'groq',
        aiModel: document.getElementById('groq-model-select').value,
        aiApiKeys: (function () {
            const keys = {};
            if (window.AdminAI) {
                const providers = window.AdminAI.getProviders();
                Object.keys(providers).forEach(pid => {
                    keys[pid] = window.AdminAI.getApiKey(pid);
                });
                // Ensure current input value is saved
                const currentPid = window.AdminAI.getCurrentProvider();
                keys[currentPid] = document.getElementById('ai-api-key').value.trim();
            }
            return keys;
        })(),

        // Legacy Support
        groqApiKey: document.getElementById('ai-api-key').value.trim(), // Saves current key as legacy groq key if provider is groq
        groqModel: document.getElementById('groq-model-select').value,

        theme: themeData,
        lastUpdated: Date.now() // Keep lastUpdated
    };

    settingsRef.update(settingsData)
        .then(() => {
            showNotification('تم حفظ الإعدادات بنجاح! 💾');
            if (window.adminLog) window.adminLog.settingsSaved();
            // Update dropdown immediately
            populateCategoryDropdown(storeCategories);
        })
        .catch((error) => {
            showNotification('حدث خطأ: ' + error.message, 'error');
        });
});

// ============================================
// ANNOUNCEMENT MANAGER LOGIC
// ============================================
let activeAnnouncements = [];

function renderAnnouncementsList() {
    const list = document.getElementById('announcements-list');
    list.innerHTML = '';

    if (!activeAnnouncements || activeAnnouncements.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5); padding: 10px;">لا توجد إعلانات حالياً</div>';
        return;
    }

    activeAnnouncements.forEach((ann, index) => {
        const item = document.createElement('div');
        item.className = 'announcement-item';
        item.style.cssText = `
            display: flex; justify-content: space-between; align-items: center;
            background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;
            border-right: 4px solid ${ann.backgroundColor || '#667eea'};
        `;

        item.innerHTML = `
            <div style="flex: 1; margin-left: 10px;">
                <div style="font-weight: bold; color: white;">${ann.text}</div>
                ${ann.link ? `<div style="font-size: 0.8rem; color: rgba(255,255,255,0.5); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 300px;">🔗 ${ann.link}</div>` : ''}
            </div>
            <div style="display: flex; gap: 5px;">
                <button type="button" onclick="editAnnouncement(${index})" class="btn btn-sm btn-secondary" style="padding: 5px 10px;">✏️</button>
                <button type="button" onclick="deleteAnnouncement(${index})" class="btn btn-sm btn-danger" style="padding: 5px 10px;">🗑️</button>
            </div>
        `;
        list.appendChild(item);
    });
}

window.openAnnouncementModal = function (editIndex = null) {
    const modal = document.getElementById('announcement-modal');
    const idInput = document.getElementById('edit-announcement-id');
    const textInput = document.getElementById('edit-announcement-text');
    const linkInput = document.getElementById('edit-announcement-link');
    const bgInput = document.getElementById('edit-announcement-bg');
    const colorInput = document.getElementById('edit-announcement-color');
    const preview = document.getElementById('announcement-preview');

    if (editIndex !== null && activeAnnouncements[editIndex]) {
        // Edit Mode
        const ann = activeAnnouncements[editIndex];
        idInput.value = editIndex;
        textInput.value = ann.text;
        linkInput.value = ann.link || '';
        bgInput.value = ann.backgroundColor || '#667eea';
        colorInput.value = ann.textColor || '#ffffff';
        document.querySelector('#announcement-modal h3').textContent = 'تعديل الإعلان';
    } else {
        // Add Mode
        idInput.value = '';
        textInput.value = '';
        linkInput.value = '';
        bgInput.value = '#667eea';
        colorInput.value = '#ffffff';
        document.querySelector('#announcement-modal h3').textContent = 'إضافة إعلان جديد';
    }

    // Update preset labels
    document.getElementById('bg-color-val').textContent = bgInput.value;
    document.getElementById('text-color-val').textContent = colorInput.value;

    // Update preview
    updateAnnouncementPreview();

    modal.style.display = 'flex';
};

window.closeAnnouncementModal = function () {
    document.getElementById('announcement-modal').style.display = 'none';
};

window.saveAnnouncement = function () {
    const id = document.getElementById('edit-announcement-id').value;
    const text = document.getElementById('edit-announcement-text').value.trim();
    const link = document.getElementById('edit-announcement-link').value.trim();
    const bg = document.getElementById('edit-announcement-bg').value;
    const color = document.getElementById('edit-announcement-color').value;

    if (!text) {
        showNotification('الرجاء إدخال نص الإعلان', 'error');
        return;
    }

    const announcement = {
        text: text,
        link: link,
        backgroundColor: bg,
        textColor: color
    };

    if (id !== '') {
        // Edit existing
        activeAnnouncements[parseInt(id)] = announcement;
    } else {
        // Add new
        activeAnnouncements.push(announcement);
    }

    renderAnnouncementsList();
    closeAnnouncementModal();
};

window.editAnnouncement = function (index) {
    openAnnouncementModal(index);
};

window.deleteAnnouncement = function (index) {
    showConfirmModal('حذف الإعلان', 'هل أنت متأكد من حذف هذا الإعلان؟', () => {
        activeAnnouncements.splice(index, 1);
        renderAnnouncementsList();
    });
};

function updateAnnouncementPreview() {
    const text = document.getElementById('edit-announcement-text').value || 'نص الإعلان التجريبي';
    const bg = document.getElementById('edit-announcement-bg').value;
    const color = document.getElementById('edit-announcement-color').value;

    const preview = document.getElementById('announcement-preview');
    preview.textContent = text;
    preview.style.backgroundColor = bg;
    preview.style.color = color;
}

// Add listeners for color/text changes in modal
['edit-announcement-text', 'edit-announcement-bg', 'edit-announcement-color'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', (e) => {
            if (e.target.type === 'color') {
                e.target.nextElementSibling.textContent = e.target.value;
            }
            updateAnnouncementPreview();
        });
    }
});

// Settings Tab Switcher
window.switchSettingsTab = function (tabId) {
    // Hide all contents
    document.querySelectorAll('.settings-subtab-content').forEach(el => el.style.display = 'none');

    // Deactivate all buttons
    document.querySelectorAll('.settings-tabs-nav .btn-tab').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = 'rgba(255,255,255,0.6)';
        btn.style.borderBottomColor = 'transparent';
    });

    // Show active content
    const activeContent = document.getElementById('settings-tab-' + tabId);
    if (activeContent) activeContent.style.display = 'block';

    // Activate button
    // We need to find the specific button clicked, but since we pass ID, we can find by iterating logic or just rely upon 'onclick' in HTML passing 'this' or finding by index. 
    // Easier approach: The clicked button called this function. 
    // To make it simple and cleaner, we'll iterate buttons to find which one calls the tabId
    // or we can perform a simple check.

    // Better visual update:
    const buttons = document.querySelectorAll('.settings-tabs-nav .btn-tab');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
            btn.style.color = '#fff';
            btn.style.borderBottomColor = '#64ffda'; // Accent color
        }
    });
};

// ============================================
// ADMIN AUTHENTICATION (SECURE - Firebase Auth)
// NO HARDCODED PASSWORDS - 100% SECURE!
// ============================================
let currentUser = null;

// Check authentication state
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            showDashboard();
            loadProducts();
            loadSettings();
            loadPromos(); // Load Promos
            loadOrders(); // Load orders when admin logs in
        } else {
            // User is signed out
            currentUser = null;
            showLoginScreen();
        }
    });
}

// Logout
function logout() {
    auth.signOut().then(() => {
        console.log('Logged out successfully');
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Show/Hide screens
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
}

// Login form handler
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');

    // Show loading
    errorEl.textContent = 'جاري تسجيل الدخول...';
    errorEl.style.color = '#4facfe';

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            errorEl.textContent = '';
            document.getElementById('login-form').reset();
        })
        .catch((error) => {
            // Handle errors
            errorEl.style.color = '#f5576c';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorEl.textContent = 'البريد الإلكتروني غير صحيح';
                    break;
                case 'auth/user-not-found':
                    errorEl.textContent = 'المستخدم غير موجود';
                    break;
                case 'auth/wrong-password':
                    errorEl.textContent = 'كلمة المرور خاطئة';
                    break;
                case 'auth/invalid-credential':
                    errorEl.textContent = 'البريد الإلكتروني أو كلمة المرور خاطئة';
                    break;
                default:
                    errorEl.textContent = 'حدث خطأ: ' + error.message;
            }
        });
});

// Logout button
document.getElementById('logout-btn').addEventListener('click', logout);

// ============================================
// PRODUCT MANAGEMENT
// ============================================
let editingProductId = null;

// Load products from Firebase
function loadProducts() {
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = '<div class="loading">جاري تحميل المنتجات...</div>';

    productsRef.on('value', (snapshot) => {
        const products = snapshot.val();
        productsList.innerHTML = '';

        // Reset stats
        let totalStats = 0;
        let visibleStats = 0;
        let hiddenStats = 0;
        let totalValue = 0; // Track total value

        if (!products || Object.keys(products).length === 0) {
            productsList.innerHTML = `
                <div class="empty-state">
                    <p>لا توجد منتجات بعد</p>
                    <p>ابدأ بإضافة منتجك الأول!</p>
                </div>
            `;
            updateStats(0, 0, 0, 0);
            return;
        }

        Object.keys(products).forEach(id => {
            const product = products[id];

            // Count stats
            totalStats++;
            totalValue += parseFloat(product.price) || 0; // Add product price to total
            if (product.visible !== false) {
                visibleStats++;
            } else {
                hiddenStats++;
            }

            const card = createProductCard(id, product);
            productsList.appendChild(card);
        });

        // Update UI
        updateStats(totalStats, visibleStats, hiddenStats, totalValue);
    });
}

// Update stats UI
function updateStats(total, visible, hidden, value) {
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-visible').textContent = visible;
    document.getElementById('stat-hidden').textContent = hidden;
    document.getElementById('stat-value').innerHTML = `<span class="price-display" data-usd="${value.toFixed(2)}">$${value.toFixed(2)}</span>`;
}

// Create product card element
function createProductCard(id, product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    let badgeHtml = '';
    if (product.badge && product.badge !== 'none') {
        const badgeMap = {
            'new': 'جديد',
            'limited': 'عرض محدود',
            'hot': 'الأكثر مبيعاً'
        };
        badgeHtml = `<span class="product-badge badge-${product.badge}">${badgeMap[product.badge]}</span>`;
    }

    // Add Checkbox for Bulk Actions
    const checkboxHtml = `
        <div class="product-select-overlay" style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <input type="checkbox" class="bulk-check" value="${id}" data-type="products" style="width: 20px; height: 20px; cursor: pointer;">
        </div>
    `;

    const visibilityBtn = `
        <button class="btn btn-visibility ${product.visible === false ? 'btn-hidden' : ''}" onclick="toggleVisibility('${id}', ${product.visible !== false})">
            ${product.visible === false ? '👁️‍🗨️ مخفي' : '👁️ مرئي'}
        </button>
    `;

    // Stock status display
    let stockHtml = '';
    if (product.trackStock) {
        const stock = product.stock || 0;
        const threshold = product.lowStockThreshold || 5;
        let stockStatus = '';
        let stockColor = '';

        if (stock === 0) {
            stockStatus = 'نفذ المخزون';
            stockColor = '#f44336';
        } else if (stock <= threshold) {
            stockStatus = 'مخزون منخفض';
            stockColor = '#ff9800';
        } else {
            stockStatus = 'متوفر';
            stockColor = '#4caf50';
        }

        stockHtml = `
            <div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9rem;">📦 المخزون:</span>
                    <span style="font-weight: bold; color: ${stockColor};">${stock} قطعة</span>
                </div>
                <div style="font-size: 0.85rem; color: ${stockColor}; margin-top: 0.25rem;">
                    ${stockStatus}
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        ${checkboxHtml}
        <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        ${badgeHtml}
        <h3>${product.name}</h3>
        <p class="price">
            ${product.priceType === 'range'
            ? `<span class="price-display" data-usd="${product.priceMin}">$${product.priceMin}</span> - <span class="price-display" data-usd="${product.priceMax}">$${product.priceMax}</span>`
            : product.priceType === 'negotiable'
                ? '🤝 قابل للتفاوض'
                : product.priceType === 'contact'
                    ? '📞 تواصل للسعر'
                    : `<span class="price-display" data-usd="${product.price}">$${product.price}</span>`
        }
            ${product.category && product.category !== 'general' ? `<span style="font-size: 0.8em; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; margin-right: 5px;">${product.category}</span>` : ''}
        </p>
        ${stockHtml}
        <p class="description">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
        <div class="product-actions">
            <button class="btn btn-copy" onclick="copyProductLink('${id}')" title="نسخ الرابط">🔗</button>
            <button class="btn btn-secondary" onclick="showProductQR('${id}', '${product.name.replace(/'/g, "\\'")}')" title="عرض QR Code" style="padding: 0.5rem 1rem;">📱</button>
            ${visibilityBtn}
            <button class="btn btn-edit" onclick="editProduct('${id}')">تعديل</button>
            <button class="btn btn-delete" onclick="deleteProduct('${id}')">حذف</button>
        </div>
    `;

    if (product.visible === false) {
        card.classList.add('product-hidden');
    }

    return card;
}

// Image File Upload handling with Compression
document.getElementById('image-file').addEventListener('change', function (e) {
    handleImageUpload(e.target.files[0], 'product-image', 'image-file');
});

// Additional Images Handling with Compression
document.getElementById('additional-images-file').addEventListener('change', function (e) {
    const files = Array.from(e.target.files);

    if (currentAdditionalImages.length + files.length > 5) {
        showNotification('لا يمكن إضافة أكثر من 5 صور إضافية.', 'error');
        this.value = '';
        return;
    }

    files.forEach(file => {
        handleImageUpload(file, null, null, true);
    });

    this.value = '';
});

// Generic Image Handler
function handleImageUpload(file, inputId, fileInputId, isAdditional = false) {
    if (!file) return;

    // Check file type
    if (!file.type.match('image.*')) {
        showNotification('يرجى اختيار ملف صورة صالح', 'error');
        return;
    }

    // Allow up to 10MB input, but we will compress it down
    if (file.size > 10 * 1024 * 1024) {
        showNotification('حجم الصورة كبير جداً (الحد الأقصى 10 ميجابايت)', 'error');
        if (fileInputId) document.getElementById(fileInputId).value = '';
        return;
    }

    showNotification('جاري معالجة الصورة...', 'success');

    compressImage(file, 800, 0.7).then(base64String => {
        if (isAdditional) {
            currentAdditionalImages.push(base64String);
            renderAdditionalImages();
        } else {
            document.getElementById(inputId).value = base64String;

            // Show preview
            const container = document.getElementById(fileInputId).parentNode;
            const existingPreview = container.querySelector('.image-preview-feedback');
            if (existingPreview) existingPreview.remove();

            const preview = document.createElement('div');
            preview.className = 'image-preview-feedback';
            preview.innerHTML = `
                <div style="margin-top: 10px; position: relative; width: 100px; height: 100px; border-radius: 8px; border: 2px solid #00b894;">
                    <img src="${base64String}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" alt="Preview">
                    <button type="button" class="btn-remove-image" title="إزالة الصورة">✕</button>
                </div>
                <span style="display: block; color: #00b894; font-size: 0.85rem; margin-top: 5px;">✅ تم ضغط واختيار الصورة</span>
            `;
            container.appendChild(preview);

            preview.querySelector('.btn-remove-image').addEventListener('click', function () {
                document.getElementById(fileInputId).value = '';
                document.getElementById(inputId).value = '';
                preview.remove();
            });
        }
    }).catch(err => {
        console.error('Compression error:', err);
        showNotification('فشل معالجة الصورة. حاول بملف آخر.', 'error');
    });
}

// Image Compression Utility
function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG (even if input was PNG/HEIC) to save space
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

// Additional Images Handling
let currentAdditionalImages = [];

document.getElementById('additional-images-file').addEventListener('change', function (e) {
    const files = Array.from(e.target.files);

    // Check limits
    if (currentAdditionalImages.length + files.length > 5) {
        showNotification('لا يمكن إضافة أكثر من 5 صور إضافية.', 'error');
        this.value = '';
        return;
    }

    files.forEach(file => {
        if (file.size > 1024 * 1024) {
            showNotification(`حجم الملف ${file.name} كبير جداً (يجب أن يكون أقل من 1 ميجابايت).`, 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            currentAdditionalImages.push(e.target.result);
            renderAdditionalImages();
        };
        reader.readAsDataURL(file);
    });

    // Clear input so same files can be selected again if needed (though we handle duplicates via array)
    this.value = '';
});

function renderAdditionalImages() {
    const container = document.getElementById('additional-images-preview');
    container.innerHTML = '';

    currentAdditionalImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.width = '80px';
        div.style.height = '80px';

        div.innerHTML = `
            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);">
            <button type="button" onclick="removeAdditionalImage(${index})" style="
                position: absolute; top: -5px; right: -5px; 
                background: #f44336; color: white; border: none; 
                border-radius: 50%; width: 20px; height: 20px; 
                display: flex; align-items: center; justify-content: center; 
                cursor: pointer; font-size: 12px;
            ">✕</button>
        `;
        container.appendChild(div);
    });
}

window.removeAdditionalImage = function (index) {
    currentAdditionalImages.splice(index, 1);
    renderAdditionalImages();
};

// Toggle stock fields visibility
document.getElementById('track-stock').addEventListener('change', function () {
    const stockFields = document.getElementById('stock-fields');
    stockFields.style.display = this.checked ? 'flex' : 'none';
});

// Add/Update product
document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const trackStock = document.getElementById('track-stock').checked;

    const priceType = document.getElementById('price-type').value;
    const productData = {
        name: document.getElementById('product-name').value,
        priceType: priceType,
        price: priceType === 'fixed' ? parseFloat(document.getElementById('product-price').value) || 0 : 0,
        priceMin: priceType === 'range' ? parseFloat(document.getElementById('price-min').value) || 0 : null,
        priceMax: priceType === 'range' ? parseFloat(document.getElementById('price-max').value) || 0 : null,
        shortDesc: document.getElementById('product-short-desc').value,
        description: document.getElementById('product-description').value,
        badge: document.getElementById('product-badge').value,
        category: document.getElementById('product-category').value,
        image: document.getElementById('product-image').value,
        features: parseFeatures(document.getElementById('product-features').value),
        metaDesc: document.getElementById('product-meta-desc').value,
        visible: true, // Default to visible
        timestamp: Date.now(),
        // Stock Management
        trackStock: trackStock,
        stock: trackStock ? parseInt(document.getElementById('product-stock').value) || 0 : null,
        lowStockThreshold: trackStock ? parseInt(document.getElementById('low-stock-threshold').value) || 5 : null,
        // Gallery
        additionalImages: currentAdditionalImages
    };

    // Preserve visibility status if editing
    if (editingProductId) {
        delete productData.visible;
    }

    // Validate image presence
    if (!productData.image) {
        showNotification('يرجى إضافة رابط صورة أو اختيار صورة من جهازك', 'error');
        return;
    }

    if (editingProductId) {
        // Update existing product
        productsRef.child(editingProductId).update(productData)
            .then(() => {
                showNotification('تم تحديث المنتج بنجاح! ✅');
                if (window.adminLog) window.adminLog.productEdited(productData.name);
                resetForm();
            })
            .catch((error) => {
                showNotification('حدث خطأ: ' + error.message, 'error');
            });
    } else {
        // Add new product
        productsRef.push(productData)
            .then(() => {
                showNotification('تم إضافة المنتج بنجاح! 🎉');
                if (window.adminLog) window.adminLog.productAdded(productData.name);
                resetForm();
            })
            .catch((error) => {
                showNotification('حدث خطأ: ' + error.message, 'error');
            });
    }
});

// Parse features from textarea
function parseFeatures(featuresText) {
    if (!featuresText.trim()) return [];

    const lines = featuresText.split('\n');
    return lines.map(line => {
        const parts = line.split('|');
        if (parts.length === 3) {
            return {
                icon: parts[0].trim(),
                title: parts[1].trim(),
                description: parts[2].trim()
            };
        }
        return null;
    }).filter(f => f !== null);
}

// Format features for editing
function formatFeatures(features) {
    if (!features || features.length === 0) return '';
    return features.map(f => `${f.icon}|${f.title}|${f.description}`).join('\n');
}

// Edit product
window.editProduct = function (id) {
    // Switch to Products tab first
    switchTab('products');

    productsRef.child(id).once('value', (snapshot) => {
        const product = snapshot.val();

        document.getElementById('product-id').value = id;
        document.getElementById('product-name').value = product.name;
        // Load price type
        const pt = product.priceType || 'fixed';
        document.getElementById('price-type').value = pt;
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('price-min').value = product.priceMin || '';
        document.getElementById('price-max').value = product.priceMax || '';
        togglePriceFields();
        document.getElementById('product-short-desc').value = product.shortDesc || '';
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-badge').value = product.badge;
        document.getElementById('product-category').value = product.category || 'general'; // Load Category
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-features').value = formatFeatures(product.features);
        document.getElementById('product-meta-desc').value = product.metaDesc || '';
        if (document.getElementById('meta-desc-count')) document.getElementById('meta-desc-count').textContent = (product.metaDesc || '').length + ' / 160';


        // Load stock data
        const trackStockCheckbox = document.getElementById('track-stock');
        trackStockCheckbox.checked = product.trackStock || false;
        if (product.trackStock) {
            document.getElementById('stock-fields').style.display = 'flex';
            document.getElementById('product-stock').value = product.stock || 0;
            document.getElementById('low-stock-threshold').value = product.lowStockThreshold || 5;
        } else {
            document.getElementById('stock-fields').style.display = 'none';
        }

        // Load Gallery
        if (product.additionalImages) {
            currentAdditionalImages = product.additionalImages;
            renderAdditionalImages();
        } else {
            currentAdditionalImages = [];
            renderAdditionalImages();
        }

        editingProductId = id;
        document.getElementById('form-title').textContent = 'تعديل المنتج';
        document.getElementById('submit-btn').textContent = 'تحديث المنتج';
        document.getElementById('cancel-btn').style.display = 'inline-block';

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

// Toggle product visibility
window.toggleVisibility = function (id, currentStatus) {
    const newStatus = !currentStatus;
    productsRef.child(id).update({ visible: newStatus })
        .then(() => {
            showNotification(newStatus ? 'المنتج الآن مرئي 👁️' : 'تم إخفاء المنتج 👁️‍🗨️');
            if (window.adminLog) window.adminLog.productVisibility(id.slice(-6), newStatus);
        })
        .catch((error) => {
            showNotification('حدث خطأ: ' + error.message, 'error');
        });
};

// Delete product
window.deleteProduct = function (id) {
    showConfirmModal(
        'حذف المنتج',
        'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن استعادته.',
        () => {
            productsRef.child(id).remove()
                .then(() => {
                    showNotification('تم حذف المنتج بنجاح! 🗑️');
                    if (window.adminLog) window.adminLog.productDeleted(id.slice(-6));
                })
                .catch((error) => {
                    showNotification('حدث خطأ: ' + error.message, 'error');
                });
        }
    );
};

// Reset form
function resetForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    if (document.getElementById('meta-desc-count')) document.getElementById('meta-desc-count').textContent = '0 / 160';


    // Clear custom file input
    document.getElementById('image-file').value = '';
    const existingPreview = document.querySelector('.image-preview-feedback');
    if (existingPreview) existingPreview.remove();

    // Clear Gallery
    currentAdditionalImages = [];
    renderAdditionalImages();
    document.getElementById('additional-images-file').value = '';

    editingProductId = null;
    document.getElementById('form-title').textContent = 'إضافة منتج جديد';
    document.getElementById('submit-btn').textContent = 'إضافة المنتج';
    document.getElementById('cancel-btn').style.display = 'none';
}

// Cancel edit
document.getElementById('cancel-btn').addEventListener('click', resetForm);

// Show Notification (Toast)
window.showNotification = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = type === 'success' ? '✅' : '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
};

// Copy Product Link
function copyProductLink(id) {
    const link = `${window.location.origin}/index.html?product=${id}`;
    navigator.clipboard.writeText(link).then(() => {
        showNotification('تم نسخ الرابط! 🔗');
    });
}

// Show Product QR Code
function showProductQR(id, name) {
    const link = `${window.location.origin}/index.html?product=${id}`;

    // Create Modal Content
    const content = `
        <div style="text-align: center; padding: 1rem;">
            <h3 style="margin-bottom: 1rem; color: #667eea;">${name}</h3>
            <div id="qrcode-container" style="background: white; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 1rem;"></div>
            <p style="font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 1.5rem; word-break: break-all;">${link}</p>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="downloadQR('${name}')" class="btn btn-primary">💾 تحميل صورة QR</button>
                <button onclick="window.print()" class="btn btn-secondary">🖨️ طباعة</button>
            </div>
        </div>
    `;

    showCustomModal(content);

    // Generate QR (Wait for modal to render)
    setTimeout(() => {
        const container = document.getElementById('qrcode-container');
        if (container) {
            container.innerHTML = ''; // Clear previous
            new QRCode(container, {
                text: link,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
}

// Download QR Image
window.downloadQR = function (name) {
    const container = document.getElementById('qrcode-container');
    const img = container.querySelector('img');
    if (img) {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `${name}-QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Copy Product Link
window.copyProductLink = function (id) {
    // Using simple query parameter for product deep linking
    // We hardcode the domain as per user request to avoid subpath issues
    const link = `https://www.zeronux.store/index.html?product=${id}`;

    navigator.clipboard.writeText(link).then(() => {
        showNotification('تم نسخ رابط المنتج! 🔗');
    }).catch(err => {
        showNotification('فشل نسخ الرابط', 'error');
    });
};

// ============================================
// STUDENT BOOKS AND BOOK REQUESTS MANAGEMENT REMOVED

// ============================================
// INITIALIZATION
// ============================================
// Maintenance Mode Toggle Handlers
document.getElementById('maintenance-enabled').addEventListener('change', function () {
    const maintenanceFields = document.getElementById('maintenance-fields');
    maintenanceFields.style.display = this.checked ? 'flex' : 'none';
    if (!this.checked) {
        document.getElementById('custom-message-field').style.display = 'none';
    } else {
        // Show custom field if preset is custom
        const preset = document.getElementById('maintenance-preset').value;
        if (preset === 'custom') {
            document.getElementById('custom-message-field').style.display = 'block';
        }
    }
});

document.getElementById('maintenance-preset').addEventListener('change', function () {
    const customField = document.getElementById('custom-message-field');
    customField.style.display = this.value === 'custom' ? 'block' : 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    checkAuthState();
});
