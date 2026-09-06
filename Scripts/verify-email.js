document.addEventListener('DOMContentLoaded', () => {
    const resendBtn = document.getElementById('resend-btn');
    const timerSpan = document.getElementById('timer');
    const statusDiv = document.getElementById('status-message');
    const successDiv = document.getElementById('success-message');

    let countdown = 60;
    let timerInterval;

    // Check if user is logged in (they might not be if they came from email link, but usually flow is Signup -> Verify Page)
    // If not logged in, we might need them to login to resend, OR we handle the case where they are redirected here after login.

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            if (user.emailVerified) {
                // Already verified? Redirect
                window.location.href = 'index.html';
            }
        } else {
            // Not logged in. 
            // We can't resend email if we don't know who the user is.
            // Redirect to login? Or show message.
            resendBtn.disabled = true;
            resendBtn.textContent = 'يتطلب تسجيل الدخول';
        }
    });

    resendBtn.addEventListener('click', async () => {
        const user = firebase.auth().currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            resendBtn.disabled = true;
            await user.sendEmailVerification();

            showSuccess('تم إرسال الرابط بنجاح!');
            startTimer();

        } catch (error) {
            console.error("Resend Error:", error);
            let msg = "حدث خطأ ما via إعادة الإرسال.";
            if (error.code === 'auth/too-many-requests') {
                msg = "يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.";
            }
            showError(msg);
            resendBtn.disabled = false;
        }
    });

    function startTimer() {
        countdown = 60;
        updateTimerDisplay();

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            countdown--;
            updateTimerDisplay();

            if (countdown <= 0) {
                clearInterval(timerInterval);
                resendBtn.disabled = false;
                timerSpan.textContent = '';
                resendBtn.innerHTML = 'إعادة إرسال الرابط';
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        resendBtn.disabled = true;
        timerSpan.textContent = `(${countdown}s)`;
    }

    function showError(msg) {
        statusDiv.textContent = msg;
        statusDiv.style.display = 'block';
        successDiv.style.display = 'none';
    }

    function showSuccess(msg) {
        successDiv.textContent = msg;
        successDiv.style.display = 'block';
        statusDiv.style.display = 'none';
    }
});
