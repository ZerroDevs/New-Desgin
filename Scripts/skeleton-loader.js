// ============================================
// SKELETON LOADER — Animated Loading Placeholders
// ============================================

(function () {
    let stylesInjected = false;

    function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;

        const style = document.createElement('style');
        style.id = 'skeleton-loader-styles';
        style.textContent = `
            /* Shimmer animation */
            @keyframes skeleton-shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            .skeleton-bone {
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.03) 25%,
                    rgba(255, 255, 255, 0.08) 50%,
                    rgba(255, 255, 255, 0.03) 75%
                );
                background-size: 200% 100%;
                animation: skeleton-shimmer 1.8s ease-in-out infinite;
                border-radius: 8px;
            }

            /* ---- Product Skeleton Card ---- */
            .skeleton-product-card {
                background: var(--bg-card, rgba(255,255,255,0.03));
                border: 1px solid var(--border-color, rgba(255,255,255,0.06));
                border-radius: var(--radius-lg, 16px);
                overflow: hidden;
                animation: skeleton-fade-in 0.4s ease-out both;
            }

            .skeleton-product-image {
                aspect-ratio: 1;
                background: linear-gradient(
                    135deg,
                    rgba(102, 126, 234, 0.06) 0%,
                    rgba(118, 75, 162, 0.06) 100%
                );
            }
            .skeleton-product-image .skeleton-bone {
                width: 100%;
                height: 100%;
                border-radius: 0;
            }

            .skeleton-product-info {
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
            }

            .skeleton-product-title {
                height: 18px;
                width: 75%;
            }

            .skeleton-product-desc {
                height: 14px;
                width: 90%;
            }

            .skeleton-product-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 0.5rem;
            }

            .skeleton-product-price {
                height: 20px;
                width: 70px;
            }

            .skeleton-product-btn {
                height: 36px;
                width: 100px;
                border-radius: 10px;
            }

            /* ---- Book Skeleton Card ---- */
            .skeleton-book-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 18px;
                overflow: hidden;
                animation: skeleton-fade-in 0.4s ease-out both;
            }

            .skeleton-book-image {
                width: 100%;
                height: 220px;
                background: rgba(0, 0, 0, 0.2);
            }
            .skeleton-book-image .skeleton-bone {
                width: 100%;
                height: 100%;
                border-radius: 0;
            }

            .skeleton-book-info {
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 0.6rem;
            }

            .skeleton-book-title {
                height: 18px;
                width: 65%;
            }

            .skeleton-book-price {
                height: 20px;
                width: 80px;
            }

            .skeleton-book-btn {
                height: 42px;
                width: 100%;
                border-radius: 12px;
                margin-top: 0.25rem;
            }

            /* Staggered entrance */
            @keyframes skeleton-fade-in {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .skeleton-product-card:nth-child(1),
            .skeleton-book-card:nth-child(1) { animation-delay: 0s; }
            .skeleton-product-card:nth-child(2),
            .skeleton-book-card:nth-child(2) { animation-delay: 0.07s; }
            .skeleton-product-card:nth-child(3),
            .skeleton-book-card:nth-child(3) { animation-delay: 0.14s; }
            .skeleton-product-card:nth-child(4),
            .skeleton-book-card:nth-child(4) { animation-delay: 0.21s; }
            .skeleton-product-card:nth-child(5),
            .skeleton-book-card:nth-child(5) { animation-delay: 0.28s; }
            .skeleton-product-card:nth-child(6),
            .skeleton-book-card:nth-child(6) { animation-delay: 0.35s; }

            /* Responsive book skeleton image */
            @media (max-width: 768px) {
                .skeleton-book-image {
                    height: 180px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ---- Product Skeletons ----
    window.showProductSkeletons = function (containerId, count) {
        injectStyles();
        const container = document.getElementById(containerId);
        if (!container) return;

        count = count || 6;
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-product-card">
                    <div class="skeleton-product-image">
                        <div class="skeleton-bone"></div>
                    </div>
                    <div class="skeleton-product-info">
                        <div class="skeleton-bone skeleton-product-title"></div>
                        <div class="skeleton-bone skeleton-product-desc"></div>
                        <div class="skeleton-product-footer">
                            <div class="skeleton-bone skeleton-product-price"></div>
                            <div class="skeleton-bone skeleton-product-btn"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    };

    // ---- Book Skeletons ----
    window.showBookSkeletons = function (containerId, count) {
        injectStyles();
        const container = document.getElementById(containerId);
        if (!container) return;

        count = count || 4;
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-book-card">
                    <div class="skeleton-book-image">
                        <div class="skeleton-bone"></div>
                    </div>
                    <div class="skeleton-book-info">
                        <div class="skeleton-bone skeleton-book-title"></div>
                        <div class="skeleton-bone skeleton-book-price"></div>
                        <div class="skeleton-bone skeleton-book-btn"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    };
})();
