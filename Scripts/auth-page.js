/* file:///c:/Users/START/Desktop/Projects/ZeroNux Store/Scripts/auth-page.js */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toggleLinks = document.querySelectorAll('[data-target]');
    const googleBtn = document.getElementById('google-btn');
    const appleBtn = document.getElementById('apple-btn');
    const emailLoginBtn = document.getElementById('email-login-btn');
    const emailSignupBtn = document.getElementById('email-signup-btn');

    // Check if user is already logged in and verified
    firebase.auth().onAuthStateChanged(user => {
        if (user && user.emailVerified) {
            window.location.href = 'index.html';
        }
    });

    // Helper to switch tabs
    function switchTab(tabId) {
        const loginBox = document.getElementById('login-box');
        const signupBox = document.getElementById('signup-box');
        const forgotBox = document.getElementById('forgot-box');

        // Hide all first
        if (loginBox) loginBox.style.display = 'none';
        if (signupBox) signupBox.style.display = 'none';
        if (forgotBox) forgotBox.style.display = 'none';

        // Show target
        if (tabId === 'signup') {
            if (signupBox) signupBox.style.display = 'block';
        } else if (tabId === 'forgot' || tabId === 'reset') {
            if (forgotBox) forgotBox.style.display = 'block';
        } else {
            if (loginBox) loginBox.style.display = 'block';
        }
    }

    // Check URL Hash on Load
    function checkHash() {
        const hash = window.location.hash.substring(1); // remove #
        if (hash === 'signup' || hash === 'forgot' || hash === 'reset') {
            switchTab(hash);
        } else {
            switchTab('login');
        }
    }

    // Listen for hash changes (e.g. back button)
    window.addEventListener('hashchange', checkHash);

    // Initial check
    checkHash();

    // Toggle between Login, Signup, and Forgot Password
    toggleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;

            // Update URL Hash without scrolling
            history.pushState(null, null, '#' + target);
            checkHash();
        });
    });

    // Forgot Password Logic
    const forgotBtn = document.getElementById('forgot-btn');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            const errorDiv = document.getElementById('forgot-error');
            const successDiv = document.getElementById('forgot-success');

            // Reset UI
            if (errorDiv) { errorDiv.style.display = 'none'; errorDiv.textContent = ''; }
            if (successDiv) successDiv.style.display = 'none';

            if (!email) {
                if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = "الرجاء إدخال البريد الإلكتروني"; }
                return;
            }

            // Check Turnstile
            const forgotBox = document.getElementById('forgot-box');
            const turnstileInput = forgotBox.querySelector('[name="cf-turnstile-response"]');
            const token = turnstileInput ? turnstileInput.value : null;

            // if (!token) {
            //     if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = "الرجاء إتمام التحقق (أنا لست روبوت)"; }
            //     return;
            // }

            try {
                // Use custom action URL for better UX if configured, otherwise standard firebase
                // Custom URL should be in the template settings, so standard call works.
                await firebase.auth().sendPasswordResetEmail(email);

                if (successDiv) successDiv.style.display = 'block';
                // Optional: switch back to login after a few seconds
            } catch (error) {
                console.error("Forgot Password Error:", error);
                let msg = "فشل إرسال الرابط: " + error.message;
                if (error.code === 'auth/user-not-found') {
                    msg = "هذا البريد غير مسجل لدينا"; // More user friendly
                }
                if (errorDiv) { errorDiv.style.display = 'block'; errorDiv.textContent = msg; }
            }
        });
    }

    // Helper to show errors
    function showError(elementId, message) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            // Auto hide after 5 seconds optional, but usually better to stay until user fixes
        } else {
            alert(message); // Fallback
        }
    }

    function clearError(elementId) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
    }

    // Toggle Password Visibility
    window.togglePassword = function (fieldId, icon) {
        const input = document.getElementById(fieldId);
        if (input) {
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '🔒'; // Change icon to indicate "hide"
            } else {
                input.type = 'password';
                icon.textContent = '👁️'; // Change icon to indicate "show"
            }
        }
    };

    // Google Sign In
    // Google Sign In Logic
    const googleSignupBtn = document.getElementById('google-signup-btn');

    async function handleGoogleLogin(e) {
        if (e) e.preventDefault();

        clearError('login-error');
        clearError('signup-error');

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await firebase.auth().signInWithPopup(provider);

            // Smart Redirect
            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get('redirect') || 'index.html';
            window.location.href = redirectUrl;

        } catch (error) {
            console.error("Google Sign In Error:", error);

            // Determine which box is visible to show error
            const isSignupVisible = document.getElementById('signup-box') && document.getElementById('signup-box').style.display === 'block';
            const errorId = isSignupVisible ? 'signup-error' : 'login-error';
            showError(errorId, "فشل تسجيل الدخول باستخدام Google: " + error.message);
        }
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }

    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', handleGoogleLogin);
    }

    // Email Login
    if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            clearError('login-error');

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showError('login-error', "الرجاء إدخال البريد الإلكتروني وكلمة المرور");
                return;
            }

            // Check Turnstile
            const loginBox = document.getElementById('login-box');
            const turnstileInput = loginBox.querySelector('[name="cf-turnstile-response"]');
            const token = turnstileInput ? turnstileInput.value : null;

            // if (!token) {
            //     showError('login-error', "الرجاء إتمام التحقق (أنا لست روبوت)");
            //     return;
            // }

            try {
                // Set Persistence based on Checkbox
                const rememberMe = document.getElementById('remember-me');
                const persistence = rememberMe && rememberMe.checked ?
                    firebase.auth.Auth.Persistence.LOCAL :
                    firebase.auth.Auth.Persistence.SESSION;

                await firebase.auth().setPersistence(persistence);

                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    const errorDiv = document.getElementById('login-error');
                    errorDiv.style.display = 'block';
                    errorDiv.innerHTML = `
                        يرجى تأكيد بريدك الإلكتروني أولاً.
                        <br>
                        <button id="resend-verify-btn" style="background:none; border:none; color:var(--accent-color); text-decoration:underline; cursor:pointer; padding:5px; font-family:inherit;">
                            إعادة إرسال رابط التفعيل
                        </button>
                    `;

                    // Add listener to the new button
                    document.getElementById('resend-verify-btn').addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.target.textContent = "جاري الإرسال...";
                        e.target.disabled = true;
                        try {
                            await user.sendEmailVerification();
                            e.target.textContent = "تم الإرسال! تحقق من بريدك.";
                            e.target.style.color = "#00C851";
                            e.target.style.textDecoration = "none";
                        } catch (err) {
                            console.error("Resend Error", err);
                            e.target.textContent = "فشل الإرسال. حاول لاحقاً.";
                            e.target.style.color = "#ff4444";
                        }
                    });

                    await firebase.auth().signOut();
                    return;
                }

                // Smart Redirect: Go back to where they came from (if it's not login/register page)
                const params = new URLSearchParams(window.location.search);
                const redirectUrl = params.get('redirect') || 'index.html';
                window.location.href = redirectUrl;

            } catch (error) {
                console.error("Login Error:", error);
                let msg = "فشل تسجيل الدخول: " + error.message;
                if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
                }
                showError('login-error', msg);
            }
        });
    }
    // --- Password Strength & Confirmation Logic ---
    const signupPassInput = document.getElementById('signup-password');
    const signupConfirmInput = document.getElementById('signup-confirm-password');
    const strengthContainer = document.getElementById('password-strength-container');
    const strengthText = document.getElementById('strength-text');
    const signupError = document.getElementById('signup-error');

    if (signupPassInput && strengthContainer) {
        signupPassInput.addEventListener('input', () => {
            const val = signupPassInput.value;
            if (val.length === 0) {
                strengthContainer.style.display = 'none';
                return;
            }
            strengthContainer.style.display = 'block';

            // Strength Logic
            let score = 0;
            let label = "ضعيفة جداً";

            if (val.length >= 8) score++;
            if (val.length >= 8 && /[0-9]/.test(val)) score++;
            if (val.length >= 8 && /[^A-Za-z0-9]/.test(val)) score++;
            if (val.length > 12) score++; // Bonus for length

            strengthContainer.classList.remove('strength-weak', 'strength-medium', 'strength-strong');

            if (val.length < 8) {
                label = "قصيرة جداً (8+ أحرف)";
                // No class, default grey bars
            } else if (score < 2) {
                strengthContainer.classList.add('strength-weak');
                label = "ضعيفة";
            } else if (score === 2) {
                strengthContainer.classList.add('strength-medium');
                label = "متوسطة";
            } else {
                strengthContainer.classList.add('strength-strong');
                label = "قوية 💪";
            }

            strengthText.textContent = label;
            checkMatch();
        });
    }

    if (signupConfirmInput) {
        signupConfirmInput.addEventListener('input', checkMatch);
    }

    function checkMatch() {
        if (!signupConfirmInput || !signupPassInput) return;
        const pass = signupPassInput.value;
        const confirm = signupConfirmInput.value;

        if (confirm.length > 0 && pass !== confirm) {
            signupConfirmInput.classList.add('error');
        } else {
            signupConfirmInput.classList.remove('error');
        }
    }

    // --- Signup Submission ---
    if (emailSignupBtn) {
        emailSignupBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = signupPassInput.value;
            const confirm = signupConfirmInput ? signupConfirmInput.value : '';
            const name = document.getElementById('signup-name').value;

            // Simple Validation
            if (!email || !password || !name) {
                showError('signup-error', 'الرجاء تعبئة جميع الحقول');
                return;
            }

            if (password.length < 8) {
                showError('signup-error', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
                return;
            }

            if (signupConfirmInput && password !== confirm) {
                showError('signup-error', 'كلمات المرور غير متطابقة');
                return;
            }

            // Check Terms
            const termsCheckbox = document.getElementById('signup-terms');
            if (termsCheckbox && !termsCheckbox.checked) {
                showError('signup-error', 'يجب الموافقة على الشروط والأحكام للمتابعة');
                return;
            }

            // Check Turnstile
            const signupBox = document.getElementById('signup-box');
            const turnstileInput = signupBox.querySelector('[name="cf-turnstile-response"]');
            const token = turnstileInput ? turnstileInput.value : null;

            // if (!token) {
            //     showError('signup-error', "الرجاء إتمام التحقق (أنا لست روبوت)");
            //     return;
            // }

            try {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update profile with name
                await user.updateProfile({
                    displayName: name
                });

                // Send Verification Email
                await user.sendEmailVerification();

                // Sign out immediately to prevent access
                await firebase.auth().signOut();

                // Redirect to verification page
                window.location.href = 'verify-email.html';
            } catch (error) {
                console.error("Signup Error:", error);
                let msg = "فشل إنشاء الحساب: " + error.message;
                if (error.code === 'auth/email-already-in-use') {
                    msg = "البريد الإلكتروني مستخدم بالفعل";
                } else if (error.code === 'auth/weak-password') {
                    msg = "كلمة المرور ضعيفة جداً";
                }
                showError('signup-error', msg);
            }
        });
    }
});
