// ============================================
// LAZY LOAD — IntersectionObserver Image Loading
// ============================================
(function () {
    // Transparent 1x1 pixel placeholder
    const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';

    // Inject styles once
    const style = document.createElement('style');
    style.textContent = `
        img[data-src] {
            opacity: 0;
            transition: opacity 0.4s ease;
        }
        img[data-src].lazy-loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // Load an image: swap data-src → src
    function loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        img.src = src;
        img.removeAttribute('data-src');

        // Fade in once loaded
        if (img.complete) {
            img.classList.add('lazy-loaded');
        } else {
            img.addEventListener('load', () => img.classList.add('lazy-loaded'), { once: true });
            img.addEventListener('error', () => img.classList.add('lazy-loaded'), { once: true });
        }
    }

    // IntersectionObserver — load images when they enter viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadImage(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '200px 0px', // Start loading 200px before entering viewport
        threshold: 0.01
    });

    // Observe an image
    function observeImage(img) {
        if (img.hasAttribute('data-src')) {
            observer.observe(img);
        }
    }

    // Scan the DOM for lazy images
    function scanForLazyImages(root) {
        const images = (root || document).querySelectorAll('img[data-src]');
        images.forEach(observeImage);
    }

    // MutationObserver — auto-detect dynamically added images
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return; // Element nodes only
                // Check the node itself
                if (node.tagName === 'IMG' && node.hasAttribute('data-src')) {
                    observeImage(node);
                }
                // Check children
                if (node.querySelectorAll) {
                    node.querySelectorAll('img[data-src]').forEach(observeImage);
                }
            });
        });
    });

    // Start watching once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        scanForLazyImages();
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Expose globally so other scripts can use it
    window.lazyLoad = { scan: scanForLazyImages };
})();
