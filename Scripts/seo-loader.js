// ============================================
// SEO LOADER — Applies SEO settings from Firebase to meta tags
// ============================================
(function () {
    'use strict';

    // Don't run on admin page
    if (document.getElementById('admin-dashboard') || window.location.pathname.includes('admin')) return;

    function applySeoSettings() {
        // Wait for Firebase to be available
        if (typeof firebase === 'undefined' || !firebase.database) {
            setTimeout(applySeoSettings, 300);
            return;
        }

        const db = firebase.database();
        db.ref('seoSettings').once('value').then(snapshot => {
            const seo = snapshot.val();
            if (!seo) return;

            // Meta Title
            if (seo.metaTitle) {
                document.title = seo.metaTitle;
                updateMeta('property', 'og:title', seo.metaTitle);
                updateMeta('property', 'twitter:title', seo.metaTitle);
            }

            // Meta Description
            if (seo.metaDescription) {
                updateMeta('name', 'description', seo.metaDescription);
                updateMeta('property', 'og:description', seo.metaDescription);
                updateMeta('property', 'twitter:description', seo.metaDescription);
            }

            // OG Image
            if (seo.ogImage) {
                updateMeta('property', 'og:image', seo.ogImage);
                updateMeta('property', 'twitter:image', seo.ogImage);
            }

            // Site URL
            if (seo.siteUrl) {
                updateMeta('property', 'og:url', seo.siteUrl);
                updateMeta('property', 'twitter:url', seo.siteUrl);
            }

            // Robots
            const indexVal = seo.robotsIndex !== false ? 'index' : 'noindex';
            const followVal = seo.robotsFollow !== false ? 'follow' : 'nofollow';
            updateMeta('name', 'robots', `${indexVal}, ${followVal}`);

        }).catch(err => {
            console.warn('SEO loader: Could not fetch settings', err);
        });
    }

    function updateMeta(attrName, attrValue, content) {
        let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
        if (meta) {
            meta.setAttribute('content', content);
        } else {
            meta = document.createElement('meta');
            meta.setAttribute(attrName, attrValue);
            meta.setAttribute('content', content);
            document.head.appendChild(meta);
        }
    }

    // Run as early as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applySeoSettings);
    } else {
        applySeoSettings();
    }
})();
