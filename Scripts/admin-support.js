// ============================================
// ADMIN SUPPORT TICKETS — View & Reply to customer tickets
// ============================================
(function () {
    'use strict';

    const TICKETS_REF = 'supportTickets';
    let currentTicketKey = null;
    let ticketsListener = null;

    // ---- Inject Styles ----
    const style = document.createElement('style');
    style.textContent = `
        .support-layout {
            display: grid;
            grid-template-columns: 340px 1fr;
            gap: 1rem;
            min-height: 500px;
        }
        @media (max-width: 768px) {
            .support-layout { grid-template-columns: 1fr; }
        }

        /* Ticket List Sidebar */
        .support-sidebar {
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.06);
            overflow-y: auto;
            max-height: 600px;
        }
        .support-sidebar-header {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .support-sidebar-header h3 {
            font-size: 0.9rem;
            color: rgba(255,255,255,0.7);
            margin: 0;
        }
        .support-filter-btns {
            display: flex;
            gap: 4px;
        }
        .support-filter-btn {
            padding: 3px 10px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            background: transparent;
            color: rgba(255,255,255,0.5);
            font-size: 0.7rem;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            transition: all 0.2s;
        }
        .support-filter-btn.active {
            background: rgba(102,126,234,0.2);
            border-color: rgba(102,126,234,0.4);
            color: #a5b4fc;
        }

        .admin-ticket-item {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            cursor: pointer;
            transition: all 0.2s;
        }
        .admin-ticket-item:hover {
            background: rgba(102,126,234,0.08);
        }
        .admin-ticket-item.active {
            background: rgba(102,126,234,0.15);
            border-right: 3px solid #667eea;
        }
        .admin-ticket-item.has-new {
            border-right: 3px solid #4caf50;
        }
        .admin-ticket-name {
            font-size: 0.9rem;
            font-weight: 600;
            color: rgba(255,255,255,0.9);
        }
        .admin-ticket-subject {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.4);
            margin-top: 2px;
        }
        .admin-ticket-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 6px;
        }
        .admin-ticket-date {
            font-size: 0.7rem;
            color: rgba(255,255,255,0.3);
        }
        .admin-ticket-status {
            font-size: 0.65rem;
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: 600;
        }
        .admin-ticket-status.st-open { background: rgba(76,175,80,0.15); color: #4caf50; }
        .admin-ticket-status.st-replied { background: rgba(33,150,243,0.15); color: #42a5f5; }
        .admin-ticket-status.st-closed { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); }

        /* Chat Panel */
        .support-chat-panel {
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.06);
            display: flex;
            flex-direction: column;
        }
        .support-chat-header {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .support-chat-header-info h3 {
            font-size: 0.95rem;
            color: rgba(255,255,255,0.9);
            margin: 0;
        }
        .support-chat-header-info span {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.4);
        }
        .support-chat-actions {
            display: flex;
            gap: 6px;
        }
        .support-chat-actions button {
            padding: 5px 12px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            background: transparent;
            color: rgba(255,255,255,0.6);
            font-size: 0.75rem;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            transition: all 0.2s;
        }
        .support-chat-actions button:hover {
            background: rgba(255,255,255,0.05);
        }
        .support-chat-actions .close-ticket-btn { border-color: rgba(244,67,54,0.3); color: #ef5350; }
        .support-chat-actions .close-ticket-btn:hover { background: rgba(244,67,54,0.1); }
        .support-chat-actions .delete-ticket-btn { border-color: rgba(244,67,54,0.3); color: #ef5350; }

        .support-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 400px;
            min-height: 300px;
        }
        .admin-chat-msg {
            max-width: 75%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 0.85rem;
        }
        .admin-chat-msg.from-customer {
            align-self: flex-start;
            background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.85);
            border-bottom-right: 4px;
        }
        .admin-chat-msg.from-admin {
            align-self: flex-end;
            background: rgba(102,126,234,0.2);
            color: #c5ceff;
            border-bottom-left-radius: 4px;
        }
        .admin-chat-msg .msg-sender {
            font-size: 0.7rem;
            font-weight: 600;
            color: rgba(255,255,255,0.4);
            margin-bottom: 4px;
        }
        .admin-chat-msg.from-admin .msg-sender { color: #667eea; }
        .admin-chat-msg .msg-time {
            font-size: 0.65rem;
            color: rgba(255,255,255,0.25);
            margin-top: 4px;
            text-align: left;
        }

        .support-chat-input {
            padding: 12px 16px;
            border-top: 1px solid rgba(255,255,255,0.06);
            display: flex;
            gap: 8px;
        }
        .support-chat-input textarea {
            flex: 1;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            color: white;
            padding: 10px 14px;
            font-family: 'Cairo', sans-serif;
            font-size: 0.85rem;
            resize: none;
        }
        .support-chat-input textarea:focus {
            outline: none;
            border-color: rgba(102,126,234,0.4);
        }
        .support-chat-input button {
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 10px;
            font-family: 'Cairo', sans-serif;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .support-chat-input button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .support-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            min-height: 300px;
            color: rgba(255,255,255,0.3);
            font-size: 0.9rem;
        }
        .support-empty-state .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .support-stats-bar {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }
        .support-stat-chip {
            padding: 6px 14px;
            border-radius: 20px;
            background: rgba(102,126,234,0.1);
            border: 1px solid rgba(102,126,234,0.2);
            font-size: 0.8rem;
            color: rgba(255,255,255,0.7);
        }
        .support-stat-chip strong { color: #667eea; }
        .support-stat-chip.stat-open strong { color: #4caf50; }
        .support-stat-chip.stat-replied strong { color: #42a5f5; }
    `;
    document.head.appendChild(style);

    // ---- Inject Support Tab ----
    function injectSupportTab() {
        const tabs = document.querySelector('.admin-tabs');
        if (!tabs || document.getElementById('tab-btn-support')) return;

        const settingsBtn = tabs.querySelector('[onclick*="settings"]');
        if (settingsBtn) {
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.id = 'tab-btn-support';
            btn.setAttribute('onclick', "switchTab('support')");
            btn.innerHTML = '<span>💬</span> الدعم';
            settingsBtn.before(btn);
        }

        const main = document.querySelector('.admin-main');
        if (main) {
            const tabContent = document.createElement('div');
            tabContent.id = 'tab-support';
            tabContent.className = 'tab-content';
            tabContent.innerHTML = `
                <section class="form-section">
                    <h2>💬 تذاكر الدعم الفني</h2>
                    <div class="support-stats-bar" id="support-stats"></div>
                    <div class="support-layout">
                        <!-- Sidebar -->
                        <div class="support-sidebar" id="support-sidebar">
                            <div class="support-sidebar-header">
                                <h3>التذاكر</h3>
                                <div class="support-filter-btns">
                                    <button class="support-filter-btn active" onclick="filterAdminTickets('all', this)">الكل</button>
                                    <button class="support-filter-btn" onclick="filterAdminTickets('open', this)">مفتوحة</button>
                                    <button class="support-filter-btn" onclick="filterAdminTickets('replied', this)">تم الرد</button>
                                    <button class="support-filter-btn" onclick="filterAdminTickets('closed', this)">مغلقة</button>
                                </div>
                            </div>
                            <div id="admin-tickets-list">
                                <div class="support-empty-state"><div class="empty-icon">📭</div>جاري التحميل...</div>
                            </div>
                        </div>
                        <!-- Chat Panel -->
                        <div class="support-chat-panel" id="support-chat-panel">
                            <div class="support-empty-state" id="support-no-selection">
                                <div class="empty-icon">💬</div>
                                اختر تذكرة من القائمة لعرض المحادثة
                            </div>
                            <div id="support-chat-content" style="display: none;"></div>
                        </div>
                    </div>
                </section>
            `;
            main.appendChild(tabContent);
        }
    }

    // ---- Load All Tickets (Admin) ----
    let allTickets = [];
    let currentFilter = 'all';

    function loadAdminTickets() {
        const db = firebase.database();
        const listContainer = document.getElementById('admin-tickets-list');
        if (!listContainer) return;

        // Detach previous listener
        if (ticketsListener) {
            db.ref(TICKETS_REF).off('value', ticketsListener);
        }

        ticketsListener = db.ref(TICKETS_REF).on('value', snapshot => {
            const tickets = snapshot.val();
            allTickets = [];

            if (!tickets) {
                listContainer.innerHTML = '<div class="support-empty-state"><div class="empty-icon">📭</div>لا توجد تذاكر بعد</div>';
                updateSupportStats([]);
                return;
            }

            allTickets = Object.entries(tickets)
                .map(([key, val]) => ({ firebaseKey: key, ...val }))
                .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

            updateSupportStats(allTickets);
            renderFilteredTickets();
        });
    }

    function renderFilteredTickets() {
        const listContainer = document.getElementById('admin-tickets-list');
        if (!listContainer) return;

        const filtered = currentFilter === 'all'
            ? allTickets
            : allTickets.filter(t => t.status === currentFilter);

        listContainer.innerHTML = '';

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="support-empty-state" style="min-height:200px"><div class="empty-icon">📭</div>لا توجد تذاكر</div>';
            return;
        }

        filtered.forEach(ticket => {
            const item = document.createElement('div');
            item.className = 'admin-ticket-item' + (currentTicketKey === ticket.firebaseKey ? ' active' : '');

            // Check if last message is from customer (needs response)
            const lastMsg = ticket.messages ? ticket.messages[ticket.messages.length - 1] : null;
            if (lastMsg && lastMsg.sender === 'customer' && ticket.status !== 'closed') {
                item.classList.add('has-new');
            }

            const date = new Date(ticket.updatedAt || ticket.createdAt);
            const timeAgo = getTimeAgo(date);

            const statusClasses = { 'open': 'st-open', 'replied': 'st-replied', 'closed': 'st-closed' };
            const statusTexts = { 'open': 'مفتوحة', 'replied': 'تم الرد', 'closed': 'مغلقة' };

            item.innerHTML = `
                <div class="admin-ticket-name">${ticket.name}</div>
                <div class="admin-ticket-subject">${ticket.subject}</div>
                <div class="admin-ticket-meta">
                    <span class="admin-ticket-date">${timeAgo}</span>
                    <span class="admin-ticket-status ${statusClasses[ticket.status] || 'st-open'}">${statusTexts[ticket.status] || ticket.status}</span>
                </div>
            `;

            item.addEventListener('click', () => openAdminChat(ticket));
            listContainer.appendChild(item);
        });
    }

    function updateSupportStats(tickets) {
        const statsContainer = document.getElementById('support-stats');
        if (!statsContainer) return;

        const total = tickets.length;
        const open = tickets.filter(t => t.status === 'open').length;
        const replied = tickets.filter(t => t.status === 'replied').length;
        const closed = tickets.filter(t => t.status === 'closed').length;

        statsContainer.innerHTML = `
            <span class="support-stat-chip">📬 الإجمالي: <strong>${total}</strong></span>
            <span class="support-stat-chip stat-open">🟢 مفتوحة: <strong>${open}</strong></span>
            <span class="support-stat-chip stat-replied">💬 تم الرد: <strong>${replied}</strong></span>
            <span class="support-stat-chip">🔒 مغلقة: <strong>${closed}</strong></span>
        `;
    }

    // ---- Filter ----
    window.filterAdminTickets = function (filter, btn) {
        currentFilter = filter;
        document.querySelectorAll('.support-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFilteredTickets();
    };

    // ---- Open Chat (Admin) ----
    function openAdminChat(ticket) {
        currentTicketKey = ticket.firebaseKey;

        // Update sidebar active state
        document.querySelectorAll('.admin-ticket-item').forEach(i => i.classList.remove('active'));
        event.currentTarget?.classList.add('active');

        const noSelection = document.getElementById('support-no-selection');
        const chatContent = document.getElementById('support-chat-content');
        if (noSelection) noSelection.style.display = 'none';
        if (chatContent) chatContent.style.display = 'flex';
        chatContent.style.flexDirection = 'column';
        chatContent.style.height = '100%';

        const statusTexts = { 'open': 'مفتوحة', 'replied': 'تم الرد', 'closed': 'مغلقة' };

        chatContent.innerHTML = `
            <div class="support-chat-header">
                <div class="support-chat-header-info">
                    <h3>${ticket.name} — ${ticket.ticketId}</h3>
                    <span>${ticket.contact} • ${ticket.subject}</span>
                </div>
                <div class="support-chat-actions">
                    ${ticket.status !== 'closed' ? `<button class="close-ticket-btn" onclick="closeAdminTicket('${ticket.firebaseKey}')">🔒 إغلاق</button>` : `<button onclick="reopenAdminTicket('${ticket.firebaseKey}')">🔓 إعادة فتح</button>`}
                    <button class="delete-ticket-btn" onclick="deleteAdminTicket('${ticket.firebaseKey}')">🗑️</button>
                </div>
            </div>
            <div class="support-chat-messages" id="admin-chat-messages"></div>
            ${ticket.status !== 'closed' ? `
            <div class="support-chat-input">
                <textarea id="admin-reply-input" placeholder="اكتب ردك للعميل..." rows="2"></textarea>
                <button onclick="sendAdminReply('${ticket.firebaseKey}')">إرسال</button>
            </div>
            ` : ''}
        `;

        // Enter to send
        const replyInput = document.getElementById('admin-reply-input');
        if (replyInput) {
            replyInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendAdminReply(ticket.firebaseKey);
                }
            });
        }

        renderAdminMessages(ticket.messages);

        // Listen for real-time updates to this ticket
        const db = firebase.database();
        db.ref(TICKETS_REF + '/' + ticket.firebaseKey + '/messages').on('value', snapshot => {
            if (currentTicketKey !== ticket.firebaseKey) return;
            const messages = snapshot.val();
            if (messages) {
                const arr = Array.isArray(messages) ? messages : Object.values(messages);
                renderAdminMessages(arr);
            }
        });
    }

    function renderAdminMessages(messages) {
        const container = document.getElementById('admin-chat-messages');
        if (!container || !messages) return;

        container.innerHTML = '';
        const messagesArr = Array.isArray(messages) ? messages : Object.values(messages);

        messagesArr.forEach(msg => {
            const el = document.createElement('div');
            el.className = `admin-chat-msg ${msg.sender === 'admin' ? 'from-admin' : 'from-customer'}`;
            const time = new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const date = new Date(msg.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });

            el.innerHTML = `
                <div class="msg-sender">${msg.sender === 'admin' ? '🛡️ أنت (الدعم)' : '👤 ' + (msg.name || 'العميل')}</div>
                <div>${msg.text}</div>
                <div class="msg-time">${date} ${time}</div>
            `;
            container.appendChild(el);
        });
        container.scrollTop = container.scrollHeight;
    }

    // ---- Send Admin Reply ----
    window.sendAdminReply = function (firebaseKey) {
        const input = document.getElementById('admin-reply-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        const db = firebase.database();
        const ticketRef = db.ref(TICKETS_REF + '/' + firebaseKey);

        ticketRef.once('value').then(snapshot => {
            const ticket = snapshot.val();
            if (!ticket) return;

            const messages = ticket.messages || [];
            messages.push({
                sender: 'admin',
                name: 'الدعم الفني',
                text: text,
                timestamp: Date.now()
            });

            return ticketRef.update({
                messages: messages,
                status: 'replied',
                updatedAt: Date.now()
            });
        }).then(() => {
            input.value = '';
        }).catch(err => {
            console.error('Admin reply error:', err);
        });
    };

    // ---- Close / Reopen / Delete Ticket ----
    window.closeAdminTicket = function (firebaseKey) {
        if (typeof showConfirmModal === 'function') {
            showConfirmModal('إغلاق التذكرة', 'هل أنت متأكد من إغلاق هذه التذكرة؟', () => {
                firebase.database().ref(TICKETS_REF + '/' + firebaseKey).update({
                    status: 'closed', updatedAt: Date.now()
                }).then(() => {
                    if (typeof showNotification === 'function') showNotification('تم إغلاق التذكرة');
                });
            }, 'نعم، إغلاق');
        } else {
            firebase.database().ref(TICKETS_REF + '/' + firebaseKey).update({
                status: 'closed', updatedAt: Date.now()
            });
        }
    };

    window.reopenAdminTicket = function (firebaseKey) {
        firebase.database().ref(TICKETS_REF + '/' + firebaseKey).update({
            status: 'open', updatedAt: Date.now()
        }).then(() => {
            if (typeof showNotification === 'function') showNotification('تم إعادة فتح التذكرة');
        });
    };

    window.deleteAdminTicket = function (firebaseKey) {
        if (typeof showConfirmModal === 'function') {
            showConfirmModal('حذف التذكرة', 'هل أنت متأكد من حذف هذه التذكرة نهائياً؟', () => {
                firebase.database().ref(TICKETS_REF + '/' + firebaseKey).remove().then(() => {
                    currentTicketKey = null;
                    const chatContent = document.getElementById('support-chat-content');
                    const noSelection = document.getElementById('support-no-selection');
                    if (chatContent) chatContent.style.display = 'none';
                    if (noSelection) noSelection.style.display = '';
                    if (typeof showNotification === 'function') showNotification('تم حذف التذكرة');
                });
            }, 'نعم، حذف', 'danger');
        }
    };

    // ---- Time Ago ----
    function getTimeAgo(date) {
        const now = Date.now();
        const diff = now - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    }

    // ---- Init ----
    function init() {
        injectSupportTab();

        const tabBtn = document.getElementById('tab-btn-support');
        let loaded = false;

        // Original button click listener
        if (tabBtn) {
            tabBtn.addEventListener('click', () => {
                if (!loaded) {
                    loadAdminTickets();
                    loaded = true;
                }
            });
        }

        // New Sidebar / switchTab detection
        const checkTab = setInterval(() => {
            const tabPanel = document.getElementById('tab-support');
            if (tabPanel) {
                clearInterval(checkTab);
                const observer = new MutationObserver(() => {
                    if (tabPanel.classList.contains('active')) {
                        if (!loaded) {
                            loadAdminTickets();
                            loaded = true;
                        }
                    }
                });
                observer.observe(tabPanel, { attributes: true, attributeFilter: ['class'] });
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 200);
    }
})();
