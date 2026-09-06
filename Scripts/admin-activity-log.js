// ============================================
// ADMIN ACTIVITY LOG — Track all admin actions
// ============================================
(function () {
    'use strict';

    const activityRef = window.database ? window.database.ref('activityLog') : null;
    let allLogs = []; // Store logs locally for filtering

    // Inject styles (kept for specific activity items only)
    const style = document.createElement('style');
    style.textContent = `
        .activity-item {
            display: flex;
            gap: 12px;
            padding: 12px;
            border-radius: 10px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            margin-bottom: 8px;
            transition: background 0.2s;
            animation: activitySlideIn 0.3s ease-out;
        }
        .activity-item:hover {
            background: rgba(255,255,255,0.05);
        }
        @keyframes activitySlideIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .activity-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            flex-shrink: 0;
        }
        .activity-icon.add { background: rgba(76,175,80,0.15); }
        .activity-icon.edit { background: rgba(255,193,7,0.15); }
        .activity-icon.delete { background: rgba(244,67,54,0.15); }
        .activity-icon.status { background: rgba(33,150,243,0.15); }
        .activity-icon.settings { background: rgba(156,39,176,0.15); }
        .activity-icon.visibility { background: rgba(0,188,212,0.15); }
        .activity-body {
            flex: 1;
            min-width: 0;
        }
        .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }
        .activity-user {
            font-size: 0.75rem;
            color: #64ffda;
            background: rgba(100, 255, 218, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        .activity-text {
            font-size: 0.9rem;
            color: rgba(255,255,255,0.85);
            margin-bottom: 2px;
            line-height: 1.4;
        }
        .activity-text strong {
            color: #667eea;
        }
        .activity-time {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.35);
        }
        .activity-empty {
            text-align: center;
            padding: 2rem;
            color: rgba(255,255,255,0.3);
        }
        .activity-clear-btn {
            padding: 6px 14px;
            border: 1px solid rgba(244,67,54,0.3);
            border-radius: 8px;
            background: rgba(244,67,54,0.1);
            color: #f44336;
            font-family: 'Cairo', sans-serif;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s;
            float: left;
        }
        .activity-clear-btn:hover { background: rgba(244,67,54,0.25); }
    `;
    document.head.appendChild(style);

    // ---- Logging Functions ----
    function logActivity(type, icon, text) {
        if (!activityRef) return;

        const user = firebase.auth().currentUser;
        const userEmail = user ? user.email : 'Unknown';

        const entry = {
            type: type,       // add, edit, delete, status, settings, visibility
            icon: icon,
            text: text,
            user: userEmail,  // Capture admin email
            timestamp: Date.now()
        };

        activityRef.push(entry).catch(err => {
            console.warn('Activity log write failed:', err);
        });

        // Keep only last 200 entries
        activityRef.orderByChild('timestamp').limitToFirst(1).once('value', snapshot => {
            activityRef.once('value', fullSnap => {
                const count = fullSnap.numChildren();
                if (count > 200) {
                    const oldest = Object.keys(fullSnap.val())[0];
                    if (oldest) activityRef.child(oldest).remove();
                }
            });
        });
    }

    // ---- Render Timeline ----
    function renderTimeline(container) {
        if (!activityRef || !container) return;

        // Listen for changes
        activityRef.orderByChild('timestamp').limitToLast(100).on('value', snapshot => {
            allLogs = [];
            snapshot.forEach(child => {
                allLogs.push({ id: child.key, ...child.val() });
            });
            allLogs.reverse(); // Newest first

            filterAndRender();
        });
    }

    function filterAndRender() {
        const container = document.getElementById('activity-timeline');
        if (!container) return;

        const searchTerm = document.getElementById('activity-search')?.value.toLowerCase() || '';
        const filterType = document.getElementById('activity-filter-type')?.value || 'all';

        const filtered = allLogs.filter(entry => {
            const matchesText = entry.text.toLowerCase().includes(searchTerm) || (entry.user && entry.user.toLowerCase().includes(searchTerm));
            const matchesType = filterType === 'all' || entry.type === filterType;
            return matchesText && matchesType;
        });

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = '<div class="activity-empty">📋 لا توجد نتائج</div>';
            return;
        }

        filtered.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'activity-item';

            const timeStr = formatTimeAgo(entry.timestamp);
            const userBadge = entry.user ? `<span class="activity-user" title="بواسطة: ${entry.user}">${entry.user.split('@')[0]}</span>` : '';

            item.innerHTML = `
                <div class="activity-icon ${entry.type}">${entry.icon}</div>
                <div class="activity-body">
                    <div class="activity-header">
                         <div class="activity-time">${timeStr}</div>
                         ${userBadge}
                    </div>
                    <div class="activity-text">${entry.text}</div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    function formatTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'الآن';
        if (mins < 60) return `منذ ${mins} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;

        const date = new Date(timestamp);
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // ---- Export to CSV ----
    function exportToCSV() {
        if (!allLogs.length) {
            showNotification('لا توجد بيانات للتصدير', 'error');
            return;
        }

        // CSV Header
        let csvContent = "Type,Time,User,Description\n";

        allLogs.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleString('en-US');
            // Clean HTML tags from text
            const cleanText = entry.text.replace(/<[^>]*>/g, '').replace(/,/g, ' ');
            const user = entry.user || 'Unknown';
            csvContent += `${entry.type},"${date}","${user}","${cleanText}"\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `activity_log_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ---- Init ----
    function init() {
        // Render Initial Timeline
        const timeline = document.getElementById('activity-timeline');
        if (timeline) {
            renderTimeline(timeline);
        }

        // Event Listeners
        document.getElementById('activity-search')?.addEventListener('input', filterAndRender);
        document.getElementById('activity-filter-type')?.addEventListener('change', filterAndRender);
        document.getElementById('export-activity-log')?.addEventListener('click', exportToCSV);

        document.getElementById('clear-activity-log')?.addEventListener('click', () => {
            showConfirmModal(
                'مسح سجل الأنشطة',
                'هل أنت متأكد من مسح كل سجل الأنشطة؟ لا يمكن التراجع عن هذا الإجراء.',
                () => {
                    if (activityRef) {
                        activityRef.remove()
                            .then(() => showNotification('تم مسح السجل بنجاح 🗑️'))
                            .catch(err => showNotification('خطأ: ' + err.message, 'error'));
                    }
                }
            );
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500); // Give admin.js time to load DOM
    }

    // ---- Global API ----
    window.adminLog = {
        productAdded: (name) => logActivity('add', '➕', `تمت إضافة منتج: <strong>${name}</strong>`),
        productEdited: (name) => logActivity('edit', '✏️', `تم تعديل منتج: <strong>${name}</strong>`),
        productDeleted: (name) => logActivity('delete', '🗑️', `تم حذف منتج: <strong>${name}</strong>`),
        productVisibility: (name, visible) => logActivity('visibility', visible ? '👁️' : '🙈', `تم ${visible ? 'إظهار' : 'إخفاء'} منتج: <strong>${name}</strong>`),
        orderStatus: (orderId, status) => logActivity('status', '📋', `تم تحديث حالة الطلب <strong>#${orderId.slice(-6)}</strong> إلى: ${status}`),
        orderDeleted: (orderId) => logActivity('delete', '🗑️', `تم حذف الطلب <strong>#${orderId.slice(-6)}</strong>`),
        settingsSaved: () => logActivity('settings', '⚙️', 'تم تحديث إعدادات المتجر'),
        bookAdded: (name) => logActivity('add', '📚', `تمت إضافة كتاب: <strong>${name}</strong>`),
        bookEdited: (name) => logActivity('edit', '✏️', `تم تعديل كتاب: <strong>${name}</strong>`),
        bookDeleted: (name) => logActivity('delete', '🗑️', `تم حذف كتاب: <strong>${name}</strong>`),
        promoCreated: (code) => logActivity('add', '🎫', `تم إنشاء كوبون: <strong>${code}</strong>`),
        promoDeleted: (code) => logActivity('delete', '🗑️', `تم حذف كوبون: <strong>${code}</strong>`),

        // Bulk Actions
        bulkDelete: (count, type) => logActivity('delete', '🔥', `تم حذف <strong>${count}</strong> من ${type === 'products' ? 'المنتجات' : 'الطلبات'} جماعياً`),
        bulkPriceUpdate: (count) => logActivity('edit', '💰', `تم تحديث أسعار <strong>${count}</strong> منتج جماعياً`),
        bulkStatusUpdate: (count, status) => logActivity('status', '📋', `تم تحديث حالة <strong>${count}</strong> طلب جماعياً إلى: ${status}`),
        bulkVisibility: (count, visible) => logActivity('visibility', visible ? '👁️' : '🙈', `تم ${visible ? 'إظهار' : 'إخفاء'} <strong>${count}</strong> منتج جماعياً`),
    };
})();
