// ============================================
// CART FUNCTIONALITY
// ============================================

let cart = [];

// Global Discount State
let activeDiscount = null; // { code: 'ZERO10', value: 10, id: 'firebase_id' }

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartCount();
        } catch (e) {
            console.error('Error loading cart:', e);
            cart = [];
        }
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

// Initialize cart on load
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    initCartButton();
    initAddToCartButtons(); // Need to call this here or expose/call it from app.js if elements are dynamic
});

function updateCartCount() {
    // Requires header to be loaded, but loadCart might run before header. 
    // Usually header.js inserts header, then app/cart runs.
    const cartBtn = document.querySelector('.cart-btn');
    if (!cartBtn) return;

    let badge = cartBtn.querySelector('.cart-count');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-count';
        Object.assign(badge.style, {
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700'
        });
        cartBtn.style.position = 'relative';
        cartBtn.appendChild(badge);
    }

    // Sum all quantities
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';

    // Also update mobile nav badge if exists
    const mobileBadge = document.querySelector('.mobile-nav-item #mobile-nav-cart .cart-count-badge');
    if (mobileBadge) {
        mobileBadge.textContent = totalItems > 0 ? totalItems : 0;
        mobileBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Add to cart function (Enhanced to handle both simple and detailed additions)
window.addToCart = function (productName, price, image, description, productId) {
    // If called with just name and price (old calls), handle gracefully
    if (arguments.length === 2) {
        // Try to find more info or use defaults
        // For now, push with defaults
        cart.push({ name: productName, price: price, quantity: 1 });
        saveCart();
        updateCartCount();
        showNotification(`${productName} تمت إضافته للسلة 🛒`);
        return;
    }

    // Check if item already exists in cart by ID if available, or name
    let existingItem = null;
    if (productId) {
        existingItem = cart.find(item => item.id === productId);
    } else {
        existingItem = cart.find(item => item.name === productName);
    }

    if (existingItem) {
        // Increase quantity if already in cart
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        showNotification(`تم زيادة الكمية: ${productName} (${existingItem.quantity}) 🛒`);
    } else {
        // Add new item with quantity 1
        cart.push({
            id: productId || null,
            name: productName,
            price: price,
            image: image || 'https://via.placeholder.com/100',
            description: description || '',
            quantity: 1
        });
        showNotification(`تمت إضافة ${productName} إلى السلة! 🛒`);
    }

    saveCart();
    updateCartCount();
}

// Update item quantity in cart
function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
            updateCartCount();
        }
    }
}

// Increase quantity
function increaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = (item.quantity || 1) + 1;
        saveCart();
        updateCartCount();
        // Refresh cart modal
        refreshCartModal();
    }
}

// Decrease quantity
function decreaseQuantity(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (item.quantity <= 1) {
            removeFromCart(productId);
        } else {
            item.quantity--;
            saveCart();
            updateCartCount();
            refreshCartModal();
        }
    }
}

// Remove item from cart
function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index > -1) {
        const itemName = cart[index].name;
        cart.splice(index, 1);
        saveCart();
        updateCartCount();
        showNotification(`تمت إزالة ${itemName} من السلة`);
        refreshCartModal();
    }
}

// Refresh cart modal (if open)
function refreshCartModal() {
    const existingModal = document.querySelector('.cart-modal-overlay');
    if (existingModal) {
        existingModal.remove();
        if (cart.length > 0) {
            showCartModal();
        } else {
            // If empty, showEmpty or close? showCartModal handles empty state
            showCartModal();
        }
    }
}

// Initialize cart button
function initCartButton() {
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        // Clone to remove old listeners if any
        const newBtn = cartBtn.cloneNode(true);
        cartBtn.parentNode.replaceChild(newBtn, cartBtn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showCartModal();
        });

        // Mobile nav cart
        const mobileCart = document.querySelector('#mobile-nav-cart');
        if (mobileCart) {
            const newMobileCart = mobileCart.cloneNode(true);
            mobileCart.parentNode.replaceChild(newMobileCart, mobileCart);
            newMobileCart.addEventListener('click', (e) => {
                e.preventDefault();
                showCartModal();
            });
        }
    }

    updateCartCount();
}

