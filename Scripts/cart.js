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
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
        // Use a flag to prevent multiple bindings if called multiple times?
        // Better: use event delegation or removeListener. For simplicity, we assume this runs once per page load/render.
        // Actually app.js calls this. We should replace the old one.

        // Remove old listener effectively by cloning
        // But cloning might break other things attached. 
        // Let's rely on app.js NOT calling it if we remove it from there.

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Get data from dataset
            const productId = btn.dataset.productId;

            // If it's a card button without direct data (like in index.html static cards), we might need to parse DOM.
            // But checking index.html, the cards have data attributes or structure.

            if (productId) {
                // Configured button
                const productName = btn.dataset.productName;
                const productPrice = parseFloat(btn.dataset.productPrice);
                const image = btn.dataset.productImage;
                const description = btn.dataset.productDesc;

                addToCart(productName, productPrice, image, description, productId);
            } else {
                // Fallback for static cards in index.html if they don't have dataset
                const productCard = btn.closest('.product-card');
                if (productCard) {
                    const productName = productCard.querySelector('.product-name').textContent;
                    const priceElement = productCard.querySelector('.product-price');
                    const usdPrice = parseFloat(priceElement.dataset.usd);
                    // Warning: EXCHANGE_RATE is in app.js. access via window or pass it?
                    // We need EXCHANGE_RATE. It's global in app.js. 
                    // To be safe, we should probably move EXCHANGE_RATE to a shared config or just rely on it being global (window.EXCHANGE_RATE)
                    const pPrice = window.EXCHANGE_RATE ? usdPrice : usdPrice; // If exchanged logic is needed. 
                    // app.js logic was: const price = currentCurrency === 'USD' ? usdPrice : usdPrice * EXCHANGE_RATE;
                    // BUT addToCart stores BASE PRICE usually? 
                    // Looking at app.js: "ALWAYS store the base USD price in the cart."

                    addToCart(productName, usdPrice,
                        productCard.querySelector('img').src,
                        productCard.querySelector('.product-description').textContent,
                        'static-' + Date.now()); // Generate ID for static items
                }
            }

            // Animation for button
            btn.classList.add('added');
            setTimeout(() => {
                btn.classList.remove('added');
            }, 1000);
        };
    });
}


