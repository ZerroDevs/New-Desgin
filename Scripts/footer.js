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
                    <p style="color: rgba(226, 232, 240, 0.8); line-height: 1.8;">وجهتك الأولى لأرقى الملابس العصرية والعطور الفاخرة الأصلية في ليبيا. أناقة لا مثيل لها وجودة استثنائية.</p>
                </div>
                <div class="footer-section">
                    <h4>روابط سريعة</h4>
                    <ul>
                        <li><a href="index.html">الرئيسية</a></li>
                        <li><a href="products.html">كافة المنتجات</a></li>
                        <li><a href="products.html?category=clothes">قسم الملابس</a></li>
                        <li><a href="products.html?category=perfumes">قسم العطور</a></li>
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
                        <li>البريد الإلكتروني: <span id="footer-email-text">support@newdesgin.store</span></li>
                        <li>الهاتف: <span id="footer-phone-text" dir="ltr">+218 916808225</span></li>
                        <li>الموقع: ليبيا - طرابلس (شحن وتوصيل لجميع المدن)</li>
                        <li>
                            <a href="#" id="footer-facebook-link" target="_blank" style="color: #38bdf8; display: inline-flex; align-items: center; gap: 6px; margin-top: 5px;">
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
});