// Initialize add to cart buttons
window.initAddToCartButtons = function () {
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        if (btn.dataset.cartInitialized === 'true') return;
        btn.dataset.cartInitialized = 'true';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const productId = btn.dataset.productId;
            if (productId) {
                const productName = btn.dataset.productName || 'منتج';
                const productPrice = parseFloat(btn.dataset.productPrice) || 0;
                const image = btn.dataset.productImage || 'Images/Logo-noBG.png';
                const description = btn.dataset.productDesc || '';

                addToCart(productName, productPrice, image, description, productId);
            } else {
                const productCard = btn.closest('.product-card');
                if (productCard) {
                    const nameEl = productCard.querySelector('.product-name');
                    const priceEl = productCard.querySelector('.product-price');
                    const imgEl = productCard.querySelector('img');
                    const descEl = productCard.querySelector('.product-description');

                    const productName = nameEl ? nameEl.textContent.trim() : 'منتج';
                    const rawPrice = priceEl ? (priceEl.dataset.usd || priceEl.textContent) : '0';
                    const usdPrice = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
                    const cardImg = imgEl ? imgEl.src : 'Images/Logo-noBG.png';
                    const cardDesc = descEl ? descEl.textContent.trim() : '';

                    addToCart(productName, usdPrice, cardImg, cardDesc, 'p_' + Date.now());
                }
            }

            btn.classList.add('added');
            setTimeout(() => {
                btn.classList.remove('added');
            }, 1000);
        });
    });
};