// Cart modal
function showCartModal() {
    // Prevent multiple instances
    const existing = document.querySelector('.cart-modal-overlay');
    if (existing) existing.remove();

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'cart-modal-overlay';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'cart-modal';

    // Add styles (moved from app.js)
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease-out'
    });

    Object.assign(modal.style, {
        background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.98))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2rem',
        maxWidth: '480px',
        width: '95%',
        maxHeight: '85vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(102, 126, 234, 0.15)',
        backdropFilter: 'blur(12px)',
        webkitBackdropFilter: 'blur(12px)',
        animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        direction: 'rtl',
        color: '#fff'
    });

    let contentHTML = '';

    if (cart.length === 0) {
        contentHTML = `
            <span class="close-modal-btn">&times;</span>
            <div class="empty-cart" style="text-align: center; padding: 4rem 1rem;">
                <div style="font-size: 5rem; margin-bottom: 1.5rem; animation: float 3s ease-in-out infinite; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));">🛒</div>
                <h3 style="font-size: 1.6rem; margin-bottom: 0.5rem; background: linear-gradient(to right, #fff, #a5a5a5); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">السلة فارغة حالياً</h3>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 2.5rem; font-size: 0.95rem; line-height: 1.6;">لم تقم بإضافة أي منتجات بعد.<br>تصفح المتجر واكتشف عروضنا المميزة!</p>
                <button class="btn btn-primary" onclick="document.querySelector('.cart-modal-overlay').remove()" style="padding: 14px 35px; border-radius: 50px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); font-weight: 600; letter-spacing: 0.5px; transition: transform 0.2s;">
                    تصفح المنتجات 🛍️
                </button>
            </div>
        `;
    } else {
        let cartHTML = '';

        // Need to access currentCurrency and EXCHANGE_RATE from global scope (app.js)
        const currentCurrency = window.currentCurrency || 'USD';
        const EXCHANGE_RATE = window.EXCHANGE_RATE || 1;

        cart.forEach((item, index) => {
            // Convert price for display
            const itemPriceUSD = item.price;
            const itemPriceDisplay = currentCurrency === 'USD' ? itemPriceUSD : (itemPriceUSD * EXCHANGE_RATE);
            const itemQuantity = item.quantity || 1;
            const itemSubtotal = itemPriceDisplay * itemQuantity;

            cartHTML += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-desc">${item.description}</div>
                        <div class="cart-item-price">${formatCurrency(itemPriceDisplay, currentCurrency)}</div>
                        <div class="quantity-controls">
                            <button class="qty-btn qty-decrease" data-product-id="${item.id}">−</button>
                            <span class="qty-value">${itemQuantity}</span>
                            <button class="qty-btn qty-increase" data-product-id="${item.id}">+</button>
                        </div>
                        <div class="cart-item-subtotal" style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 0.25rem;">
                            المجموع: ${formatCurrency(itemSubtotal, currentCurrency)}
                        </div>
                    </div>
                     <button class="remove-item-btn" data-index="${index}" style="opacity: 1; transform: scale(1); top: -8px; left: -8px;">×</button>
                </div>
            `;
        });

        const totalUSD = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const totalCurrent = currentCurrency === 'USD' ? totalUSD : (totalUSD * EXCHANGE_RATE);
        const displayTotal = activeDiscount ? (totalCurrent * (1 - activeDiscount.value / 100)) : totalCurrent;
        const totalFormatted = formatCurrency(totalCurrent, currentCurrency);
        const displayTotalFormatted = formatCurrency(displayTotal, currentCurrency);

        let priceHtml = `<div class="cart-total-value">${displayTotalFormatted}</div>`;
        if (activeDiscount) {
            priceHtml = `
                <div class="cart-total-value" style="display:flex; flex-direction:column; align-items:flex-end;">
                    <span style="text-decoration:line-through; font-size:0.9rem; opacity:0.7;">${totalFormatted}</span>
                    <span style="color:#00b894;">${displayTotalFormatted} (${activeDiscount.code})</span>
                </div>
            `;
        }

        contentHTML = `
            <span class="close-modal-btn" style="position:absolute; top:10px; right:20px; font-size:28px; cursor:pointer;">&times;</span>
            <h2 style="margin-top:0;">سلة المشتريات</h2>
            <div class="cart-items">
                ${cartHTML}
            </div>

             <!-- Promo Code Section -->
            <div class="promo-section" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="cart-promo-input" placeholder="هل لديك كود خصم؟" style="flex:1; padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white;">
                    <button onclick="applyPromoCode()" style="padding:0 20px; background:#6c5ce7; border:none; border-radius:8px; color:white; cursor:pointer;">تطبيق</button>
                </div>
                <div id="promo-message" style="margin-top:5px; font-size:0.9rem;"></div>
            </div>

            <div class="cart-total">
                <span>المجموع:</span>
                ${priceHtml}
            </div>

            <div class="name-input-section" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                <input type="text" id="customer-name" placeholder="👤 الاسم الكامل " 
                       style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white;">
            </div>

            <div class="phone-input-section" style="margin-top: 1rem; padding-top: 0;">
                <input type="tel" id="customer-phone" placeholder="📞 رقم الهاتف (اختياري)" 
                       oninput="this.value = this.value.replace(/[^0-9]/g, '')" 
                       inputmode="numeric"
                       style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; margin-bottom: 5px;">
                <small style="color: rgba(255,255,255,0.5); font-size: 0.8rem;">أضف رقمك لتسهيل التواصل بخصوص الطلب</small>
            </div>
            <div class="cart-actions">
                <button class="btn btn-secondary clear-cart-btn">مسح السلة</button>
                <button class="btn btn-primary" onclick="completeOrder()">إتمام الطلب (واتساب)</button>
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
                msg.style.color = '#00b894';
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
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        .cart-modal-overlay { transition: opacity 0.3s ease; }
        .cart-item { 
            display: flex; align-items: center; gap: 1rem; padding: 1rem; 
            background: rgba(255, 255, 255, 0.03); 
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px; margin-bottom: 1rem; position: relative; 
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .cart-item:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-color: rgba(255, 255, 255, 0.15);
        }
        .cart-item-image { 
            width: 70px; height: 70px; flex-shrink: 0; border-radius: 12px; 
            overflow: hidden; background: rgba(255,255,255,0.05); 
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .cart-item-image img { width: 100%; height: 100%; object-fit: contain; }
        .cart-item-details { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
        .cart-item-name { font-weight: 700; font-size: 1.05rem; color: #fff; }
        .cart-item-desc { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); }
        .cart-item-price { 
            color: #f093fb; font-weight: 700; font-size: 1rem; 
            background: rgba(240, 147, 251, 0.1); padding: 2px 8px; 
            border-radius: 6px; width: fit-content; margin-top: 2px;
        }
        .remove-item-btn { 
            width: 32px; height: 32px; border-radius: 50%; 
            background: rgba(255, 59, 48, 0.1); color: #ff3b30; border: none; 
            display: flex; align-items: center; justify-content: center; 
            cursor: pointer; position: absolute; top: -10px; left: -10px; 
            font-size: 1rem; transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            /* opacity: 0; transform: scale(0.8); */ 
            /* Make it always visible on mobile/touch, or handle hover for desktop. */
            /* Using CSS media query for hover if possible, but JS generated styles. */
        }
        .remove-item-btn:hover { background: #ff3b30; color: white; transform: scale(1.1) !important; box-shadow: 0 4px 12px rgba(255, 59, 48, 0.4); }
        
        .close-modal-btn {
            position: absolute; top: 15px; right: 20px; 
            font-size: 24px; color: rgba(255,255,255,0.5); 
            cursor: pointer; transition: 0.2s;
            width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;
            border-radius: 50%; background: rgba(255,255,255,0.05);
        }
        .close-modal-btn:hover { background: rgba(255,255,255,0.1); color: white; transform: rotate(90deg); }
        
        .cart-total {
            background: rgba(0,0,0,0.2); border-radius: 12px; padding: 1.2rem;
            margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .cart-total span:first-child { font-size: 1.1rem; color: rgba(255,255,255,0.8); }
        .cart-total-value { font-size: 1.5rem; font-weight: 800; color: #fff; text-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }

        /* Scrollbar */
        .cart-modal::-webkit-scrollbar { width: 6px; }
        .cart-modal::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .cart-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .cart-modal::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
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
    const customerName = document.getElementById('customer-name') ? document.getElementById('customer-name').value.trim() : '';
    const customerPhone = document.getElementById('customer-phone') ? document.getElementById('customer-phone').value.trim() : '';

    // Get User ID if logged in
    const user = firebase.auth().currentUser;
    const userId = user ? user.uid : (localStorage.getItem('support_visitor_id') || 'guest');

    // Prepare order data for Firebase
    const orderData = {
        orderId: orderId,
        userId: userId, // Link order to user
        currency: currentCurrency,
        items: cart.map(item => {
            // Save item price in the CURRENCY USED for the order
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
        currency: currentCurrency,
        customerName: customerName,
        customerPhone: customerPhone,
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
    let message = `مرحباً، أود إتمام الطلب التالي:\n\n📋 *رقم الطلب:* ${orderId}\n\n`;

    if (customerPhone) {
        message += `📱 *رقم الهاتف:* ${customerPhone}\n\n`;
    }

    cart.forEach(item => {
        const itemPrice = currentCurrency === 'USD' ? item.price : (item.price * EXCHANGE_RATE);
        const itemQty = item.quantity || 1;
        const itemSubtotal = itemPrice * itemQty;
        message += `📦 *${item.name}* x${itemQty}\nالسعر: ${formatCurrency(itemSubtotal, currentCurrency)}\n\n`;
    });

    if (activeDiscount) {
        message += `🎟️ *كود خصم:* ${activeDiscount.code} (${activeDiscount.value}%)\n`;
        message += `💰 *المجموع قبل الخصم:* ${formatCurrency(total, currentCurrency)}\n`;
    }

    message += `\n*المجموع النهائي:* ${totalFormatted}`;

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

    activeDiscount = null;
    cart = [];
    saveCart();
    updateCartCount();
    document.querySelector('.cart-modal-overlay').remove();

    // Redirect to success page
    setTimeout(() => {
        window.location.href = `success.html?orderId=${orderId}`;
    }, 1000);

    // Open WhatsApp (Optional, usually on success page or here? User flow suggests rewrite)
    // The original code didn't actually open WA effectively if it redirects immediately.
    // Usually successful sites redirect to success, which then opens WA or shows the WA button.
    // The previous implementation had: // Open WhatsApp comment, then redirect.

    // Let's assume the success page helps manual WA click, OR we open it here.
    // window.open(`https://wa.me/${CONTACT_NUMBER}?text=${encodedMessage}`, '_blank');
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
