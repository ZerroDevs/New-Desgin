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
        const storeName = settings.storeName || settings.heroTitle || 'New Desgin';
        const storePhone = settings.phoneNumber || '+218 91 6808225';
        const storeEmail = settings.contactEmail || '';
        const storeLogo = 'Images/Logo-noBG.png';

        const invoiceHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة طلب #${order.orderId || orderId.slice(-6)} - New Desgin</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Cairo', 'Outfit', sans-serif;
            background: #f1f5f9;
            color: #0f172a;
            padding: 20px;
            direction: rtl;
        }
        .invoice-page {
            max-width: 820px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }

        /* Header */
        .invoice-header {
            background: linear-gradient(135deg, #070b14 0%, #0f172a 40%, #0284c7 100%);
            color: white;
            padding: 2.2rem 2.8rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
        }
        .invoice-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc);
        }
        .store-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .store-logo {
            height: 60px;
            width: auto;
            object-fit: contain;
            filter: drop-shadow(0 4px 10px rgba(56, 189, 248, 0.4));
        }
        .store-name {
            font-size: 1.6rem;
            font-weight: 800;
            font-family: 'Outfit', 'Cairo', sans-serif;
            letter-spacing: 0.5px;
            background: linear-gradient(135deg, #ffffff 0%, #7dd3fc 60%, #38bdf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .store-contact {
            font-size: 0.85rem;
            color: #cbd5e1;
            margin-top: 3px;
        }
        .invoice-label {
            text-align: left;
        }
        .invoice-label h2 {
            font-size: 1.5rem;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 1px;
        }
        .invoice-label .invoice-number {
            font-size: 0.95rem;
            color: #38bdf8;
            font-weight: 700;
            font-family: 'Outfit', monospace;
            margin-top: 4px;
        }

        /* Meta Info */
        .invoice-meta {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            padding: 1.5rem 2.5rem;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }
        .meta-card {
            background: white;
            padding: 0.9rem 1.1rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        .meta-card .meta-label {
            font-size: 0.75rem;
            color: #64748b;
            margin-bottom: 4px;
            font-weight: 600;
        }
        .meta-card .meta-value {
            font-size: 0.92rem;
            font-weight: 700;
            color: #0f172a;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.78rem;
            font-weight: 700;
        }
        .status-pending { background: rgba(245,158,11,0.15); color: #d97706; }
        .status-processing { background: rgba(14,165,233,0.15); color: #0284c7; }
        .status-shipped { background: rgba(56,189,248,0.15); color: #0369a1; }
        .status-completed { background: rgba(16,185,129,0.15); color: #059669; }
        .status-cancelled { background: rgba(239,68,68,0.15); color: #dc2626; }

        /* Items Table */
        .invoice-body {
            padding: 1.8rem 2.5rem 2rem;
        }
        .section-title {
            font-size: 1.05rem;
            font-weight: 700;
            color: #0284c7;
            margin-bottom: 1rem;
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
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            font-size: 0.85rem;
            padding: 12px 16px;
            text-align: right;
            border-bottom: 2px solid #cbd5e1;
        }
        .items-table tbody td {
            padding: 13px 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.92rem;
            color: #1e293b;
        }
        .items-table tbody tr:last-child td {
            border-bottom: 2px solid #cbd5e1;
        }
        .items-table tbody tr:hover {
            background: #f8fafc;
        }
        .discount-row td {
            color: #059669;
            font-weight: 700;
            background: #ecfdf5;
        }

        /* Totals */
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;
        }
        .totals-table {
            width: 320px;
            background: #f8fafc;
            padding: 1rem 1.4rem;
            border-radius: 14px;
            border: 1px solid #e2e8f0;
        }
        .totals-table .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 0.92rem;
            color: #475569;
        }
        .totals-table .total-row.final {
            border-top: 2px solid #0ea5e9;
            margin-top: 8px;
            padding-top: 10px;
            font-size: 1.25rem;
            font-weight: 800;
            color: #0f172a;
        }
        .totals-table .total-row.final span:last-child {
            color: #0284c7;
        }

        /* Footer */
        .invoice-footer {
            background: #f8fafc;
            padding: 1.6rem 2.5rem;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-thanks {
            font-size: 1.05rem;
            font-weight: 700;
            color: #0284c7;
            margin-bottom: 4px;
        }
        .footer-contact {
            font-size: 0.85rem;
            color: #64748b;
        }

        /* Print Actions */
        .print-actions {
            text-align: center;
            padding: 1.2rem;
            margin-bottom: 10px;
        }
        .print-btn {
            padding: 12px 36px;
            background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
            color: white;
            border: none;
            border-radius: 50px;
            font-family: 'Cairo', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(14, 165, 233, 0.35);
        }
        .print-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(56, 189, 248, 0.55);
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
                border: none;
                max-width: 100%;
            }
            .print-actions {
                display: none !important;
            }
            .invoice-header, .invoice-meta, .items-table thead th, .status-badge {
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
                <img src="${storeLogo}" class="store-logo" alt="New Desgin" onerror="this.style.display='none'">
                <div>
                    <div class="store-name">${storeName}</div>
                    <div class="store-contact">${storePhone}${storeEmail ? ' • ' + storeEmail : ''}</div>
                </div>
            </div>
            <div class="invoice-label">
                <h2>فاتورة مبيعات</h2>
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
            <div class="section-title">📦 تفاصيل المنتجات والطلبية</div>
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
                    <div class="total-row" style="color: #059669; font-weight: 600;">
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
        <div style="text-align: center; margin: 1rem 0 1.5rem;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/track-order.html?id=${order.orderId || orderId}`)}" alt="QR Code" style="width: 90px; height: 90px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">امسح الكود لتتبع حالة شحنتك فوراً</div>
        </div>

        <!-- Footer -->
        <div class="invoice-footer">
            <div class="footer-thanks">شكراً لثقتك واختيارك New Desgin ✨</div>
            <div class="footer-contact">${storeName} • أرقى تشكيلات الملابس والعطور الفاخرة</div>
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
