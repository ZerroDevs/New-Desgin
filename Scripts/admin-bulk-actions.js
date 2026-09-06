// ============================================
// ADMIN BULK ACTIONS
// ============================================

let selectedItems = new Set();
let currentSelectionType = null; // 'products' or 'orders'

document.addEventListener('DOMContentLoaded', () => {
    initializeBulkActions();
});

function initializeBulkActions() {
    // Event delegation for checkboxes (since items are dynamic)
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('bulk-check')) {
            handleCheckboxChange(e.target);
        }
        if (e.target.id === 'select-all-products') {
            toggleSelectAll('products', e.target.checked);
        }
        if (e.target.id === 'select-all-orders') {
            toggleSelectAll('orders', e.target.checked);
        }
    });

    // Render Toolbar (initially hidden)
    renderBulkToolbar();
}

function handleCheckboxChange(checkbox) {
    const type = checkbox.dataset.type;
    const id = checkbox.value;

    // If switching types, clear previous selection
    if (currentSelectionType && currentSelectionType !== type) {
        selectedItems.clear();
        document.querySelectorAll(`.bulk-check[data-type="${currentSelectionType}"]`).forEach(cb => cb.checked = false);
        // Uncheck previous master checkbox
        const prevMaster = document.getElementById(`select-all-${currentSelectionType}`);
        if (prevMaster) prevMaster.checked = false;
    }

    currentSelectionType = type;

    if (checkbox.checked) {
        selectedItems.add(id);
    } else {
        selectedItems.delete(id);
    }

    updateToolbar();
}

function toggleSelectAll(type, isChecked) {
    currentSelectionType = type;
    const checkboxes = document.querySelectorAll(`.bulk-check[data-type="${type}"]`);

    selectedItems.clear();
    checkboxes.forEach(cb => {
        // Only select visible items
        if (cb.closest('tr') && cb.closest('tr').style.display === 'none') return;
        if (cb.closest('.product-card') && cb.closest('.product-card').style.display === 'none') return;

        cb.checked = isChecked;
        if (isChecked) {
            selectedItems.add(cb.value);
        }
    });

    // If unchecked, we might want to clear the type if nothing else is selected, 
    // but keeping it simple is fine.
    if (!isChecked) selectedItems.clear();

    updateToolbar();
}

function updateToolbar() {
    const toolbar = document.getElementById('bulk-actions-toolbar');
    const countEl = document.getElementById('selected-count');

    if (selectedItems.size > 0) {
        toolbar.classList.add('visible');
        countEl.textContent = `${selectedItems.size} عنصر محدد`;

        // Show/Hide appropriate actions
        document.getElementById('cal-products-actions').style.display = currentSelectionType === 'products' ? 'flex' : 'none';
        document.getElementById('cal-orders-actions').style.display = currentSelectionType === 'orders' ? 'flex' : 'none';
    } else {
        toolbar.classList.remove('visible');
        currentSelectionType = null;
    }
}

