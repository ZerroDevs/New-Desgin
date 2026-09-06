document.addEventListener('DOMContentLoaded', () => {

    // Auth Listener
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            loadUserOrders(user.uid);
        } else {
            // Redirect to login if not logged in
            // localStorage.setItem('redirectAfterLogin', 'uorder.html');
            // window.location.href = 'login.html';

            // Or show empty state asking to login
            document.getElementById('orders-list').innerHTML = `
                <div class="empty-orders">
                    <div class="empty-icon">🔒</div>
                    <h3>يرجى تسجيل الدخول</h3>
                    <p>يجب عليك تسجيل الدخول لعرض سجل طلباتك.</p>
                    <a href="login.html" class="btn btn-primary" style="margin-top: 20px; display: inline-block;">تسجيل الدخول</a>
                </div>
            `;
        }
    });

});

function loadUserOrders(userId) {
    const ordersList = document.getElementById('orders-list');
    const db = firebase.database();

    // Query orders by userId
    // Note: Requires .indexOn: ["userId"] in firebase rules
    db.ref('orders').orderByChild('userId').equalTo(userId).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                renderEmptyState();
                return;
            }

            const orders = [];
            snapshot.forEach(child => {
                orders.push(child.val());
            });

            // Sort by date desc (newest first)
            orders.sort((a, b) => b.timestamp - a.timestamp);

            renderOrders(orders);
        })
        .catch(error => {
            console.error("Error loading orders:", error);
            ordersList.innerHTML = `<p style="text-align:center; color: #ff7675;">حدث خطأ أثناء تحميل الطلبات.</p>`;
        });
}

function renderEmptyState() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = `
        <div class="empty-orders">
            <div class="empty-icon">📦</div>
            <h3>لا توجد طلبات بعد</h3>
            <p>لم تقم بإجراء أي عمليات شراء حتى الآن.</p>
            <a href="index.html" class="btn btn-primary" style="margin-top: 20px; display: inline-block;">تصفح المنتجات</a>
        </div>
    `;
}

function renderOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    orders.forEach(order => {
        const date = new Date(order.timestamp).toLocaleDateString('ar-EG', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        // Map status to readable text
        const statusMap = {
            'pending': { text: 'قيد المراجعة', class: 'status-pending' },
            'completed': { text: 'مكتمل', class: 'status-completed' },
            'cancelled': { text: 'ملغي', class: 'status-cancelled' },
            'processing': { text: 'جاري التجهيز', class: 'status-processing' }
        };
        const statusInfo = statusMap[order.status] || { text: order.status, class: 'status-pending' };

        // Items HTML
        let itemsHtml = '';
        order.items.forEach(item => {
            const price = formatPrice(item.price, order.currency);
            itemsHtml += `
                <div class="order-item">
                    <img src="${item.image || 'https://via.placeholder.com/60'}" class="item-image" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <div class="item-meta">
                            الكمية: ${item.quantity} | السعر: ${price}
                        </div>
                    </div>
                </div>
            `;
        });

        const totalFormatted = formatPrice(order.finalTotal || order.total, order.currency);

        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-id">#${order.orderId}</div>
                    <div class="order-date">${date}</div>
                </div>
                <div class="order-status ${statusInfo.class}">
                    ${statusInfo.text}
                </div>
            </div>

            <div class="order-items">
                ${itemsHtml}
            </div>

            <div class="order-footer">
                <div class="order-total">
                    المجموع: <span style="color: var(--accent-color);">${totalFormatted}</span>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="action-btn btn-invoice" onclick="generateInvoice('${order.orderId}')">
                        <i class="fas fa-file-invoice"></i> الفاتورة
                    </button>
                    ${order.status !== 'completed' && order.status !== 'cancelled' ? `
                    <a href="track-order.html?id=${order.orderId}" class="action-btn btn-track">
                        <i class="fas fa-shipping-fast"></i> تتبع الطلب
                    </a>
                    ` : ''}
                </div>
            </div>
        `;

        ordersList.appendChild(card);
    });
}

function formatPrice(amount, currency) {
    if (currency === 'LYD') return `${parseFloat(amount).toFixed(2)} د.ل`;
    return `$${parseFloat(amount).toFixed(2)}`;
}
