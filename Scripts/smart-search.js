class SmartSearch {
    constructor() {
        this.input = document.getElementById('product-search');
        this.productsContainer = document.getElementById('products-container');
        this.init();
    }

    init() {
        if (!this.input || !this.productsContainer) return;

        // Clone input to remove existing listeners (from app.js strict search)
        const newInput = this.input.cloneNode(true);
        this.input.parentNode.replaceChild(newInput, this.input);
        this.input = newInput;

        this.input.addEventListener('input', (e) => this.handleSearch(e));

        // Restore focus
        this.input.focus();
    }

    handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        const productCards = document.querySelectorAll('.product-card');
        let hasVisibleProduct = false;

        const products = Array.from(productCards).map(card => ({
            element: card,
            name: card.querySelector('.product-name').textContent.toLowerCase(),
            desc: card.querySelector('.product-description').textContent.toLowerCase()
        }));

        if (query === '') {
            products.forEach(p => {
                p.element.style.display = 'block';
                p.element.style.animation = 'none';
                p.element.style.opacity = '1';
                p.element.style.transform = 'translateY(0)';
            });
            this.handleNoResults(true); // Clear message
            return;
        }

        // 1. Exact/Partial Match (High Priority)
        // 2. Fuzzy Match (Low Priority)

        products.forEach(p => {
            const exactMatch = p.name.includes(query) || p.desc.includes(query);

            // Fuzzy match if word is long enough (> 3 chars)
            let fuzzyMatch = false;
            if (!exactMatch && query.length > 2) {
                // Check score for name words
                const nameWords = p.name.split(' ');
                fuzzyMatch = nameWords.some(word => this.levenshtein(query, word) <= 2);
            }

            if (exactMatch || fuzzyMatch) {
                p.element.style.display = 'block';
                p.element.style.animation = 'fadeIn 0.3s ease forwards';
                hasVisibleProduct = true;
            } else {
                p.element.style.display = 'none';
            }
        });

        this.handleNoResults(hasVisibleProduct);
    }

    handleNoResults(hasVisibleProduct) {
        const noResultsMsg = document.querySelector('.no-results-search');
        if (!hasVisibleProduct) {
            if (!noResultsMsg) {
                const msg = document.createElement('div');
                msg.className = 'no-results-search';
                msg.innerHTML = `
                    <div style="text-align: center; padding: 2rem; width: 100%; grid-column: 1 / -1; color: rgba(255,255,255,0.6);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🤔</div>
                        <h3>لم نجد نتائج مطابقة تماماً</h3>
                        <p>جرب كلمات مفتاحية أخرى</p>
                    </div>
                `;
                this.productsContainer.appendChild(msg);
            }
        } else {
            if (noResultsMsg) noResultsMsg.remove();
        }
    }

    // Levenshtein Distance Algorithm (The "Fuzzy" Math)
    levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // increment along the first column of each row
        var i;
        for (i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // increment each column in the first row
        var j;
        for (j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1  // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait slightly for app.js to finish rendering static cards if any
    setTimeout(() => {
        new SmartSearch();
    }, 500);
});

// Re-init on product load (Firebase)
document.addEventListener('header-loaded', () => {
    setTimeout(() => {
        new SmartSearch();
    }, 1000);
});
// Exposed for other scripts
window.SmartSearch = SmartSearch;
