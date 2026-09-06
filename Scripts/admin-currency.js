// ============================================
// ADMIN CURRENCY SWITCHER
// ============================================
(function () {
    'use strict';

    // State
    let currentCurrency = localStorage.getItem('adminCurrency') || 'USD';
    let observer;

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        .currency-switcher {
            display: flex;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 12px;
            padding: 3px;
            margin-right: 0;
            border: 1px solid rgba(255, 255, 255, 0.08);
            gap: 2px;
        }
        .currency-btn {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.45);
            padding: 6px 14px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
            font-weight: 500;
            letter-spacing: 0.3px;
            line-height: 1;
        }
        .currency-btn:hover {
            color: rgba(255, 255, 255, 0.8);
            background: rgba(255, 255, 255, 0.06);
        }
        .currency-btn.active {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.8));
            color: white;
            box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
            font-weight: 600;
        }
        .currency-code {
            font-weight: inherit;
        }
        @media (max-width: 768px) {
            .currency-switcher {
                padding: 2px;
            }
            .currency-btn {
                padding: 5px 10px;
                font-size: 0.75rem;
            }
            .currency-code {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);

    // Inject Switcher UI
    function injectSwitcher() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions || document.querySelector('.currency-switcher')) return;

        const switcher = document.createElement('div');
        switcher.className = 'currency-switcher';
        switcher.innerHTML = `
            <button class="currency-btn ${currentCurrency === 'USD' ? 'active' : ''}" data-currency="USD">
                <span>$</span> <span class="currency-code">USD</span>
            </button>
            <button class="currency-btn ${currentCurrency === 'LYD' ? 'active' : ''}" data-currency="LYD">
                <span>د.ل</span> <span class="currency-code">LYD</span>
            </button>
        `;

        // Insert before the first button/link
        headerActions.prepend(switcher);

        // Events
        switcher.querySelectorAll('.currency-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const currency = btn.dataset.currency;
                setCurrency(currency);
            });
        });
    }

    // Set Currency
    function setCurrency(currency) {
        currentCurrency = currency;
        localStorage.setItem('adminCurrency', currency);

        // Update Buttons
        document.querySelectorAll('.currency-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.currency === currency);
        });

        // Update Prices
        updateAllPrices();
    }

    // Update All Prices
    function updateAllPrices() {
        // Exchange Rate fallback
        const rate = window.exchangeRate || 9; // Default if not yet loaded

        // Disconnect observer to prevent infinite loop
        if (observer) observer.disconnect();

        document.querySelectorAll('[data-usd]').forEach(el => {
            const usdVal = parseFloat(el.getAttribute('data-usd'));
            if (isNaN(usdVal)) return;

            if (currentCurrency === 'USD') {
                el.innerHTML = `$${usdVal.toFixed(2)}`;
            } else {
                const lydVal = usdVal * rate;
                el.innerHTML = `${lydVal.toFixed(2)} د.ل`;
            }
        });

        // Reconnect observer
        const main = document.querySelector('.admin-main');
        if (main && observer) {
            observer.observe(main, { childList: true, subtree: true });
        }
    }

    // Observe DOM for new content
    observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach(mutation => {
            // Check if added nodes contain likely dynamic content
            if (mutation.addedNodes.length > 0) {
                shouldUpdate = true;
            }
        });

        if (shouldUpdate) {
            updateAllPrices();
        }
    });

    // Subtree observe the main area
    const main = document.querySelector('.admin-main');
    if (main) {
        observer.observe(main, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            const m = document.querySelector('.admin-main');
            if (m) observer.observe(m, { childList: true, subtree: true });
        });
    }

    // Listen for settings loaded from admin.js
    document.addEventListener('settings-loaded', updateAllPrices);

    // Init
    function init() {
        injectSwitcher();
        // Also listen for header rebuild
        document.addEventListener('admin-header-ready', injectSwitcher);

        // Give admin.js a moment to load settings, then update initial prices
        setTimeout(updateAllPrices, 500);
        setTimeout(updateAllPrices, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
