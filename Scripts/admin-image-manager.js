// ============================================
// ADMIN IMAGE MANAGER — Gallery, Drag-Drop, Compress, Paste
// ============================================
(function () {
    'use strict';

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        /* Image Manager Tab */
        .image-manager-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
            margin-top: 1rem;
        }
        .img-manager-card {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            background: rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.08);
            aspect-ratio: 1;
            cursor: pointer;
            transition: all 0.3s;
        }
        .img-manager-card:hover {
            border-color: rgba(102,126,234,0.5);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .img-manager-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s;
        }
        .img-manager-card:hover img {
            transform: scale(1.05);
        }
        .img-manager-card .img-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.85));
            padding: 8px;
            transform: translateY(100%);
            transition: transform 0.3s;
        }
        .img-manager-card:hover .img-overlay {
            transform: translateY(0);
        }
        .img-overlay-name {
            font-size: 0.7rem;
            color: rgba(255,255,255,0.9);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .img-overlay-actions {
            display: flex;
            gap: 4px;
            margin-top: 4px;
        }
        .img-overlay-actions button {
            flex: 1;
            padding: 3px 6px;
            border: none;
            border-radius: 6px;
            font-size: 0.65rem;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Cairo', sans-serif;
        }
        .img-copy-btn {
            background: rgba(102,126,234,0.3);
            color: #a5b4fc;
        }
        .img-copy-btn:hover { background: rgba(102,126,234,0.5); }

        /* Drag and Drop Area for Product Gallery */
        .img-drop-zone {
            border: 2px dashed rgba(102,126,234,0.3);
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            color: rgba(255,255,255,0.4);
            transition: all 0.3s;
            cursor: pointer;
            position: relative;
            margin-bottom: 1rem;
        }
        .img-drop-zone.drag-over {
            border-color: #667eea;
            background: rgba(102,126,234,0.08);
            color: #667eea;
        }
        .img-drop-zone .drop-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .img-drop-zone .drop-text {
            font-size: 0.9rem;
        }
        .img-drop-zone .drop-hint {
            font-size: 0.75rem;
            margin-top: 0.3rem;
            color: rgba(255,255,255,0.25);
        }

        /* Draggable Gallery Preview */
        .gallery-sortable {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 1rem;
            min-height: 40px;
        }
        .gallery-sortable-item {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            cursor: grab;
            border: 2px solid rgba(255,255,255,0.1);
            transition: all 0.2s;
        }
        .gallery-sortable-item:active { cursor: grabbing; }
        .gallery-sortable-item.dragging {
            opacity: 0.4;
            transform: scale(0.9);
        }
        .gallery-sortable-item.drag-target {
            border-color: #667eea;
            transform: scale(1.05);
        }
        .gallery-sortable-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .gallery-sortable-item .remove-img {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: rgba(244,67,54,0.8);
            color: white;
            border: none;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .gallery-sortable-item:hover .remove-img { opacity: 1; }
        .gallery-sortable-item .img-order {
            position: absolute;
            bottom: 2px;
            left: 2px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            font-size: 0.6rem;
            padding: 1px 5px;
            border-radius: 4px;
        }

        /* Compression Preview */
        .compress-preview {
            display: flex;
            gap: 1rem;
            align-items: center;
            padding: 12px;
            border-radius: 10px;
            background: rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.05);
            margin-top: 1rem;
        }
        .compress-preview img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
        }
        .compress-info {
            flex: 1;
        }
        .compress-info .size-original {
            color: #f44336;
            font-size: 0.85rem;
        }
        .compress-info .size-compressed {
            color: #4caf50;
            font-size: 0.85rem;
        }
        .compress-info .size-saved {
            color: #667eea;
            font-size: 0.8rem;
            font-weight: bold;
        }

        /* Paste zone */
        .paste-hint {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.3);
            margin-top: 4px;
        }
        .paste-hint kbd {
            background: rgba(255,255,255,0.1);
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
        }

        .img-manager-stats {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }
        .img-stat-chip {
            padding: 6px 14px;
            border-radius: 20px;
            background: rgba(102,126,234,0.1);
            border: 1px solid rgba(102,126,234,0.2);
            font-size: 0.8rem;
            color: rgba(255,255,255,0.7);
        }
        .img-stat-chip strong {
            color: #667eea;
        }
    `;
    document.head.appendChild(style);

    // ---- All Images Gallery (from products and books) ----
    function collectAllImages() {
        const images = [];
        const db = window.database;
        if (!db) return Promise.resolve(images);

        const productsPromise = db.ref('products').once('value').then(snapshot => {
            const products = snapshot.val();
            if (products) {
                Object.entries(products).forEach(([id, product]) => {
                    if (product.image) {
                        images.push({
                            url: product.image,
                            name: product.name,
                            id: id,
                            source: 'product',
                            type: 'main'
                        });
                    }
                    if (product.additionalImages && Array.isArray(product.additionalImages)) {
                        product.additionalImages.forEach((url, idx) => {
                            images.push({
                                url: url,
                                name: product.name + ` (${idx + 1})`,
                                id: id,
                                source: 'product',
                                type: 'gallery'
                            });
                        });
                    }
                });
            }
        });

        const booksPromise = db.ref('studentBooks').once('value').then(snapshot => {
            const books = snapshot.val();
            if (books) {
                Object.entries(books).forEach(([id, book]) => {
                    if (book.image) {
                        images.push({
                            url: book.image,
                            name: book.name || 'كتاب بدون عنوان',
                            id: id,
                            source: 'book',
                            type: 'main'
                        });
                    }
                });
            }
        });

        return Promise.all([productsPromise, booksPromise]).then(() => images);
    }

    function renderImageGallery(container) {
        container.innerHTML = '<div class="activity-empty">جاري تحميل الصور...</div>';

        collectAllImages().then(images => {
            container.innerHTML = '';

            if (images.length === 0) {
                container.innerHTML = '<div class="activity-empty">📷 لا توجد صور بعد</div>';
                return;
            }

            // Stats
            const statsDiv = document.createElement('div');
            statsDiv.className = 'img-manager-stats';
            const productCount = images.filter(i => i.source === 'product').length;
            const bookCount = images.filter(i => i.source === 'book').length;

            statsDiv.innerHTML = `
                <span class="img-stat-chip">📷 الإجمالي: <strong>${images.length}</strong></span>
                <span class="img-stat-chip">📦 منتجات: <strong>${productCount}</strong></span>
                <span class="img-stat-chip">📚 كتب: <strong>${bookCount}</strong></span>
            `;
            container.appendChild(statsDiv);

            // Grid
            const grid = document.createElement('div');
            grid.className = 'image-manager-grid';

            images.forEach(img => {
                const card = document.createElement('div');
                card.className = 'img-manager-card';
                const typeIcon = img.source === 'book' ? '📚' : '📦';

                card.innerHTML = `
                    <img src="${img.url}" alt="${img.name}" loading="lazy">
                    <div class="img-overlay">
                        <div class="img-overlay-name" title="${img.name}">${typeIcon} ${img.name}</div>
                        <div class="img-overlay-actions">
                            <button class="img-copy-btn" data-url="${img.url}">📋 نسخ الرابط</button>
                        </div>
                    </div>
                `;

                // Copy URL
                card.querySelector('.img-copy-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(img.url).then(() => {
                        const btn = e.target;
                        btn.textContent = '✅ تم!';
                        setTimeout(() => btn.textContent = '📋 نسخ الرابط', 1500);
                    });
                });

                // Click to view full
                card.addEventListener('click', () => {
                    showImagePreview(img.url, img.name);
                });

                grid.appendChild(card);
            });

            container.appendChild(grid);
        });
    }

    function showImagePreview(url, name) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;animation:fadeIn 0.2s;';
        overlay.innerHTML = `
            <img src="${url}" style="max-width:90%;max-height:85vh;object-fit:contain;border-radius:12px;box-shadow:0 0 30px rgba(0,0,0,0.5);animation:zoomIn 0.3s forwards;transform:scale(0.9);">
            <div style="position:absolute;bottom:20px;color:rgba(255,255,255,0.6);font-size:0.9rem;">${name}</div>
        `;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
    }

    // ---- Enhanced Drop Zone for Product Form ----
    function enhanceProductImageUpload() {
        const imageField = document.getElementById('product-image');
        if (!imageField || document.getElementById('img-drop-zone')) return;

        const dropZone = document.createElement('div');
        dropZone.className = 'img-drop-zone';
        dropZone.id = 'img-drop-zone';
        dropZone.innerHTML = `
            <div class="drop-icon">📸</div>
            <div class="drop-text">اسحب صورة هنا أو انقر للاختيار</div>
            <div class="drop-hint">يمكنك أيضاً لصق صورة بـ <kbd>Ctrl</kbd>+<kbd>V</kbd></div>
        `;

        // Insert after the file upload container
        const fileContainer = imageField.closest('.form-group')?.querySelector('.file-upload-container');
        if (fileContainer) {
            fileContainer.after(dropZone);
        }

        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                processImageFile(file, 'product-image');
            }
        });
        dropZone.addEventListener('click', () => {
            document.getElementById('image-file')?.click();
        });
    }

    // ---- Clipboard Paste ----
    function initClipboardPaste() {
        document.addEventListener('paste', (e) => {
            // Only handle on admin page
            if (!document.getElementById('admin-dashboard')) return;
            // Only handle if in product form
            const productTab = document.getElementById('tab-products');
            if (!productTab || productTab.style.display === 'none') return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        processImageFile(file, 'product-image');
                    }
                    break;
                }
            }
        });
    }

    // ---- Process Image with Compression Preview ----
    function processImageFile(file, targetInputId) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const originalData = e.target.result;
            const originalSize = file.size;

            // Compress
            compressForPreview(originalData, 800, 0.7).then(result => {
                const compressedSize = result.size;
                const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);

                // Set the image URL
                const input = document.getElementById(targetInputId);
                if (input) input.value = result.dataUrl;

                // Show compression preview
                showCompressionPreview(originalData, originalSize, compressedSize, savedPercent);

                // Notify
                if (typeof showNotification === 'function') {
                    showNotification(`تم تحميل الصورة! (وفرت ${savedPercent}% من الحجم) 📸`);
                }
            });
        };
        reader.readAsDataURL(file);
    }

    function compressForPreview(dataUrl, maxWidth, quality) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve({
                    dataUrl: compressed,
                    size: Math.round(compressed.length * 0.75) // approximate byte size from base64
                });
            };
            img.src = dataUrl;
        });
    }

    function showCompressionPreview(originalUrl, originalSize, compressedSize, savedPercent) {
        // Remove old preview
        document.getElementById('compress-preview')?.remove();

        const preview = document.createElement('div');
        preview.className = 'compress-preview';
        preview.id = 'compress-preview';
        preview.innerHTML = `
            <img src="${originalUrl}">
            <div class="compress-info">
                <div class="size-original">📦 الحجم الأصلي: ${formatBytes(originalSize)}</div>
                <div class="size-compressed">✅ بعد الضغط: ${formatBytes(compressedSize)}</div>
                <div class="size-saved">💾 تم توفير ${savedPercent}%</div>
            </div>
        `;

        const dropZone = document.getElementById('img-drop-zone');
        if (dropZone) {
            dropZone.after(preview);
        }
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ---- Sortable Gallery (for additional images) ----
    function enhanceAdditionalImagesSort() {
        const previewContainer = document.getElementById('additional-images-preview');
        if (!previewContainer) return;

        // Watch for changes in the preview container
        const observer = new MutationObserver(() => {
            makeSortable(previewContainer);
        });
        observer.observe(previewContainer, { childList: true });
    }

    function makeSortable(container) {
        const items = container.querySelectorAll('[style*="position: relative"]');
        if (items.length === 0) return;

        let dragItem = null;

        items.forEach((item, idx) => {
            item.draggable = true;
            item.style.cursor = 'grab';

            // Add order badge if not present
            if (!item.querySelector('.img-order')) {
                const order = document.createElement('span');
                order.className = 'img-order';
                order.textContent = idx + 1;
                item.appendChild(order);
            }

            item.addEventListener('dragstart', (e) => {
                dragItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                dragItem = null;
                // Update order badges
                container.querySelectorAll('.img-order').forEach((badge, i) => {
                    badge.textContent = i + 1;
                });
                // Sync with currentAdditionalImages array
                syncSortOrder(container);
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (dragItem && dragItem !== item) {
                    item.classList.add('drag-target');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-target');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-target');
                if (dragItem && dragItem !== item) {
                    const allItems = [...container.children];
                    const fromIdx = allItems.indexOf(dragItem);
                    const toIdx = allItems.indexOf(item);
                    if (fromIdx < toIdx) {
                        container.insertBefore(dragItem, item.nextSibling);
                    } else {
                        container.insertBefore(dragItem, item);
                    }
                }
            });
        });
    }

    function syncSortOrder(container) {
        // Sync the visual order back to the global array
        if (typeof window.currentAdditionalImages === 'undefined') return;
        const imgs = container.querySelectorAll('img');
        const newOrder = [];
        imgs.forEach(img => {
            const src = img.src;
            if (src && !src.startsWith('data:')) {
                newOrder.push(src);
            } else if (src) {
                newOrder.push(src);
            }
        });
        if (newOrder.length > 0) {
            window.currentAdditionalImages = newOrder;
        }
    }

    // ---- Inject Image Manager Tab ----
    function injectImageManagerTab() {
        const tabs = document.querySelector('.admin-tabs');
        if (!tabs || document.getElementById('tab-btn-images')) return;

        // Add tab button before Settings
        const settingsBtn = tabs.querySelector('[onclick*="settings"]');
        if (settingsBtn) {
            const imagesBtn = document.createElement('button');
            imagesBtn.className = 'tab-btn';
            imagesBtn.id = 'tab-btn-images';
            imagesBtn.setAttribute('onclick', "switchTab('images')");
            imagesBtn.innerHTML = '<span>🖼️</span> الصور';
            settingsBtn.before(imagesBtn);
        }

        // Tab content
        const main = document.querySelector('.admin-main');
        if (main) {
            const tabContent = document.createElement('div');
            tabContent.id = 'tab-images';
            tabContent.className = 'tab-content';
            tabContent.innerHTML = `
                <section class="form-section">
                    <h2>🖼️ مدير الصور</h2>
                    <p style="color: rgba(255,255,255,0.4); font-size: 0.85rem; margin-bottom: 1rem;">
                        جميع صور المنتجات في مكان واحد. انقر لعرض بالحجم الكامل، أو انسخ الرابط.
                    </p>
                    <div id="image-manager-gallery">
                        <div class="activity-empty">جاري التحميل...</div>
                    </div>
                </section>
            `;
            main.appendChild(tabContent);
        }
    }

    // ---- Init ----
    function init() {
        injectImageManagerTab();
        enhanceProductImageUpload();
        initClipboardPaste();
        enhanceAdditionalImagesSort();

        // Load gallery when tab is clicked (old tab button)
        const tabBtn = document.getElementById('tab-btn-images');
        if (tabBtn) {
            tabBtn.addEventListener('click', () => {
                const gallery = document.getElementById('image-manager-gallery');
                if (gallery) renderImageGallery(gallery);
            });
        }

        // Also watch for tab activation via sidebar or switchTab()
        const checkTab = setInterval(() => {
            const tabPanel = document.getElementById('tab-images');
            if (tabPanel) {
                clearInterval(checkTab);
                // Use MutationObserver to detect when tab becomes active
                const observer = new MutationObserver(() => {
                    if (tabPanel.classList.contains('active')) {
                        const gallery = document.getElementById('image-manager-gallery');
                        if (gallery) renderImageGallery(gallery);
                    }
                });
                observer.observe(tabPanel, { attributes: true, attributeFilter: ['class'] });
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 150);
    }
})();
