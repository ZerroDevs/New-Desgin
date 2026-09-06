// ============================================
// STYLED MODALS
// ============================================

/**
 * Show a styled confirmation modal
 * @param {string} title - The title of the modal
 * @param {string} message - The message/body of the modal
 * @param {function} onConfirm - Callback function when 'Confirm' is clicked
 * @param {string} confirmText - Text for confirm button (default: 'نعم، أنا متأكد')
 * @param {string} confirmColor - Color for confirm button (default: 'danger' -> red, or hex)
 */
function showConfirmModal(title, message, onConfirm, confirmText = 'نعم، تنفيذ', confirmColor = 'danger') {
    const modalId = 'confirm-modal-' + Date.now();

    // Define Button Style based on type
    let btnStyle = '';
    if (confirmColor === 'danger') {
        btnStyle = 'background: #f44336; color: white; border: none;';
    } else if (confirmColor === 'primary') {
        btnStyle = 'background: #667eea; color: white; border: none;';
    } else {
        btnStyle = `background: ${confirmColor}; color: white; border: none;`;
    }

    const modalHtml = `
        <div id="${modalId}" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s ease;
            backdrop-filter: blur(5px);
        ">
            <div style="
                background: #1a1a2e; padding: 2rem; border-radius: 16px; 
                width: 90%; max-width: 450px; text-align: center;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h2 style="color: white; margin-bottom: 10px; font-size: 1.5rem;">${title}</h2>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 2rem; line-height: 1.6;">${message}</p>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="btn-cancel-${modalId}" style="
                        padding: 10px 20px; border-radius: 8px; cursor: pointer;
                        background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);
                        font-family: inherit; font-size: 1rem;
                    ">إلغاء</button>
                    <button id="btn-confirm-${modalId}" style="
                        padding: 10px 20px; border-radius: 8px; cursor: pointer;
                        ${btnStyle}
                        font-family: inherit; font-size: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    ">${confirmText}</button>
                </div>
            </div>
        </div>
    `;

    // Append to body
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    const modalEl = document.getElementById(modalId);

    // Animation In
    requestAnimationFrame(() => {
        modalEl.style.opacity = '1';
        modalEl.querySelector('div').style.transform = 'scale(1)';
    });

    // Event Handlers
    const cleanup = () => {
        modalEl.style.opacity = '0';
        modalEl.querySelector('div').style.transform = 'scale(0.9)';
        setTimeout(() => {
            div.remove();
        }, 300);
    };

    document.getElementById(`btn-cancel-${modalId}`).onclick = cleanup;

    document.getElementById(`btn-confirm-${modalId}`).onclick = () => {
        onConfirm();
        cleanup();
    };

    // Close on click outside
    modalEl.onclick = (e) => {
        if (e.target === modalEl) cleanup();
    };
}

/**
 * Show a styled alert modal (replacement for window.alert)
 * @param {string} title - The title of the modal
 * @param {string} message - The message body
 * @param {string} type - 'success', 'error', 'warning', 'info' (default: 'info')
 */
function showAlertModal(title, message, type = 'info') {
    const modalId = 'alert-modal-' + Date.now();

    let icon = 'ℹ️';
    let color = '#667eea'; // Info blue

    if (type === 'success') { icon = '✅'; color = '#4caf50'; }
    if (type === 'error') { icon = '❌'; color = '#f44336'; }
    if (type === 'warning') { icon = '⚠️'; color = '#ff9800'; }

    const modalHtml = `
        <div id="${modalId}" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 10001;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s ease;
            backdrop-filter: blur(5px);
        ">
            <div style="
                background: #1a1a2e; padding: 2rem; border-radius: 16px; 
                width: 90%; max-width: 400px; text-align: center;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
                <h2 style="color: white; margin-bottom: 10px; font-size: 1.5rem;">${title}</h2>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 2rem; line-height: 1.6;">${message}</p>
                
                <button id="btn-ok-${modalId}" style="
                    padding: 10px 30px; border-radius: 8px; cursor: pointer;
                    background: ${color}; color: white; border: none;
                    font-family: inherit; font-size: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                ">موافق</button>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    const modalEl = document.getElementById(modalId);

    // Animation In
    requestAnimationFrame(() => {
        modalEl.style.opacity = '1';
        modalEl.querySelector('div').style.transform = 'scale(1)';
    });

    const cleanup = () => {
        modalEl.style.opacity = '0';
        modalEl.querySelector('div').style.transform = 'scale(0.9)';
        setTimeout(() => div.remove(), 300);
    };

    document.getElementById(`btn-ok-${modalId}`).onclick = cleanup;
    modalEl.onclick = (e) => { if (e.target === modalEl) cleanup(); };
}

/**
 * Show a custom modal with HTML content
 * @param {string} contentHtml - The inner HTML content
 * @param {object} options - Options { width: '500px', onClose: fn }
 */
function showCustomModal(contentHtml, options = {}) {
    const modalId = 'custom-modal-' + Date.now();
    const width = options.width || '500px';

    const modalHtml = `
        <div id="${modalId}" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.3s ease;
            backdrop-filter: blur(5px);
        ">
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); 
                padding: 2rem; border-radius: 16px; 
                width: 90%; max-width: ${width}; 
                max-height: 90vh; overflow-y: auto;
                position: relative; color: white;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                transform: scale(0.95); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ">
                <button id="btn-close-${modalId}" style="
                    position: absolute; top: 15px; left: 20px; 
                    background: none; border: none; color: white; 
                    font-size: 28px; cursor: pointer; opacity: 0.7;
                    transition: opacity 0.2s;
                ">&times;</button>
                
                <div id="modal-content-${modalId}">
                    ${contentHtml}
                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    const modalEl = document.getElementById(modalId);

    // Animation In
    requestAnimationFrame(() => {
        modalEl.style.opacity = '1';
        modalEl.querySelector('div').style.transform = 'scale(1)';
    });

    const cleanup = () => {
        modalEl.style.opacity = '0';
        modalEl.querySelector('div').style.transform = 'scale(0.95)';
        setTimeout(() => {
            div.remove();
            if (options.onClose) options.onClose();
        }, 300);
    };

    document.getElementById(`btn-close-${modalId}`).onclick = cleanup;

    // Hover effect for close button
    const closeBtn = document.getElementById(`btn-close-${modalId}`);
    closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.7';

    modalEl.onclick = (e) => {
        if (e.target === modalEl) cleanup();
    };

    return modalId; // Return ID in case needed
}
