document.addEventListener('DOMContentLoaded', () => {
    // Get query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');
    // const apiKey = urlParams.get('apiKey'); // Not strictly needed as we use our own config

    const titleEl = document.getElementById('action-title');
    const messageEl = document.getElementById('action-message');
    const contentEl = document.getElementById('action-content');
    const resetForm = document.getElementById('reset-password-form');
    const resetError = document.getElementById('reset-error');
    const auth = firebase.auth();

    if (!mode || !oobCode) {
        titleEl.textContent = "خطأ";
        messageEl.textContent = "رابط غير صالح أو انتهت صلاحيته.";
        contentEl.innerHTML = '';
        return;
    }

    switch (mode) {
        case 'verifyEmail':
            handleVerifyEmail(auth, oobCode);
            break;
        case 'resetPassword':
            handleResetPassword(auth, oobCode);
            break;
        case 'recoverEmail':
            // Handle email recovery if needed, usually less common
            titleEl.textContent = "استعادة البريد";
            messageEl.textContent = "تم استعادة بريدك الإلكتروني.";
            contentEl.innerHTML = '';
            break;
        default:
            titleEl.textContent = "خطأ";
            messageEl.textContent = "عملية غير معروفة.";
            contentEl.innerHTML = '';
    }

    // Handle Email Verification
    function handleVerifyEmail(auth, oobCode) {
        titleEl.textContent = "جاري التحقق...";
        auth.applyActionCode(oobCode)
            .then(() => {
                // Success
                titleEl.textContent = "✅ تم التحقق بنجاح";
                messageEl.textContent = "تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول.";
                contentEl.innerHTML = `
                    <a href="https://zeronux.store/login.html" class="submit-btn" style="display: inline-block; text-decoration: none; margin-top: 10px;">تسجيل الدخول</a>
                `;
            })
            .catch((error) => {
                console.error(error);
                titleEl.textContent = "فشل التحقق";
                messageEl.textContent = "الرابط غير صالح أو انتهت صلاحيته.";
                contentEl.innerHTML = `
                    <a href="https://zeronux.store/login.html" style="color: var(--accent-color);">العودة</a>
                `;
            });
    }

    // Handle Password Reset
    function handleResetPassword(auth, oobCode) {
        titleEl.textContent = "تغيير كلمة المرور";
        messageEl.textContent = "الرجاء إدخال كلمة المرور الجديدة.";
        contentEl.style.display = 'none'; // Hide spinner
        resetForm.style.display = 'flex'; // Show form

        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;

            if (!newPassword || newPassword.length < 6) {
                resetError.textContent = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
                resetError.style.display = 'block';
                return;
            }

            // Show loading
            const btn = resetForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = "جاري الحفظ...";
            btn.disabled = true;

            auth.confirmPasswordReset(oobCode, newPassword)
                .then(() => {
                    titleEl.textContent = "✅ تم التغيير بنجاح";
                    messageEl.textContent = "تم تحديث كلمة المرور الخاصة بك.";
                    resetForm.style.display = 'none';
                    contentEl.style.display = 'block';
                    contentEl.innerHTML = `
                        <a href="https://zeronux.store/login.html" class="submit-btn" style="display: inline-block; text-decoration: none; margin-top: 10px;">تسجيل الدخول</a>
                    `;
                })
                .catch((error) => {
                    console.error(error);
                    resetError.textContent = "حدث خطأ: " + error.message;
                    resetError.style.display = 'block';
                    btn.textContent = originalText;
                    btn.disabled = false;
                });
        });
    }
});
