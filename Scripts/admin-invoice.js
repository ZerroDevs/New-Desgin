// ============================================
// ADMIN INVOICE GENERATOR — Print-ready invoices
// ============================================
(function () {
    'use strict';

    // ---- Generate Invoice ----
    window.generateInvoice = function (orderId) {
        const db = firebase.database();

        // Fetch order + settings in parallel
        Promise.all([
            db.ref('orders/' + orderId).once('value'),
            db.ref('settings').once('value')
        ]).then(([orderSnap, settingsSnap]) => {
            const order = orderSnap.val();
            const settings = settingsSnap.val() || {};

            if (!order) {
                if (typeof showNotification === 'function') {
                    showNotification('الطلب غير موجود', 'error');
                }
                return;
            }

            openInvoiceWindow(order, orderId, settings);
        }).catch(err => {
            console.error('Invoice generation error:', err);
            if (typeof showNotification === 'function') {
                showNotification('خطأ في إنشاء الفاتورة', 'error');
            }
        });
    };

    function openInvoiceWindow(order, orderId, settings) {
        const date = new Date(order.timestamp);
        const formattedDate = date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('ar-EG', {
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

        const currencySymbol = order.currency === 'LYD' ? 'د.ل' : '$';

        // Build items rows
        let itemsRows = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach((item, idx) => {
                const qty = item.quantity || 1;
                const unitPrice = parseFloat(item.price) / qty || parseFloat(item.price);
                const lineTotal = parseFloat(item.price);

                itemsRows += `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${item.name}</td>
                        <td>${qty}</td>
                        <td>${formatPrice(unitPrice, currencySymbol)}</td>
                        <td>${formatPrice(lineTotal, currencySymbol)}</td>
                    </tr>
                `;
            });
        }

        // Discount row
        let discountRow = '';
        if (order.discount) {
            discountRow = `
                <tr class="discount-row">
                    <td colspan="4">خصم (${order.discount.code}) — ${order.discount.value}%</td>
                    <td>-${formatPrice(order.total - order.finalTotal, currencySymbol)}</td>
                </tr>
            `;
        }

        // Store info
        const storeName = settings.heroTitle || 'متجر زيرونكس';
        const storePhone = settings.phoneNumber || '';
        const storeEmail = settings.contactEmail || '';
        const storeLogo = 'https://assets.zeronux.store/Logo.png';

        const invoiceHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة #${order.orderId || orderId.slice(-6)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Cairo', sans-serif;
            background: #f8f9fa;
            color: #1a1a2e;
            padding: 0;
            direction: rtl;
        }
        .invoice-page {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            overflow: hidden;
        }

        /* Header */
        .invoice-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 2.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .store-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .store-logo {
            width: 60px;
            height: 60px;
            border-radius: 14px;
            background: rgba(255,255,255,0.2);
            padding: 6px;
            object-fit: contain;
        }
        .store-name {
            font-size: 1.6rem;
            font-weight: 700;
        }
        .store-contact {
            font-size: 0.8rem;
            opacity: 0.85;
            margin-top: 2px;
        }
        .invoice-label {
            text-align: left;
        }
        .invoice-label h2 {
            font-size: 1.4rem;
            font-weight: 700;
            letter-spacing: 1px;
        }
        .invoice-label .invoice-number {
            font-size: 0.85rem;
            opacity: 0.9;
            margin-top: 4px;
        }

        /* Meta Info */
        .invoice-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            padding: 1.5rem 2.5rem;
            background: #f0f2ff;
            border-bottom: 1px solid #e8e8f0;
        }
        .meta-card {
            background: white;
            padding: 1rem 1.2rem;
            border-radius: 10px;
            border: 1px solid #e8e8f0;
        }
        .meta-card .meta-label {
            font-size: 0.75rem;
            color: #888;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .meta-card .meta-value {
            font-size: 0.95rem;
            font-weight: 600;
            color: #1a1a2e;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .status-pending { background: rgba(255,193,7,0.15); color: #e6a700; }
        .status-processing { background: rgba(33,150,243,0.15); color: #1976d2; }
        .status-shipped { background: rgba(0,188,212,0.15); color: #00838f; }
        .status-completed { background: rgba(76,175,80,0.15); color: #2e7d32; }
        .status-cancelled { background: rgba(244,67,54,0.15); color: #c62828; }

        /* Items Table */
        .invoice-body {
            padding: 1.5rem 2.5rem 2rem;
        }
        .section-title {
            font-size: 1rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 0.8rem;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
        }
        .items-table thead th {
            background: #f0f2ff;
            color: #555;
            font-weight: 600;
            font-size: 0.8rem;
            padding: 10px 14px;
            text-align: right;
            border-bottom: 2px solid #e0e0f0;
        }
        .items-table tbody td {
            padding: 12px 14px;
            border-bottom: 1px solid #f0f0f5;
            font-size: 0.9rem;
            color: #333;
        }
        .items-table tbody tr:last-child td {
            border-bottom: 2px solid #e0e0f0;
        }
        .items-table tbody tr:hover {
            background: #fafafe;
        }
        .discount-row td {
            color: #4caf50;
            font-weight: 600;
        }

        /* Totals */
        .totals-section {
            display: flex;
            justify-content: flex-start;
            margin-top: 0.5rem;
        }
        .totals-table {
            width: 280px;
        }
        .totals-table .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 0.9rem;
            color: #555;
        }
        .totals-table .total-row.final {
            border-top: 2px solid #667eea;
            margin-top: 6px;
            padding-top: 12px;
            font-size: 1.15rem;
            font-weight: 700;
            color: #1a1a2e;
        }

        /* Footer */
        .invoice-footer {
            background: #f8f9fa;
            padding: 1.5rem 2.5rem;
            text-align: center;
            border-top: 1px solid #e8e8f0;
        }
        .footer-thanks {
            font-size: 1rem;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 6px;
        }
        .footer-contact {
            font-size: 0.8rem;
            color: #999;
        }

        /* Print Actions */
        .print-actions {
            text-align: center;
            padding: 1.5rem;
            background: #f8f9fa;
        }
        .print-btn {
            padding: 12px 36px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-family: 'Cairo', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102,126,234,0.4);
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .invoice-page {
                margin: 0;
                box-shadow: none;
                border-radius: 0;
            }
            .print-actions {
                display: none !important;
            }
            .invoice-header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .invoice-meta {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .items-table thead th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .status-badge {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="print-actions">
        <button class="print-btn" onclick="window.print()">🖨️ طباعة الفاتورة</button>
    </div>

    <div class="invoice-page">
        <!-- Header -->
        <div class="invoice-header">
            <div class="store-info">
                <img src="${storeLogo}" class="store-logo" alt="Logo">
                <div>
                    <div class="store-name">${storeName}</div>
                    <div class="store-contact">${storePhone}${storeEmail ? ' • ' + storeEmail : ''}</div>
                </div>
            </div>
            <div class="invoice-label">
                <h2>فاتورة</h2>
                <div class="invoice-number">#${order.orderId || orderId.slice(-6)}</div>
            </div>
        </div>

        <!-- Meta -->
        <div class="invoice-meta">
            <div class="meta-card">
                <div class="meta-label">📅 التاريخ</div>
                <div class="meta-value">${formattedDate}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">🕐 الوقت</div>
                <div class="meta-value">${formattedTime}</div>
            </div>
            <div class="meta-card">
                <div class="meta-label">📋 الحالة</div>
                <div class="meta-value"><span class="status-badge status-${order.status}">${statusText[order.status] || order.status}</span></div>
            </div>
            <div class="meta-card">
                <div class="meta-label">📞 العميل</div>
                <div class="meta-value">${order.customerPhone || 'غير محدد'}</div>
            </div>
        </div>

        <!-- Body -->
        <div class="invoice-body">
            <div class="section-title">📦 تفاصيل المنتجات</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>سعر الوحدة</th>
                        <th>المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                    ${discountRow}
                </tbody>
            </table>

            <div class="totals-section">
                <div class="totals-table">
                    <div class="total-row">
                        <span>المجموع الفرعي:</span>
                        <span>${formatPrice(order.total, currencySymbol)}</span>
                    </div>
                    ${order.discount ? `
                    <div class="total-row" style="color: #4caf50;">
                        <span>الخصم (${order.discount.value}%):</span>
                        <span>-${formatPrice(order.total - order.finalTotal, currencySymbol)}</span>
                    </div>
                    ` : ''}
                    <div class="total-row final">
                        <span>المجموع النهائي:</span>
                        <span>${formatPrice(order.finalTotal, currencySymbol)}</span>
                    </div>
                </div>
            </div>
        </div>


        <!-- QR Code -->
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/track-order.html?id=${order.orderId || orderId}`)}" alt="QR Code" style="width: 100px; height: 100px; padding: 5px; border: 1px solid #eee; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #888; margin-top: 5px;">امسح الكود لتتبع طلبك</div>
        </div>

        <!-- Footer -->
        <div class="invoice-footer">
            <div class="footer-thanks">شكراً لتسوقك معنا! 💜</div>
            <div class="footer-contact">${storeName}${storePhone ? ' • ' + storePhone : ''}${storeEmail ? ' • ' + storeEmail : ''}</div>
        </div>
    </div>
</body>
</html>
        `;

        // Open in new tab
        const invoiceWindow = window.open('', '_blank');
        if (invoiceWindow) {
            invoiceWindow.document.write(invoiceHtml);
            invoiceWindow.document.close();
        } else {
            if (typeof showAlertModal === 'function') {
                showAlertModal('تنبيه', 'يرجى السماح بالنوافذ المنبثقة لعرض الفاتورة.', 'warning');
            }
        }
    }

    function formatPrice(amount, symbol) {
        const val = parseFloat(amount).toFixed(2);
        if (symbol === '$') {
            return `$${val}`;
        }
        return `${val} ${symbol}`;
    }

})();
