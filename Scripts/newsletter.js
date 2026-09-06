// ============================================
// NEWSLETTER SUBSCRIPTION (Newsteller)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('.newsletter-form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input[type="email"]');
            const btn = form.querySelector('button');
            const email = input.value.trim();

            if (!email) return;

            // Basic validation
            if (!validateEmail(email)) {
                showToast('يرجى إدخال بريد إلكتروني صحيح', 'error');
                return;
            }

            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '⏳';

            // Save to Firebase
            // Using a safe key for email (replace . with ,)
            const safeEmail = email.replace(/\./g, ',');

            // Check if already exists (optional, but good practice)
            firebase.database().ref('newsletter/' + safeEmail).set({
                email: email,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                source: window.location.pathname
            })
                .then(() => {
                    showToast('✅ تم الاشتراك بنجاح! شكراً لك.');
                    input.value = '';
                    btn.textContent = 'مشترك ✔';
                    setTimeout(() => {
                        btn.disabled = false;
                        btn.textContent = originalText;
                    }, 3000);
                })
                .catch((error) => {
                    console.error('Newsletter Error:', error);
                    showToast('حدث خطأ، حاول مرة أخرى.', 'error');
                    btn.disabled = false;
                    btn.textContent = originalText;
                });
        });
    });
});

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
}

// Simple Toast Notification (if not available globally)
function showToast(message, type = 'success') {
    // Check if we have a toast container, if not create one
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${type === 'success' ? '#00b894' : '#ff7675'};
        color: white; padding: 12px 24px; border-radius: 8px;
        font-family: 'Cairo', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation keyframes if needed
if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}
