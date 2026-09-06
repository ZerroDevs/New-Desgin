document.addEventListener('DOMContentLoaded', () => {
    const footerHTML = `
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>ZeroNux Store</h3>
                    <p data-i18n="footer-desc">وجهتك الأولى للتسوق عبر الإنترنت في ليبيا.</p>
                </div>
                <div class="footer-section">
                    <h4 data-i18n="footer-quick-links">روابط سريعة</h4>
                    <ul>
                        <li><a href="index.html#home" data-i18n="footer-link-home">الرئيسية</a></li>
                        <li><a href="index.html#products" data-i18n="footer-link-products">المنتجات</a></li>
                        <li><a href="#about" data-i18n="footer-link-about">من نحن</a></li>
                        <li><a href="#contact" data-i18n="footer-link-contact">اتصل بنا</a></li>
                        <li><a href="#refund" data-i18n="footer-link-refund">سياسة الاسترجاع</a></li>
                        <li><a href="track-order.html">تتبع طلبك</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4 data-i18n="footer-customer-service">خدمة العملاء</h4>
                    <ul>
                        <li><a href="faq.html" data-i18n="footer-link-faq">الأسئلة الشائعة</a></li>
                        <li><a href="privacy.html" data-i18n="footer-link-privacy">سياسة الخصوصية</a></li>
                        <li><a href="terms.html" data-i18n="footer-link-terms">الشروط والسياسات</a></li>
                        <li><a href="support.html" data-i18n="footer-link-support">الدعم الفني</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4 data-i18n="footer-contact">اتصل بنا</h4>
                    <ul>
                        <li data-i18n="footer-email">البريد الإلكتروني: <span id="footer-email-text">support@zeronux.store</span></li>
                        <li data-i18n="footer-phone">الهاتف: <span id="footer-phone-text" dir="ltr">+218 916808225</span></li>
                        <li data-i18n="footer-location">ليبيا</li>
                        <li>
                            <a href="#" id="footer-facebook-link" target="_blank" style="color: #667eea; display: inline-flex; align-items: center; gap: 5px; margin-top: 5px;">
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
                <p data-i18n="footer-copyright">&copy; 2026 متجر زيرونكس. جميع الحقوق محفوظة.</p>
            </div>
        </div>
    </footer>
    `;

    const footerContainer = document.getElementById('main-footer');
    if (footerContainer) {
        footerContainer.innerHTML = footerHTML;
    }
});
