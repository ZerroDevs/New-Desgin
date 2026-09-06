// ============================================
// ADMIN SEO MANAGER — Meta Tags, OG, Twitter, Robots
// ============================================
(function () {
    'use strict';

    const SEO_REF_PATH = 'seoSettings';

    // ---- Inject Styles ----
    const style = document.createElement('style');
    style.textContent = `
        .seo-preview-card {
            background: white;
            border-radius: 12px;
            padding: 16px 20px;
            margin-top: 1rem;
            max-width: 600px;
            font-family: Arial, sans-serif;
            direction: ltr;
            text-align: left;
        }
        .seo-preview-card .seo-google {
            /* Google Style */
        }
        .seo-google-title {
            font-size: 1.1rem;
            color: #1a0dab;
            text-decoration: none;
            font-weight: 400;
            line-height: 1.3;
            cursor: pointer;
        }
        .seo-google-title:hover { text-decoration: underline; }
        .seo-google-url {
            font-size: 0.8rem;
            color: #006621;
            margin: 2px 0;
        }
        .seo-google-desc {
            font-size: 0.85rem;
            color: #545454;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .seo-preview-card .seo-social {
            /* Social Card Style */
        }
        .seo-social-image {
            width: 100%;
            height: 180px;
            object-fit: cover;
            border-radius: 10px 10px 0 0;
            background: #eee;
            display: block;
        }
        .seo-social-body {
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 10px 10px;
            padding: 10px 14px;
            background: #f8f8f8;
        }
        .seo-social-site {
            font-size: 0.7rem;
            color: #999;
            text-transform: uppercase;
        }
        .seo-social-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: #333;
            margin: 2px 0;
        }
        .seo-social-desc {
            font-size: 0.8rem;
            color: #777;
        }

        .seo-char-count {
            font-size: 0.7rem;
            color: rgba(255,255,255,0.35);
            text-align: left;
            margin-top: 2px;
        }
        .seo-char-count.warn { color: #ff9800; }
        .seo-char-count.danger { color: #f44336; }

        .seo-section-divider {
            border: none;
            border-top: 1px solid rgba(255,255,255,0.08);
            margin: 1.5rem 0;
        }

        .seo-robots-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 0.5rem;
        }
        .seo-robots-option {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.06);
        }
        .seo-robots-option label {
            font-size: 0.85rem;
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            flex: 1;
        }
        .seo-robots-option input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        .seo-robots-desc {
            font-size: 0.7rem;
            color: rgba(255,255,255,0.35);
        }

        .seo-preview-toggle {
            display: flex;
            gap: 8px;
            margin-top: 1rem;
        }
        .seo-preview-toggle button {
            padding: 6px 14px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.05);
            color: rgba(255,255,255,0.6);
            font-family: 'Cairo', sans-serif;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .seo-preview-toggle button.active {
            background: rgba(102,126,234,0.2);
            border-color: rgba(102,126,234,0.4);
            color: #a5b4fc;
        }
    `;
    document.head.appendChild(style);

    // ---- Inject SEO Tab ----
    function injectSeoTab() {
        const tabs = document.querySelector('.admin-tabs');
        if (!tabs || document.getElementById('tab-btn-seo')) return;

        // Add tab button before Settings
        const settingsBtn = tabs.querySelector('[onclick*="settings"]');
        if (settingsBtn) {
            const seoBtn = document.createElement('button');
            seoBtn.className = 'tab-btn';
            seoBtn.id = 'tab-btn-seo';
            seoBtn.setAttribute('onclick', "switchTab('seo')");
            seoBtn.innerHTML = '<span>🌐</span> SEO';
            settingsBtn.before(seoBtn);
        }

        // Tab content
        const main = document.querySelector('.admin-main');
        if (main) {
            const tabContent = document.createElement('div');
            tabContent.id = 'tab-seo';
            tabContent.className = 'tab-content';
            tabContent.innerHTML = `
                <section class="form-section">
                    <h2>🌐 مدير تحسين محركات البحث (SEO)</h2>
                    <p style="color: rgba(255,255,255,0.4); font-size: 0.85rem; margin-bottom: 1.5rem;">
                        تحكم في كيف يظهر متجرك على جوجل، فيسبوك، وواتساب بدون تعديل الكود.
                    </p>

                    <form id="seo-form" onsubmit="return false;">
                        <!-- Meta Title -->
                        <div class="form-group">
                            <label>عنوان الصفحة (Meta Title) 🏷️</label>
                            <input type="text" id="seo-meta-title" placeholder="متجر زيرونكس - ZeroNux Store" maxlength="70">
                            <div class="seo-char-count" id="seo-title-count">0 / 60 حرف (الأفضل 50-60)</div>
                        </div>

                        <!-- Meta Description -->
                        <div class="form-group">
                            <label>وصف الصفحة (Meta Description) 📝</label>
                            <textarea id="seo-meta-desc" rows="3" placeholder="متجر زيرونكس - وجهتك الأولى للتسوق الإلكتروني..." maxlength="170"></textarea>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div class="seo-char-count" id="seo-desc-count">0 / 160 حرف (الأفضل 120-160)</div>
                                <button type="button" onclick="aiEnhanceSeoDesc()"
                                    style="margin-top: 4px; background: linear-gradient(135deg, #ff9800, #f57c00); color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; transition: all 0.3s; opacity: 0.9;"
                                    onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">
                                    🤖 تحسين AI
                                </button>
                            </div>
                        </div>

                        <hr class="seo-section-divider">

                        <!-- OG Image -->
                        <div class="form-group">
                            <label>صورة المشاركة (OG Image) 🖼️</label>
                            <input type="text" id="seo-og-image" placeholder="https://assets.zeronux.store/Logo.png">
                            <small style="color: rgba(255,255,255,0.3);">الصورة التي تظهر عند مشاركة الرابط على فيسبوك أو واتساب. الحجم المثالي: 1200×630 بكسل</small>
                        </div>

                        <!-- Site URL -->
                        <div class="form-group">
                            <label>رابط الموقع (Site URL) 🔗</label>
                            <input type="text" id="seo-site-url" placeholder="https://zeronux.store">
                        </div>

                        <hr class="seo-section-divider">

                        <!-- Robots Preferences -->
                        <h3 style="margin-bottom: 0.8rem;">🤖 إعدادات الروبوتات (Robots)</h3>
                        <div class="seo-robots-options">
                            <div class="seo-robots-option">
                                <input type="checkbox" id="seo-robots-index" checked>
                                <div>
                                    <label for="seo-robots-index">السماح بالفهرسة (Index)</label>
                                    <div class="seo-robots-desc">السماح لجوجل بإظهار موقعك في نتائج البحث</div>
                                </div>
                            </div>
                            <div class="seo-robots-option">
                                <input type="checkbox" id="seo-robots-follow" checked>
                                <div>
                                    <label for="seo-robots-follow">تتبع الروابط (Follow)</label>
                                    <div class="seo-robots-desc">السماح لجوجل بتتبع الروابط داخل الصفحة</div>
                                </div>
                            </div>
                        </div>

                        <hr class="seo-section-divider">

                        <!-- Live Preview -->
                        <h3 style="margin-bottom: 0.5rem;">👁️ معاينة مباشرة</h3>
                        <div class="seo-preview-toggle">
                            <button type="button" class="active" onclick="switchSeoPreview('google', this)">🔍 جوجل</button>
                            <button type="button" onclick="switchSeoPreview('social', this)">📱 واتساب / فيسبوك</button>
                        </div>

                        <div id="seo-preview-container">
                            <!-- Google Preview (default) -->
                            <div class="seo-preview-card" id="seo-preview-google">
                                <div class="seo-google">
                                    <div class="seo-google-url" id="preview-google-url">zeronux.store</div>
                                    <a class="seo-google-title" id="preview-google-title">متجر زيرونكس - ZeroNux Store</a>
                                    <div class="seo-google-desc" id="preview-google-desc">متجر زيرونكس - وجهتك الأولى للتسوق الإلكتروني...</div>
                                </div>
                            </div>
                            <!-- Social Preview (hidden by default) -->
                            <div class="seo-preview-card" id="seo-preview-social" style="display: none; padding: 0; overflow: hidden;">
                                <div class="seo-social">
                                    <img class="seo-social-image" id="preview-social-image" src="https://assets.zeronux.store/Logo.png" alt="OG Preview">
                                    <div class="seo-social-body">
                                        <div class="seo-social-site" id="preview-social-site">zeronux.store</div>
                                        <div class="seo-social-title" id="preview-social-title">متجر زيرونكس</div>
                                        <div class="seo-social-desc" id="preview-social-desc">وصف الصفحة يظهر هنا...</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary" style="margin-top: 1.5rem;" onclick="saveSeoSettings()">💾 حفظ إعدادات SEO</button>
                    </form>
                </section>
            `;
            main.appendChild(tabContent);
        }
    }

    // ---- AI Enhance SEO Description ----
    window.aiEnhanceSeoDesc = async function () {
        if (!window.AdminAI || !window.AdminAI.getApiKey()) {
            if (typeof showNotification === 'function') showNotification('أضف مفتاح API أولاً في الإعدادات', 'error');
            return;
        }

        const btn = event.target.closest('button');
        const originalText = btn.textContent;
        const currentTitle = document.getElementById('seo-meta-title').value || 'متجر زيرونكس';
        const currentDesc = document.getElementById('seo-meta-desc').value;

        btn.disabled = true;
        btn.textContent = '⏳ ...';

        try {
            let prompt;
            if (currentDesc) {
                prompt = `حسّن وصف الميتا (Meta Description) لصفحة متجر إلكتروني رئيسية بعنوان "${currentTitle}". الوصف الحالي: "${currentDesc}". اجعله احترافياً، جذاباً ومختصراً (أقل من 160 حرف) باللغة العربية.`;
            } else {
                prompt = `اكتب وصف ميتا (Meta Description) احترافي لصفحة رئيسية لمتجر إلكتروني اسمه "${currentTitle}". يبيع منتجات رقمية وكتب. اجعله جذاباً ومحفزاً للنقر (CTR) في حدود 150 حرفاً باللغة العربية.`;
            }

            const result = await window.AdminAI.chat(prompt, {
                systemPrompt: 'أنت خبير SEO. اكتب وصفاً واحداً فقط، مباشراً، بدون أي مقدمات أو علامات تنصيص.',
                maxTokens: 80,
                temperature: 0.7
            });

            const finalDesc = result.replace(/^["']|["']$/g, '').trim().substring(0, 160);

            const descInput = document.getElementById('seo-meta-desc');
            descInput.value = finalDesc;
            descInput.dispatchEvent(new Event('input')); // Trigger preview update

            if (typeof showNotification === 'function') showNotification('✨ تم تحسين الوصف!');

        } catch (error) {
            console.error(error);
            if (typeof showNotification === 'function') showNotification('فشل التحسين: ' + error.message, 'error');
        }

        btn.disabled = false;
        btn.textContent = originalText;
    };

    // ---- Preview Toggle ----
    window.switchSeoPreview = function (type, btn) {
        document.getElementById('seo-preview-google').style.display = type === 'google' ? '' : 'none';
        document.getElementById('seo-preview-social').style.display = type === 'social' ? '' : 'none';

        btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    // ---- Live Preview Binding ----
    function bindLivePreview() {
        const titleInput = document.getElementById('seo-meta-title');
        const descInput = document.getElementById('seo-meta-desc');
        const imageInput = document.getElementById('seo-og-image');
        const urlInput = document.getElementById('seo-site-url');

        if (!titleInput) return;

        titleInput.addEventListener('input', () => {
            const val = titleInput.value || 'عنوان الصفحة';
            document.getElementById('preview-google-title').textContent = val;
            document.getElementById('preview-social-title').textContent = val;
            updateCharCount('seo-title-count', titleInput.value.length, 50, 60);
        });

        descInput.addEventListener('input', () => {
            const val = descInput.value || 'وصف الصفحة يظهر هنا...';
            document.getElementById('preview-google-desc').textContent = val;
            document.getElementById('preview-social-desc').textContent = val;
            updateCharCount('seo-desc-count', descInput.value.length, 120, 160);
        });

        imageInput.addEventListener('input', () => {
            const val = imageInput.value;
            const imgEl = document.getElementById('preview-social-image');
            if (val) {
                imgEl.src = val;
            }
        });

        urlInput.addEventListener('input', () => {
            const val = urlInput.value || 'zeronux.store';
            // Extract domain for preview
            let domain = val;
            try {
                domain = new URL(val).hostname;
            } catch (e) {
                domain = val.replace(/https?:\/\//, '').split('/')[0];
            }
            document.getElementById('preview-google-url').textContent = domain;
            document.getElementById('preview-social-site').textContent = domain;
        });
    }

    function updateCharCount(elementId, currentLen, goodMin, goodMax) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = `${currentLen} / ${goodMax} حرف (الأفضل ${goodMin}-${goodMax})`;
        el.className = 'seo-char-count';
        if (currentLen > goodMax) {
            el.classList.add('danger');
        } else if (currentLen >= goodMin) {
            el.classList.add(''); // perfect, default color
        } else {
            el.classList.add('warn');
        }
    }

    // ---- Save SEO Settings ----
    window.saveSeoSettings = function () {
        const db = firebase.database();
        const data = {
            metaTitle: document.getElementById('seo-meta-title').value.trim(),
            metaDescription: document.getElementById('seo-meta-desc').value.trim(),
            ogImage: document.getElementById('seo-og-image').value.trim(),
            siteUrl: document.getElementById('seo-site-url').value.trim(),
            robotsIndex: document.getElementById('seo-robots-index').checked,
            robotsFollow: document.getElementById('seo-robots-follow').checked,
            updatedAt: Date.now()
        };

        db.ref(SEO_REF_PATH).set(data)
            .then(() => {
                if (typeof showNotification === 'function') {
                    showNotification('تم حفظ إعدادات SEO بنجاح! 🌐');
                }
                if (window.adminLog) {
                    window.adminLog.custom('seo', '🌐', 'تم تحديث إعدادات SEO');
                }
            })
            .catch(err => {
                console.error('SEO save error:', err);
                if (typeof showAlertModal === 'function') {
                    showAlertModal('خطأ', 'فشل حفظ إعدادات SEO: ' + err.message, 'error');
                }
            });
    };

    // ---- Load SEO Settings ----
    function loadSeoSettings() {
        const db = firebase.database();
        db.ref(SEO_REF_PATH).once('value').then(snapshot => {
            const data = snapshot.val();
            if (!data) return;

            const titleInput = document.getElementById('seo-meta-title');
            const descInput = document.getElementById('seo-meta-desc');
            const imageInput = document.getElementById('seo-og-image');
            const urlInput = document.getElementById('seo-site-url');

            if (titleInput && data.metaTitle) titleInput.value = data.metaTitle;
            if (descInput && data.metaDescription) descInput.value = data.metaDescription;
            if (imageInput && data.ogImage) imageInput.value = data.ogImage;
            if (urlInput && data.siteUrl) urlInput.value = data.siteUrl;

            if (data.robotsIndex !== undefined) {
                document.getElementById('seo-robots-index').checked = data.robotsIndex;
            }
            if (data.robotsFollow !== undefined) {
                document.getElementById('seo-robots-follow').checked = data.robotsFollow;
            }

            // Trigger preview updates
            if (titleInput) titleInput.dispatchEvent(new Event('input'));
            if (descInput) descInput.dispatchEvent(new Event('input'));
            if (imageInput) imageInput.dispatchEvent(new Event('input'));
            if (urlInput) urlInput.dispatchEvent(new Event('input'));
        });
    }

    // ---- Init ----
    function init() {
        injectSeoTab();
        bindLivePreview();

        // Load settings when tab is clicked (old button)
        const tabBtn = document.getElementById('tab-btn-seo');
        let loaded = false;
        if (tabBtn) {
            tabBtn.addEventListener('click', () => {
                if (!loaded) {
                    loadSeoSettings();
                    loaded = true;
                }
            });
        }

        // New Sidebar / switchTab detection
        const checkTab = setInterval(() => {
            const tabPanel = document.getElementById('tab-seo');
            if (tabPanel) {
                clearInterval(checkTab);
                const observer = new MutationObserver(() => {
                    if (tabPanel.classList.contains('active')) {
                        if (!loaded) {
                            loadSeoSettings();
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