// Cart modal
function showCartModal() {
    // Prevent multiple instances
    const existing = document.querySelector('.cart-modal-overlay');
    if (existing) existing.remove();

    ensureCartStyles();

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'cart-modal-overlay';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'cart-modal';

    let contentHTML = '';

    if (cart.length === 0) {
        contentHTML = `
            <div class="cart-modal-header">
                <h2>🛒 سلة المشتريات</h2>
                <button class="close-modal-btn" aria-label="إغلاق">&times;</button>
            </div>
            <div class="empty-cart" style="text-align: center; padding: 3rem 1rem;">
                <div style="font-size: 4.5rem; margin-bottom: 1.25rem; animation: float 3s ease-in-out infinite; filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.35));">🛒</div>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">السلة فارغة حالياً</h3>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6;">لم تقم بإضافة أي منتجات بعد.<br>تصفح المتجر واكتشف تشكيلاتنا وعروضنا الحصرية!</p>
                <button class="btn btn-primary" onclick="document.querySelector('.cart-modal-overlay').remove()" style="padding: 12px 32px; border-radius: 50px; background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4); font-weight: 600;">
                    تصفح التشكيلات 🛍️
                </button>
            </div>
        `;
    } else {
        let cartHTML = '';
        const currentCurrency = window.currentCurrency || 'USD';
        const EXCHANGE_RATE = window.EXCHANGE_RATE || 1;

        cart.forEach((item, index) => {
            const itemPriceUSD = item.price || 0;
            const itemPriceDisplay = currentCurrency === 'USD' ? itemPriceUSD : (itemPriceUSD * EXCHANGE_RATE);
            const itemQuantity = item.quantity || 1;
            const itemSubtotal = itemPriceDisplay * itemQuantity;

            cartHTML += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || 'Images/Logo-noBG.png'}" alt="${item.name}" onerror="this.src='Images/Logo-noBG.png'">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        ${item.description ? `<div class="cart-item-desc">${item.description}</div>` : ''}
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
                            <div class="cart-item-price">${formatCurrency(itemPriceDisplay, currentCurrency)}</div>
                            <div class="quantity-controls">
                                <button class="qty-btn qty-decrease" data-product-id="${item.id}">−</button>
                                <span class="qty-value">${itemQuantity}</span>
                                <button class="qty-btn qty-increase" data-product-id="${item.id}">+</button>
                            </div>
                        </div>
                        <div class="cart-item-subtotal">
                            المجموع: <strong>${formatCurrency(itemSubtotal, currentCurrency)}</strong>
                        </div>
                    </div>
                    <button class="remove-item-btn" data-index="${index}" title="حذف من السلة">✕</button>
                </div>
            `;
        });

        const totalUSD = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        const totalCurrent = currentCurrency === 'USD' ? totalUSD : (totalUSD * EXCHANGE_RATE);
        const displayTotal = activeDiscount ? (totalCurrent * (1 - activeDiscount.value / 100)) : totalCurrent;
        const totalFormatted = formatCurrency(totalCurrent, currentCurrency);
        const displayTotalFormatted = formatCurrency(displayTotal, currentCurrency);

        let priceHtml = `<div class="cart-total-value">${displayTotalFormatted}</div>`;
        if (activeDiscount) {
            priceHtml = `
                <div class="cart-total-value" style="display:flex; flex-direction:column; align-items:flex-end;">
                    <span style="text-decoration:line-through; font-size:0.9rem; opacity:0.6;">${totalFormatted}</span>
                    <span style="color:#38bdf8;">${displayTotalFormatted} (${activeDiscount.code})</span>
                </div>
            `;
        }

        contentHTML = `
            <div class="cart-modal-header">
                <h2>🛒 سلة المشتريات</h2>
                <button class="close-modal-btn" aria-label="إغلاق">&times;</button>
            </div>

            <div class="cart-items">
                ${cartHTML}
            </div>

            <!-- Promo Code Section -->
            <div class="promo-section">
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="cart-promo-input" placeholder="هل لديك كود خصم؟" style="flex:1; padding:10px 14px; border-radius:10px; border:1px solid rgba(56,189,248,0.25); background:rgba(15,23,42,0.8); color:white; font-size:0.9rem; outline:none;">
                    <button onclick="applyPromoCode()" style="padding:0 22px; background:linear-gradient(135deg, #0284c7, #0ea5e9); border:none; border-radius:10px; color:white; font-weight:700; cursor:pointer; font-size:0.9rem;">تطبيق</button>
                </div>
                <div id="promo-message" style="margin-top:6px; font-size:0.85rem;"></div>
            </div>

            <div class="cart-total">
                <span>المجموع الإجمالي:</span>
                ${priceHtml}
            </div>

            <div class="customer-info-section" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.65rem;">
                <div>
                    <label style="display:block; font-size:0.82rem; color:#94a3b8; margin-bottom:4px; font-weight:600;">الاسم الكامل <span style="color:#ef4444;">*</span></label>
                    <input type="text" id="customer-name" placeholder="أدخل اسمك الكامل" required
                           style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(56,189,248,0.25); background: rgba(15,23,42,0.85); color: white; font-size: 0.95rem; outline: none; box-sizing: border-box; transition: border-color 0.2s;">
                </div>

                <div>
                    <label style="display:block; font-size:0.82rem; color:#94a3b8; margin-bottom:4px; font-weight:600;">رقم الهاتف <span style="color:#ef4444;">*</span></label>
                    <input type="tel" id="customer-phone" placeholder="مثال: 0912345678" required
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')" 
                           inputmode="numeric"
                           style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(56,189,248,0.25); background: rgba(15,23,42,0.85); color: white; font-size: 0.95rem; outline: none; box-sizing: border-box; transition: border-color 0.2s;">
                </div>

                <div>
                    <label style="display:block; font-size:0.82rem; color:#94a3b8; margin-bottom:4px; font-weight:600;">عنوان وتفاصيل التوصيل <span style="color:#ef4444;">*</span></label>
                    <input type="text" id="customer-address" placeholder="مثال: طرابلس - النوفليين بالقرب من..." required
                           style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(56,189,248,0.25); background: rgba(15,23,42,0.85); color: white; font-size: 0.95rem; outline: none; box-sizing: border-box; transition: border-color 0.2s;">
                </div>
                <small style="color: rgba(148, 163, 184, 0.7); font-size: 0.78rem;">* جميع الحقول إجبارية لتأكيد الطلب وشحنه عبر الواتساب فوراً</small>
            </div>

            <div class="cart-actions">
                <button class="btn btn-secondary clear-cart-btn">مسح السلة</button>
                <button class="btn btn-primary" onclick="completeOrder()" style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);">إتمام الطلب (واتساب) 💬</button>
            </div>
        `;
    }

    modal.innerHTML = contentHTML;

    // Attach Listeners
    setTimeout(() => {
        // Pre-fill input
        if (activeDiscount && document.getElementById('cart-promo-input')) {
            const input = document.getElementById('cart-promo-input');
            input.value = activeDiscount.code;
            input.disabled = true;
            const msg = document.getElementById('promo-message');
            if (msg) {
                msg.textContent = `تم تطبيق خصم ${activeDiscount.value}% بنجاح! ✅`;
                msg.style.color = '#38bdf8';
            }
        }

        // Close
        const clsBtn = modal.querySelector('.close-modal-btn');
        if (clsBtn) clsBtn.addEventListener('click', () => document.querySelector('.cart-modal-overlay').remove());

        // Quantity Controls
        const increaseButtons = modal.querySelectorAll('.qty-increase');
        increaseButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                increaseQuantity(productId);
            });
        });

        const decreaseButtons = modal.querySelectorAll('.qty-decrease');
        decreaseButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.productId;
                decreaseQuantity(productId);
            });
        });

        // Remove item buttons
        const removeButtons = modal.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                // Need to get ID correctly. cart[index].id
                const productId = cart[index].id;
                removeFromCart(productId);
            });
        });

        // Clear Cart
        const clrBtn = modal.querySelector('.clear-cart-btn');
        if (clrBtn) {
            clrBtn.addEventListener('click', () => {
                cart = [];
                saveCart();
                updateCartCount();
                activeDiscount = null; // Reset discount on clear
                document.querySelector('.cart-modal-overlay').remove();
                showNotification('تم مسح السلة بنجاح');
            });
        }
    }, 0);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Call dynamic styles if not present (app.js usually does this, but we should ensure cart CSS exists)
    // We already copied styles into the modal logic in app.js, so we might need them here or ensure they are global.
    // Ideally, we move CSS to a CSS file. For now, inject styles if missing.
    ensureCartStyles();

    // Close modal handlers
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function ensureCartStyles() {
    if (document.getElementById('cart-dynamic-styles')) return;

    const style = document.createElement('style');
    style.id = 'cart-dynamic-styles';
    style.textContent = `
        @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(25px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        .cart-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(3, 7, 18, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: fadeIn 0.25s ease-out;
            box-sizing: border-box;
        }
        .cart-modal {
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(7, 11, 20, 0.98));
            border: 1px solid rgba(56, 189, 248, 0.25);
            border-radius: 20px;
            padding: 1.5rem;
            width: 100%;
            max-width: 500px;
            max-height: 88vh;
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(14, 165, 233, 0.2);
            animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            direction: rtl;
            color: #fff;
            box-sizing: border-box;
            position: relative;
        }
        .cart-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.25rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(56, 189, 248, 0.15);
        }
        .cart-modal-header h2 {
            margin: 0;
            font-size: 1.35rem;
            font-weight: 700;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .close-modal-btn {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
            font-size: 1.4rem;
            cursor: pointer;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
            line-height: 1;
            padding: 0;
        }
        .close-modal-btn:hover {
            background: rgba(255, 59, 48, 0.2);
            border-color: rgba(255, 59, 48, 0.4);
            color: #ff4d4d;
            transform: rotate(90deg);
        }
        .cart-items {
            max-height: 320px;
            overflow-y: auto;
            padding-left: 4px;
            margin-bottom: 1rem;
        }
        .cart-item { 
            display: flex;
            align-items: center;
            gap: 0.85rem;
            padding: 0.85rem;
            background: rgba(15, 23, 42, 0.75); 
            border: 1px solid rgba(56, 189, 248, 0.15);
            border-radius: 14px;
            margin-bottom: 0.75rem;
            position: relative; 
            transition: all 0.2s ease;
        }
        .cart-item:hover {
            background: rgba(14, 165, 233, 0.08);
            border-color: rgba(56, 189, 248, 0.35);
        }
        .cart-item-image { 
            width: 65px;
            height: 65px;
            flex-shrink: 0;
            border-radius: 10px; 
            overflow: hidden;
            background: rgba(255,255,255,0.04); 
            border: 1px solid rgba(255,255,255,0.08);
        }
        .cart-item-image img { width: 100%; height: 100%; object-fit: contain; }
        .cart-item-details { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .cart-item-name {
            font-weight: 700;
            font-size: 0.95rem;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .cart-item-desc {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .cart-item-price { 
            color: #38bdf8;
            font-weight: 700;
            font-size: 0.95rem; 
            background: rgba(14, 165, 233, 0.15);
            padding: 2px 8px; 
            border-radius: 6px;
            border: 1px solid rgba(56, 189, 248, 0.25);
            display: inline-block;
        }
        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 2px 4px;
        }
        .qty-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            transition: all 0.15s;
        }
        .qty-btn:hover { background: rgba(56, 189, 248, 0.3); color: #38bdf8; }
        .qty-value { font-weight: 700; font-size: 0.85rem; min-width: 18px; text-align: center; }
        .cart-item-subtotal { font-size: 0.8rem; color: rgba(255,255,255,0.6); }
        .cart-item-subtotal strong { color: #38bdf8; }

        .remove-item-btn { 
            width: 28px;
            height: 28px;
            border-radius: 8px; 
            background: rgba(255, 59, 48, 0.12);
            color: #ff4d4d;
            border: 1px solid rgba(255, 59, 48, 0.25); 
            display: flex;
            align-items: center;
            justify-content: center; 
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }
        .remove-item-btn:hover {
            background: #ff3b30;
            color: white;
            border-color: #ff3b30;
            transform: scale(1.05);
        }
        
        .promo-section {
            margin-top: 1rem;
            border-top: 1px solid rgba(56, 189, 248, 0.15);
            padding-top: 1rem;
        }

        .cart-total {
            background: rgba(11, 19, 43, 0.85);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            margin-top: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid rgba(56, 189, 248, 0.2);
        }
        .cart-total span:first-child { font-size: 1rem; color: rgba(255,255,255,0.8); }
        .cart-total-value { font-size: 1.4rem; font-weight: 800; color: #38bdf8; text-shadow: 0 0 20px rgba(14, 165, 233, 0.4); }

        .cart-actions {
            display: flex;
            gap: 10px;
            margin-top: 1.25rem;
        }
        .cart-actions .btn {
            flex: 1;
            padding: 12px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .clear-cart-btn {
            background: rgba(255, 255, 255, 0.08) !important;
            color: rgba(255, 255, 255, 0.7) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        .clear-cart-btn:hover {
            background: rgba(255, 59, 48, 0.15) !important;
            color: #ff4d4d !important;
            border-color: rgba(255, 59, 48, 0.3) !important;
        }

        /* Scrollbar */
        .cart-modal::-webkit-scrollbar, .cart-items::-webkit-scrollbar { width: 5px; }
        .cart-modal::-webkit-scrollbar-track, .cart-items::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .cart-modal::-webkit-scrollbar-thumb, .cart-items::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.2); border-radius: 10px; }
        .cart-modal::-webkit-scrollbar-thumb:hover, .cart-items::-webkit-scrollbar-thumb:hover { background: rgba(56, 189, 248, 0.4); }

        @media (max-width: 576px) {
            .cart-modal {
                padding: 1.25rem 1rem;
                max-height: 90vh;
                border-radius: 16px;
            }
            .cart-item {
                padding: 0.75rem 0.6rem;
                gap: 0.65rem;
            }
            .cart-item-image {
                width: 52px;
                height: 52px;
            }
            .cart-actions {
                flex-direction: column-reverse;
            }
        }
    `;
    document.head.appendChild(style);
}

// Apply Promo Code Logic
window.applyPromoCode = function () {
    const code = document.getElementById('cart-promo-input').value.toUpperCase().trim();
    const msg = document.getElementById('promo-message');

    if (!code) return;

    msg.textContent = 'جاري التحقق...';
    msg.style.color = 'white';

    // Verify with Firebase
    firebase.database().ref('promos').orderByChild('code').equalTo(code).once('value')
        .then(snapshot => {
            const val = snapshot.val();
            if (!val) {
                msg.textContent = 'الكود غير صحيح ❌';
                msg.style.color = '#ff7675';
                activeDiscount = null;
                return;
            }

            const id = Object.keys(val)[0];
            const promo = val[id];

            if (promo.expiryDate && Date.now() > promo.expiryDate) {
                msg.textContent = 'عذراً، انتهت صلاحية هذا الكوبون ⌛';
                msg.style.color = '#ff7675';
                activeDiscount = null;
                return;
            }

            if (promo.maxUses && promo.usedCount >= promo.maxUses) {
                msg.textContent = 'عذراً، وصل الكوبون للحد الأقصى من الاستخدام 🚫';
                msg.style.color = '#ff7675';
                activeDiscount = null;
                return;
            }

            activeDiscount = {
                id: id,
                code: promo.code,
                value: promo.discount
            };

            msg.textContent = `تم تطبيق خصم ${promo.discount}%! 🎉`;
            msg.style.color = '#00b894';

            // Refresh Modal
            const existing = document.querySelector('.cart-modal-overlay');
            if (existing) {
                existing.remove();
                showCartModal();
            }

        })
        .catch(err => {
            console.error(err);
            msg.textContent = 'حدث خطأ أثناء التحقق';
        });
};

// Complete Order (WhatsApp)
window.completeOrder = function () {
    if (cart.length === 0) return;

    // Priority: Window Global > LocalStorage > Default USD
    // We check LocalStorage specifically because header.js updates it reliably
    const currentCurrency = window.currentCurrency || localStorage.getItem('selectedCurrency') || 'USD';
    const EXCHANGE_RATE = window.EXCHANGE_RATE || 1;

    // Calculate total in BASE USD first (with quantities)
    const totalUSD = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // Then convert to current currency for final order processing
    const total = currentCurrency === 'USD' ? totalUSD : (totalUSD * EXCHANGE_RATE);

    const finalTotal = activeDiscount ? (total * (1 - activeDiscount.value / 100)) : total;

    const totalFormatted = formatCurrency(finalTotal, currentCurrency);

    // Generate unique Order ID
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderId = `ORDER_${dateStr}_${randomNum}`;

    // Get customer info
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');

    const customerName = nameInput ? nameInput.value.trim() : '';
    const customerPhone = phoneInput ? phoneInput.value.trim() : '';
    const customerAddress = addressInput ? addressInput.value.trim() : '';

    // Reset styles
    [nameInput, phoneInput, addressInput].forEach(input => {
        if (input) input.style.borderColor = 'rgba(56,189,248,0.25)';
    });

    // Validation: Name, Phone, and Address are required
    const missingFields = [];
    if (!customerName) {
        missingFields.push('الاسم الكامل');
        if (nameInput) nameInput.style.borderColor = '#ef4444';
    }
    if (!customerPhone) {
        missingFields.push('رقم الهاتف');
        if (phoneInput) phoneInput.style.borderColor = '#ef4444';
    }
    if (!customerAddress) {
        missingFields.push('عنوان التوصيل');
        if (addressInput) addressInput.style.borderColor = '#ef4444';
    }

    if (missingFields.length > 0) {
        const errorMsg = `يرجى إدخال الحقول المطلوبة: ${missingFields.join('، ')} ⚠️`;
        if (typeof showNotification === 'function') {
            showNotification(errorMsg, 'warning');
        } else {
            alert(errorMsg);
        }
        if (!customerName && nameInput) nameInput.focus();
        else if (!customerPhone && phoneInput) phoneInput.focus();
        else if (!customerAddress && addressInput) addressInput.focus();
        return;
    }

    // Get User ID if logged in
    const user = firebase.auth().currentUser;
    const userId = user ? user.uid : (localStorage.getItem('support_visitor_id') || 'guest');

    // Prepare order data for Firebase
    const orderData = {
        orderId: orderId,
        userId: userId,
        currency: currentCurrency,
        items: cart.map(item => {
            const itemPrice = currentCurrency === 'USD' ? item.price : (item.price * EXCHANGE_RATE);
            return {
                name: item.name,
                price: itemPrice,
                quantity: item.quantity || 1,
                image: item.image || ''
            };
        }),
        total: total,
        finalTotal: finalTotal,
        discount: activeDiscount ? {
            code: activeDiscount.code,
            value: activeDiscount.value
        } : null,
        status: 'pending',
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        timestamp: timestamp,
        lastUpdated: timestamp
    };

    // Save to Firebase
    firebase.database().ref('orders').child(orderId).set(orderData)
        .then(() => {
            console.log('Order saved successfully:', orderId);
        })
        .catch(error => {
            console.error('Error saving order:', error);
        });

    // Build WhatsApp message
    let message = `مرحباً، أود إتمام طلب جديد من متجر *New Desgin* 🛍️\n\n`;
    message += `📋 *رقم الطلب:* ${orderId}\n`;
    message += `👤 *الاسم:* ${customerName}\n`;
    message += `📱 *رقم الهاتف:* ${customerPhone}\n`;
    message += `📍 *عنوان التوصيل:* ${customerAddress}\n\n`;
    message += `🛒 *المنتجات المطلوبة:*\n`;
    message += `──────────────────────\n`;

    cart.forEach((item, idx) => {
        const itemPrice = currentCurrency === 'USD' ? item.price : (item.price * EXCHANGE_RATE);
        const itemQty = item.quantity || 1;
        const itemSubtotal = itemPrice * itemQty;
        message += `${idx + 1}. *${item.name}*\n`;
        message += `   • الكمية: *${itemQty}*\n`;
        message += `   • السعر: ${formatCurrency(itemSubtotal, currentCurrency)}\n\n`;
    });

    message += `──────────────────────\n`;
    if (activeDiscount) {
        message += `🎟️ *كود الخصم:* ${activeDiscount.code} (${activeDiscount.value}%)\n`;
        message += `💰 *المجموع قبل الخصم:* ${formatCurrency(total, currentCurrency)}\n`;
    }

    message += `💵 *المجموع الإجمالي:* *${totalFormatted}*\n`;
    message += `🚚 *طريقة الدفع:* كاش عند الاستلام / حوالة\n\n`;
    message += `يرجى تأكيد استلام الطلب وبدء التجهيز. شكراً جزيلاً! ✨`;

    // Increment Promo Usage if used
    if (activeDiscount) {
        const promoRef = firebase.database().ref('promos').child(activeDiscount.id);
        promoRef.child('usedCount').transaction(current => (current || 0) + 1);
    }

    // Reduce stock
    cart.forEach(item => {
        if (item.id) {
            const productRef = firebase.database().ref('products').child(item.id);
            productRef.once('value', (snapshot) => {
                const product = snapshot.val();
                if (product && product.trackStock && product.stock > 0) {
                    const qtyToReduce = item.quantity || 1;
                    productRef.update({
                        stock: Math.max(0, product.stock - qtyToReduce)
                    });
                }
            });
        }
    });

    // Send to Discord
    sendToDiscord(orderData);

    // Fetch store WhatsApp Phone
    let storePhone = '218916808225';
    if (firebase.database) {
        firebase.database().ref('settings/phone').once('value', snap => {
            if (snap.exists() && snap.val()) {
                storePhone = String(snap.val()).replace(/[^0-9]/g, '');
            }
            openWhatsAppAndFinish(storePhone, message, orderId);
        }).catch(() => {
            openWhatsAppAndFinish(storePhone, message, orderId);
        });
    } else {
        openWhatsAppAndFinish(storePhone, message, orderId);
    }
}

function openWhatsAppAndFinish(phone, message, orderId) {
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(waUrl, '_blank');

    activeDiscount = null;
    cart = [];
    saveCart();
    updateCartCount();

    const overlay = document.querySelector('.cart-modal-overlay');
    if (overlay) overlay.remove();

    if (typeof showNotification === 'function') {
        showNotification('تم إرسال الطلب، جارِ نقلك للمحادثة عبر الواتساب... 💬', 'success');
    }

    // Redirect to success page
    setTimeout(() => {
        window.location.href = `success.html?orderId=${orderId}`;
    }, 1200);
}

// Send Order to Discord Webhook
function sendToDiscord(order) {
    const webhookURL = 'https://discord.com/api/webhooks/1468393122735067360/1vk_PLkUv4pdD4ofsxS6xGASp7Zp2DFw_ZkeSMYzoETu4duI-Hl63-iw5rFPRCYF4cDY';

    const itemsDescription = order.items.map(item => {
        const price = order.currency === 'LYD' ? `${item.price.toFixed(2)} د.ل` : `$${item.price.toFixed(2)}`;
        return `• **${item.name}** - ${price}`;
    }).join('\n');

    const totalDisplay = order.currency === 'LYD' ? `${order.total.toFixed(2)} د.ل` : `$${order.total.toFixed(2)}`;
    const finalTotalDisplay = order.currency === 'LYD' ? `${order.finalTotal.toFixed(2)} د.ل` : `$${order.finalTotal.toFixed(2)}`;

    const fields = [
        { name: '💰 المبلغ الإجمالي', value: finalTotalDisplay, inline: true },
        { name: '📦 عدد المنتجات', value: order.items.length.toString(), inline: true },
        { name: '🕒 الحالة', value: 'قيد الانتظار (Pending)', inline: true }
    ];

    if (order.discount) {
        fields.push({ name: '🎟️ كود الخصم', value: `${order.discount.code} (-${order.discount.value}%)`, inline: true });
    }

    if (order.customerPhone) {
        fields.push({ name: '📞 رقم الهاتف', value: order.customerPhone, inline: true });
    }

    const payload = {
        embeds: [{
            title: `🛒 طلب جديد: ${order.orderId}`,
            color: 6719210,
            description: itemsDescription,
            fields: fields,
            footer: {
                text: `ZeroNux Store • ${new Date(order.timestamp).toLocaleString('ar-EG')}`
            },
            timestamp: new Date().toISOString()
        }]
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(response => {
        if (response.ok) console.log('Discord webhook sent successfully');
        else console.error('Discord webhook failed', response.statusText);
    }).catch(error => {
        console.error('Discord webhook error:', error);
    });
}
