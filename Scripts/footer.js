document.addEventListener('DOMContentLoaded', () => {
    const footerHTML = `
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
                        <img src="Images/Logo-noBG.png" alt="New Desgin" style="height: 45px; width: auto;">
                        <h3 style="margin: 0; color: #fff; font-family: var(--font-display);">New Desgin</h3>
                    </div>
                    <p id="footer-desc-text" style="color: rgba(226, 232, 240, 0.8); line-height: 1.8;">وجهتك الأولى لأرقى الملابس العصرية والعطور الفاخرة الأصلية في ليبيا. أناقة لا مثيل لها وجودة استثنائية.</p>
                </div>
                <div class="footer-section">
                    <h4>روابط سريعة</h4>
                    <ul>
                        <li><a href="index.html">الرئيسية</a></li>
                        <li><a href="products.html">كافة المنتجات</a></li>
                        <li><a href="track-order.html">تتبع طلبك</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>خدمة العملاء</h4>
                    <ul>
                        <li><a href="faq.html">الأسئلة الشائعة</a></li>
                        <li><a href="privacy.html">سياسة الخصوصية</a></li>
                        <li><a href="terms.html">الشروط والسياسات</a></li>
                        <li><a href="support.html">الدعم والمساعدة</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>اتصل بنا</h4>
                    <ul>
                        <li>البريد الإلكتروني: <a id="footer-email-link" href="mailto:altasmemaljaded@gmail.com" style="color: inherit; text-decoration: none;"><span id="footer-email-text">altasmemaljaded@gmail.com</span></a></li>
                        <li>الهاتف: <a id="footer-phone-link" href="https://wa.me/218916808225" target="_blank" style="color: inherit; text-decoration: none;"><span id="footer-phone-text" dir="ltr">+218 916808225</span></a></li>
                        <li>الموقع: <span id="footer-location-text">ليبيا - طرابلس (شحن وتوصيل لجميع المدن)</span></li>
                        <li>
                            <a href="#" id="footer-facebook-link" target="_blank" style="color: #38bdf8; display: none; align-items: center; gap: 6px; margin-top: 5px;">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                </svg>
                                فيسبوك
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 New Desgin. جميع الحقوق محفوظة.</p>
            </div>
        </div>
    </footer>
    `;

    const footerContainer = document.getElementById('main-footer');
    if (footerContainer) {
        footerContainer.innerHTML = footerHTML;
    }

    // Function to apply settings to footer
    function applyFooterSettings(settings) {
        if (!settings) return;

        // 0. Footer Description
        const footerDesc = settings.footerDescription || settings.footerDesc;
        if (footerDesc) {
            const descEl = document.getElementById('footer-desc-text');
            if (descEl) descEl.textContent = footerDesc;
        }

        // 1. Phone
        if (settings.phoneNumber) {
            const rawPhone = String(settings.phoneNumber).trim();
            const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
            const phoneText = document.getElementById('footer-phone-text');
            const phoneLink = document.getElementById('footer-phone-link');
            if (phoneText) {
                phoneText.textContent = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
            }
            if (phoneLink) {
                phoneLink.href = `https://wa.me/${cleanPhone}`;
            }
        }

        // 2. Email
        if (settings.contactEmail) {
            const email = String(settings.contactEmail).trim();
            const emailText = document.getElementById('footer-email-text');
            const emailLink = document.getElementById('footer-email-link');
            if (emailText) emailText.textContent = email;
            if (emailLink) emailLink.href = `mailto:${email}`;
        }

        // 3. Location
        if (settings.storeLocation) {
            const locationText = document.getElementById('footer-location-text');
            if (locationText) locationText.textContent = settings.storeLocation;
        }

        // 4. Facebook
        const fbLink = document.getElementById('footer-facebook-link');
        if (fbLink) {
            if (settings.facebookUrl && settings.facebookUrl.trim() !== '' && settings.facebookUrl !== '#') {
                fbLink.href = settings.facebookUrl;
                fbLink.style.display = 'inline-flex';
            } else {
                fbLink.style.display = 'none';
            }
        }
    }

    // Listen to Firebase settings in Realtime
    try {
        if (typeof firebase !== 'undefined' && firebase.database) {
            firebase.database().ref('settings').on('value', snapshot => {
                const settings = snapshot.val() || {};
                applyFooterSettings(settings);
            });
        }
    } catch (e) {
        console.warn('Footer settings realtime listener:', e);
    }
});
