// ============================================
// SUPPORT TICKETS — Customer-side ticket system
// ============================================
(function () {
    'use strict';

    const TICKETS_REF = 'supportTickets';

    // Generate a unique visitor ID (stored in localStorage)
    function getVisitorId() {
        let id = localStorage.getItem('support_visitor_id');
        if (!id) {
            id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('support_visitor_id', id);
        }
        return id;
    }

    // Generate short ticket ID
    function generateTicketId() {
        return 'TKT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    // ---- Submit New Ticket ----
    window.submitSupportTicket = function () {
        const name = document.getElementById('ticket-name').value.trim();
        const contact = document.getElementById('ticket-contact').value.trim();
        const subject = document.getElementById('ticket-subject').value;
        const message = document.getElementById('ticket-message').value.trim();

        if (!name || !contact || !message) {
            showTicketNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const db = firebase.database();
        const visitorId = getVisitorId();
        const ticketId = generateTicketId();

        const ticketData = {
            ticketId: ticketId,
            visitorId: visitorId,
            name: name,
            contact: contact,
            subject: subject,
            message: message,
            status: 'open',
            createdAt: Date.now(),
            messages: [{
                sender: 'customer',
                name: name,
                text: message,
                timestamp: Date.now()
            }]
        };

        // Disable submit button
        const submitBtn = document.getElementById('ticket-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'جاري الإرسال...';
        }

        db.ref(TICKETS_REF).push(ticketData)
            .then(() => {
                // Save user profile for next time
                if (typeof saveUserProfile === 'function') {
                    const isPhone = /^[0-9+]+$/.test(contact);
                    const profileUpdate = { name: name };
                    if (isPhone) profileUpdate.phone = contact;

                    // Merge with existing profile to avoid overwriting other fields
                    const existing = getUserProfile() || {};
                    saveUserProfile({ ...existing, ...profileUpdate });
                }

                showTicketNotification('تم إرسال تذكرتك بنجاح! رقم التذكرة: ' + ticketId, 'success');
                // Clear form
                document.getElementById('ticket-name').value = '';
                document.getElementById('ticket-contact').value = '';
                document.getElementById('ticket-message').value = '';
                // Show tickets list
                loadMyTickets();
                // Switch to my tickets tab
                switchSupportView('my-tickets');
            })
            .catch(err => {
                console.error('Ticket submit error:', err);
                showTicketNotification('حدث خطأ أثناء الإرسال. حاول مرة أخرى.', 'error');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'إرسال التذكرة 🚀';
                }
            });
    };

    // ---- Load My Tickets ----
    window.loadMyTickets = function () {
        const db = firebase.database();
        const visitorId = getVisitorId();
        const container = document.getElementById('my-tickets-list');
        if (!container) return;

        container.innerHTML = '<div class="ticket-loading">جاري التحميل...</div>';

        db.ref(TICKETS_REF).orderByChild('visitorId').equalTo(visitorId).once('value')
            .then(snapshot => {
                const tickets = snapshot.val();
                container.innerHTML = '';

                if (!tickets) {
                    container.innerHTML = '<div class="ticket-empty">📭 لا توجد تذاكر سابقة</div>';
                    return;
                }

                const ticketsArray = Object.entries(tickets)
                    .map(([key, val]) => ({ firebaseKey: key, ...val }))
                    .sort((a, b) => b.createdAt - a.createdAt);

                ticketsArray.forEach(ticket => {
                    const card = createTicketCard(ticket);
                    container.appendChild(card);
                });
            })
            .catch(err => {
                console.error('Error loading tickets:', err);
                container.innerHTML = '<div class="ticket-empty">❌ خطأ في تحميل التذاكر</div>';
            });
    };

    function createTicketCard(ticket) {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.dataset.key = ticket.firebaseKey;

        const date = new Date(ticket.createdAt);
        const formattedDate = date.toLocaleDateString('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const statusMap = {
            'open': { text: 'مفتوحة', class: 'status-open', icon: '🟢' },
            'replied': { text: 'تم الرد', class: 'status-replied', icon: '💬' },
            'closed': { text: 'مغلقة', class: 'status-closed', icon: '🔒' }
        };
        const st = statusMap[ticket.status] || statusMap['open'];

        const lastMsg = ticket.messages ? ticket.messages[ticket.messages.length - 1] : null;
        const hasAdminReply = ticket.messages ? ticket.messages.some(m => m.sender === 'admin') : false;
        const unreadClass = (ticket.status === 'replied' && lastMsg && lastMsg.sender === 'admin') ? 'ticket-unread' : '';

        card.className = `ticket-card ${unreadClass}`;
        card.innerHTML = `
            <div class="ticket-card-header">
                <div class="ticket-card-id">${ticket.ticketId}</div>
                <span class="ticket-status ${st.class}">${st.icon} ${st.text}</span>
            </div>
            <div class="ticket-card-subject">${ticket.subject}</div>
            <div class="ticket-card-preview">${ticket.message.substring(0, 80)}${ticket.message.length > 80 ? '...' : ''}</div>
            <div class="ticket-card-footer">
                <span class="ticket-card-date">📅 ${formattedDate}</span>
                ${hasAdminReply ? '<span class="ticket-has-reply">💬 يوجد رد</span>' : ''}
            </div>
        `;

        card.addEventListener('click', () => openTicketChat(ticket));

        return card;
    }

    // ---- Ticket Chat View ----
    function openTicketChat(ticket) {
        const chatContainer = document.getElementById('ticket-chat-view');
        const listContainer = document.getElementById('my-tickets-view');
        if (!chatContainer || !listContainer) return;

        listContainer.style.display = 'none';
        chatContainer.style.display = '';

        const statusMap = {
            'open': { text: 'مفتوحة', class: 'status-open' },
            'replied': { text: 'تم الرد', class: 'status-replied' },
            'closed': { text: 'مغلقة', class: 'status-closed' }
        };
        const st = statusMap[ticket.status] || statusMap['open'];

        chatContainer.innerHTML = `
            <div class="chat-header">
                <button class="chat-back-btn" onclick="closeChatView()">→ رجوع</button>
                <div class="chat-header-info">
                    <div class="chat-ticket-id">${ticket.ticketId}</div>
                    <span class="ticket-status ${st.class}">${st.text}</span>
                </div>
            </div>
            <div class="chat-subject">${ticket.subject}</div>
            <div class="chat-messages" id="chat-messages"></div>
            ${ticket.status !== 'closed' ? `
            <div class="chat-input-area">
                <textarea id="chat-reply-input" placeholder="اكتب ردك هنا..." rows="2"></textarea>
                <button class="btn btn-primary chat-send-btn" onclick="sendCustomerReply('${ticket.firebaseKey}')">إرسال</button>
            </div>
            ` : '<div class="chat-closed-notice">🔒 هذه التذكرة مغلقة</div>'}
        `;

        // Enter to send
        const replyInput = document.getElementById('chat-reply-input');
        if (replyInput) {
            replyInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendCustomerReply(ticket.firebaseKey);
                }
            });
        }

        // Render messages
        const messagesContainer = document.getElementById('chat-messages');
        if (ticket.messages) {
            ticket.messages.forEach(msg => {
                const msgEl = document.createElement('div');
                msgEl.className = `chat-msg ${msg.sender === 'admin' ? 'chat-msg-admin' : 'chat-msg-customer'}`;
                const time = new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                const date = new Date(msg.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
                msgEl.innerHTML = `
                    <div class="chat-msg-sender">${msg.sender === 'admin' ? '🛡️ الدعم الفني' : '👤 ' + (msg.name || 'أنت')}</div>
                    <div class="chat-msg-text">${msg.text}</div>
                    <div class="chat-msg-time">${date} ${time}</div>
                `;
                messagesContainer.appendChild(msgEl);
            });
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Listen for real-time updates
        const db = firebase.database();
        db.ref(TICKETS_REF + '/' + ticket.firebaseKey + '/messages').on('value', snapshot => {
            const messages = snapshot.val();
            if (!messages) return;
            const messagesArr = Array.isArray(messages) ? messages : Object.values(messages);
            const container = document.getElementById('chat-messages');
            if (!container) return;
            container.innerHTML = '';
            messagesArr.forEach(msg => {
                const msgEl = document.createElement('div');
                msgEl.className = `chat-msg ${msg.sender === 'admin' ? 'chat-msg-admin' : 'chat-msg-customer'}`;
                const time = new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                const date = new Date(msg.timestamp).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
                msgEl.innerHTML = `
                    <div class="chat-msg-sender">${msg.sender === 'admin' ? '🛡️ الدعم الفني' : '👤 ' + (msg.name || 'أنت')}</div>
                    <div class="chat-msg-text">${msg.text}</div>
                    <div class="chat-msg-time">${date} ${time}</div>
                `;
                container.appendChild(msgEl);
            });
            container.scrollTop = container.scrollHeight;
        });
    }

    window.closeChatView = function () {
        const chatContainer = document.getElementById('ticket-chat-view');
        const listContainer = document.getElementById('my-tickets-view');
        if (chatContainer) chatContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = '';

        // Detach listeners
        const db = firebase.database();
        // Simplified: we'll just reload the tickets
        loadMyTickets();
    };

    // ---- Send Customer Reply ----
    window.sendCustomerReply = function (firebaseKey) {
        const input = document.getElementById('chat-reply-input');
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
                sender: 'customer',
                name: ticket.name,
                text: text,
                timestamp: Date.now()
            });

            return ticketRef.update({
                messages: messages,
                status: 'open',
                updatedAt: Date.now()
            });
        }).then(() => {
            input.value = '';
        }).catch(err => {
            console.error('Reply error:', err);
            showTicketNotification('خطأ في إرسال الرد', 'error');
        });
    };

    // ---- Support View Toggle ----
    window.switchSupportView = function (view) {
        const newTicketView = document.getElementById('new-ticket-view');
        const myTicketsView = document.getElementById('my-tickets-view');
        const chatView = document.getElementById('ticket-chat-view');

        if (newTicketView) newTicketView.style.display = view === 'new-ticket' ? '' : 'none';
        if (myTicketsView) myTicketsView.style.display = view === 'my-tickets' ? '' : 'none';
        if (chatView) chatView.style.display = 'none';

        // Toggle active button
        document.querySelectorAll('.support-tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.support-tab-btn[data-view="${view}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (view === 'my-tickets') {
            loadMyTickets();
        }
    };

    // ---- Notification ----
    function showTicketNotification(msg, type) {
        const existing = document.getElementById('ticket-notification');
        if (existing) existing.remove();

        const notif = document.createElement('div');
        notif.id = 'ticket-notification';
        notif.className = `ticket-notif ticket-notif-${type}`;
        notif.textContent = msg;
        document.body.appendChild(notif);

        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 4000);
    }

})();
