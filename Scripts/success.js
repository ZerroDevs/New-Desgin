// ============================================
// SUCCESS PAGE LOGIC
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM Elements
    const orderIdEl = document.getElementById('order-id');
    const whatsappBtn = document.getElementById('whatsapp-btn');
    const copyBtn = document.getElementById('copy-order-btn');

    // Get Order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    // ============================================
    // 1. INITIALIZE PAGE
    // ============================================
    if (orderId) {
        // Display Order ID
        orderIdEl.textContent = orderId;

        // Setup Features
        updateWhatsAppLink(orderId);
        setupCopyButton(orderId);

        // Listen for contact info updates (from app.js)
        document.addEventListener('contact-info-updated', (e) => {
            if (e.detail && e.detail.phoneNumber) {
                window.CONTACT_NUMBER = e.detail.phoneNumber;
            }
            updateWhatsAppLink(orderId);
        });

    } else {
        // Error State
        orderIdEl.textContent = "غير متوفر";
        if (whatsappBtn) whatsappBtn.style.display = 'none';
        if (copyBtn) copyBtn.style.display = 'none';
    }
});

// ============================================
// 2. WHATSAPP LINK HANDLER
// ============================================
function updateWhatsAppLink(orderId) {
    const whatsappBtn = document.getElementById('whatsapp-btn');
    if (!whatsappBtn) return;

    // Use global CONTACT_NUMBER (fallback to default if needed)
    const phone = (window.CONTACT_NUMBER && window.CONTACT_NUMBER !== '218916808225')
        ? window.CONTACT_NUMBER
        : '218916808225';

    const message = `مرحباً، قمت للتو بطلب جديد من المتجر.\nرقم الطلب: ${orderId}\nأرغب في إتمام عملية الدفع والتوصيل.`;
    const encodedMessage = encodeURIComponent(message);

    whatsappBtn.href = `https://wa.me/${phone}?text=${encodedMessage}`;
}

// ============================================
// 3. COPY ORDER ID HANDLER
// ============================================
function setupCopyButton(orderId) {
    const copyBtn = document.getElementById('copy-order-btn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', () => {
        // Copy to clipboard
        navigator.clipboard.writeText(orderId).then(() => {
            // Success Feedback
            showCopyFeedback(copyBtn);

            // Show Gloabl Notification (if available in app.js)
            if (typeof showNotification === 'function') {
                showNotification('تم نسخ رقم الطلب 📋');
            } else {
                // Fallback alert if app.js not loaded/working
                alert('تم نسخ رقم الطلب: ' + orderId);
            }

        }).catch(err => {
            console.error('Failed to copy: ', err);
            showNotification('فشل نسخ النص ❌');
        });
    });
}

// Visual feedback for the button itself
function showCopyFeedback(button) {
    const originalIcon = button.innerHTML;

    // Change to Checkmark
    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #4cd137;">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    `;
    button.classList.add('copied');

    // Revert after 2 seconds
    setTimeout(() => {
        button.innerHTML = originalIcon;
        button.classList.remove('copied');
    }, 2000);
}
// ============================================
// 4. BACKGROUND ANIMATION
// ============================================
function createBackgroundAnimation() {
    const container = document.getElementById('success-bg-animation');
    if (!container) return;

    const logoUrl = 'https://assets.zeronux.store/Logo.png';
    const count = 15; // Number of floating logos

    for (let i = 0; i < count; i++) {
        const logo = document.createElement('img');
        logo.src = logoUrl;
        logo.classList.add('floating-logo');

        // Randomize properties
        const left = Math.random() * 100; // 0-100%
        const delay = Math.random() * 10; // 0-10s delay
        const duration = 10 + Math.random() * 10; // 10-20s duration
        const size = 30 + Math.random() * 50; // 30-80px size

        logo.style.left = `${left}%`;
        logo.style.animationDelay = `-${delay}s`; // Negative delay to start mid-animation
        logo.style.animationDuration = `${duration}s`;
        logo.style.width = `${size}px`;
        logo.style.height = `${size}px`;

        container.appendChild(logo);
    }
}

// Initialize Animation
createBackgroundAnimation();