function renderBulkToolbar() {
    if (document.getElementById('bulk-actions-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'bulk-actions-toolbar';
    toolbar.className = 'bulk-toolbar';
    toolbar.innerHTML = `
        <div class="toolbar-content">
            <div class="selection-info">
                <span id="selected-count">0 عنصر محدد</span>
                <button class="btn-clear" onclick="clearSelection()">إلغاء التحديد</button>
            </div>
            
            <div id="cal-products-actions" class="actions-group" style="display:none;">
                <button class="btn btn-sm btn-secondary" onclick="bulkToggleVisibility(true)">👁️ إظهار</button>
                <button class="btn btn-sm btn-secondary" onclick="bulkToggleVisibility(false)">👁️‍🗨️ إخفاء</button>
                <button class="btn btn-sm btn-primary" onclick="openBulkPriceModal()">💰 تعديل السعر</button>
                <button class="btn btn-sm btn-danger" onclick="bulkDelete('products')">🗑️ حذف</button>
            </div>

            <div id="cal-orders-actions" class="actions-group" style="display:none;">
                <select id="bulk-order-status" onchange="bulkUpdateStatus(this.value)" class="status-select-bulk">
                    <option value="">تغيير الحالة...</option>
                    <option value="pending">قيد الانتظار</option>
                    <option value="processing">قيد التنفيذ</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="completed">مكتملة</option>
                    <option value="cancelled">ملغاة</option>
                </select>
                <button class="btn btn-sm btn-danger" onclick="bulkDelete('orders')">🗑️ حذف</button>
            </div>
        </div>
    `;
    document.body.appendChild(toolbar);

    // CSS for Toolbar
    const style = document.createElement('style');
    style.innerHTML = `
        .bulk-toolbar {
            position: fixed;
            bottom: -300px;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a2e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1rem 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 1000;
            transition: bottom 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s, visibility 0.3s;
            width: 90%;
            max-width: 800px;
            direction: rtl;
            opacity: 0;
            visibility: hidden;
        }
        .bulk-toolbar.visible {
            bottom: 20px;
            opacity: 1;
            visibility: visible;
        }
        .toolbar-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        .selection-info {
            display: flex;
            align-items: center;
            gap: 15px;
            color: white;
            font-weight: bold;
        }
        .btn-clear {
            background: none;
            border: none;
            color: #f5576c;
            cursor: pointer;
            text-decoration: underline;
            padding: 0;
        }
        .actions-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .btn-sm {
            padding: 0.4rem 1rem;
            font-size: 0.9rem;
        }
        .status-select-bulk {
            padding: 0.4rem;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            border-radius: 6px;
            cursor: pointer;
        }
        @media (max-width: 600px) {
            .toolbar-content {
                flex-direction: column;
                align-items: stretch;
            }
            .actions-group {
                justify-content: center;
                flex-wrap: wrap;
            }
        }
    `;
    document.head.appendChild(style);
}

window.clearSelection = function () {
    selectedItems.clear();
    document.querySelectorAll('.bulk-check').forEach(cb => cb.checked = false);
    document.getElementById('select-all-products').checked = false;
    document.getElementById('select-all-orders').checked = false;

    updateToolbar();
}

// =======================
// ACTIONS
// =======================

window.bulkDelete = function (type) {
    showConfirmModal(
        'حذف جماعي',
        `هل أنت متأكد من حذف ${selectedItems.size} عنصر؟ هذه العملية لا رجعة فيها.`,
        () => {
            const db = firebase.database();
            const ref = type === 'products' ? db.ref('products') : db.ref('orders');

            // Construct multi-path update
            const multiPathUpdate = {};
            selectedItems.forEach(id => {
                multiPathUpdate[`/${id}`] = null;
            });

            ref.update(multiPathUpdate)
                .then(() => {
                    showNotification(`تم حذف ${selectedItems.size} عنصر بنجاح`);
                    if (window.adminLog) window.adminLog.bulkDelete(selectedItems.size, type);
                    clearSelection();
                })
                .catch(err => {
                    console.error('Bulk delete error:', err);
                    showAlertModal('خطأ', 'حدث خطأ أثناء الحذف: ' + err.message, 'error');
                });
        },
        'نعم، حذف الكل'
    );
}

window.bulkToggleVisibility = function (visible) {
    const multiPathUpdate = {};
    selectedItems.forEach(id => {
        multiPathUpdate[`/${id}/visible`] = visible;
    });

    productsRef.update(multiPathUpdate)
        .then(() => {
            showNotification(visible ? 'تم إظهار المنتجات المحددة' : 'تم إخفاء المنتجات المحددة');
            if (window.adminLog) window.adminLog.bulkVisibility(selectedItems.size, visible);
            clearSelection();
        })
        .catch(err => showNotification('خطأ: ' + err.message, 'error'));
}

window.bulkUpdateStatus = function (status) {
    if (!status) return;

    const multiPathUpdate = {};
    selectedItems.forEach(id => {
        multiPathUpdate[`/${id}/status`] = status;
        // Optionally update text status for logging if needed, but usually just status code
    });

    ordersRef.update(multiPathUpdate)
        .then(() => {
            showNotification(`تم تحديث حالة الطلبات إلى: ${status}`);
            if (window.adminLog) window.adminLog.bulkStatusUpdate(selectedItems.size, status);
            document.getElementById('bulk-order-status').value = "";
            clearSelection();
        })
        .catch(err => showNotification('خطأ: ' + err.message, 'error'));
}

// =======================
// BULK PRICE MODAL
// =======================

window.openBulkPriceModal = function () {
    // Create Modal for Price Update
    const modalId = 'bulk-price-modal';
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.8); z-index: 2000;
            display: flex; align-items: center; justify-content: center;
        `;
        modal.innerHTML = `
             <div style="background: #1a1a2e; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; color: white; border: 1px solid rgba(255,255,255,0.1);">
                <h3>تحديث الأسعار جماعياً (${selectedItems.size} منتج)</h3>
                
                <div class="form-group" style="margin: 1.5rem 0;">
                    <label>نوع التحديث</label>
                    <select id="bulk-price-type" style="width: 100%; padding: 0.5rem; margin-top: 5px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px;">
                        <option value="fixed">💰 تعيين سعر ثابت جديد</option>
                        <option value="increase_percent">📈 زيادة بنسبة مئوية (%)</option>
                        <option value="decrease_percent">📉 خصم بنسبة مئوية (%)</option>
                        <option value="increase_amount">➕ زيادة بمبلغ ثابت</option>
                        <option value="decrease_amount">➖ خصم مبلغ ثابت</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label>القيمة</label>
                    <input type="number" id="bulk-price-value" step="0.01" style="width: 100%; padding: 0.5rem; margin-top: 5px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px;" placeholder="أدخل القيمة...">
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">إلغاء</button>
                    <button class="btn btn-primary" onclick="applyBulkPrice()">تطبيق</button>
                </div>
             </div>
        `;
        document.body.appendChild(modal);
    } else {
        // Update count text if exists
    }
}

window.applyBulkPrice = function () {
    const type = document.getElementById('bulk-price-type').value;
    const value = parseFloat(document.getElementById('bulk-price-value').value);

    if (isNaN(value)) {
        showAlertModal('خطأ في القيمة', 'الرجاء إدخال قيمة رقمية صحيحة لتحديث السعر.', 'error');
        return;
    }

    showConfirmModal(
        'تحديث الأسعار',
        'هل أنت متأكد؟ سيتم تغيير الأسعار لجميع المنتجات المحددة.',
        () => {
            const db = firebase.database();
            const productsRef = db.ref('products');

            let processed = 0;
            const total = selectedItems.size;
            let errorCount = 0;

            if (total === 0) {
                if (document.getElementById('bulk-price-modal')) document.getElementById('bulk-price-modal').remove();
                return;
            }

            console.log(`Starting bulk update for ${total} items. Type: ${type}, Value: ${value}`);

            selectedItems.forEach(id => {
                productsRef.child(id).transaction((product) => {
                    if (product) {
                        let currentPrice = parseFloat(product.price) || 0;
                        const originalPrice = currentPrice;

                        switch (type) {
                            case 'fixed':
                                currentPrice = value;
                                break;
                            case 'increase_percent':
                                currentPrice = currentPrice + (currentPrice * (value / 100));
                                break;
                            case 'decrease_percent':
                                currentPrice = currentPrice - (currentPrice * (value / 100));
                                break;
                            case 'increase_amount':
                                currentPrice = currentPrice + value;
                                break;
                            case 'decrease_amount':
                                currentPrice = currentPrice - value;
                                break;
                        }

                        // Ensure no negative price
                        if (currentPrice < 0) currentPrice = 0;

                        product.price = parseFloat(currentPrice.toFixed(2));
                        console.log(`Product ${id}: ${originalPrice} -> ${product.price}`);
                        return product;
                    }
                    return product; // Return unchanged if null
                }, (error, committed, snapshot) => {
                    processed++;
                    if (error) {
                        console.error('Transaction failed for ' + id, error);
                        errorCount++;
                    } else if (!committed) {
                        console.warn('Transaction not committed for ' + id);
                    }

                    if (processed === total) {
                        if (document.getElementById('bulk-price-modal')) document.getElementById('bulk-price-modal').remove();
                        if (errorCount > 0) {
                            showAlertModal('تنبيه', `تم التحديث مع بعض الأخطاء. فشل تحديث ${errorCount} منتج.`, 'warning');
                        } else {
                            showNotification('تم تحديث الأسعار بنجاح! ✅');
                            if (window.adminLog) window.adminLog.bulkPriceUpdate(total);
                        }
                        clearSelection();
                    }
                });
            });
        },
        'نعم، تحديث الأسعار',
        'primary'
    );
}

