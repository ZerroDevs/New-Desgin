/*! instant.page v5.2.0 - (C) 2019-2023 Alexandre Dieulot - https://instant.page/license */
let mouseoverTimer;
let lastTouchTimestamp;
const prefetched = new Set();
const prefetchElement = document.createElement('link');
const isSupported = prefetchElement.relList && prefetchElement.relList.supports && prefetchElement.relList.supports('prefetch');
const isDataSaverEnabled = navigator.connection && navigator.connection.saveData;
const allowQueryString = 'instantAllowQueryString' in document.body.dataset;
const allowExternalLinks = 'instantAllowExternalLinks' in document.body.dataset;

if (isSupported && !isDataSaverEnabled) {
    prefetchElement.rel = 'prefetch';
    document.head.appendChild(prefetchElement);

    const eventListenersOptions = {
        capture: true,
        passive: true,
    };

    if (!allowExternalLinks) {
        // Internal links only by default
    }

    document.addEventListener('touchstart', touchstartListener, eventListenersOptions);
    document.addEventListener('mouseover', mouseoverListener, eventListenersOptions);
}

function touchstartListener(event) {
    /* Chrome on Android calls mouseover before touchcancel so we want to check for touch events. */
    lastTouchTimestamp = performance.now();

    const linkElement = event.target.closest('a');

    if (!isPreloadable(linkElement)) {
        return;
    }

    preload(linkElement.href);
}

function mouseoverListener(event) {
    if (performance.now() - lastTouchTimestamp < 1100) {
        return;
    }

    const linkElement = event.target.closest('a');

    if (!isPreloadable(linkElement)) {
        return;
    }

    linkElement.addEventListener('mouseout', mouseoutListener, {
        passive: true
    });

    mouseoverTimer = setTimeout(() => {
        preload(linkElement.href);
        mouseoverTimer = undefined;
    }, 65);
}

function mouseoutListener(event) {
    if (event.relatedTarget && event.target.closest('a') == event.relatedTarget.closest('a')) {
        return;
    }

    if (mouseoverTimer) {
        clearTimeout(mouseoverTimer);
        mouseoverTimer = undefined;
    }
}

function isPreloadable(linkElement) {
    if (!linkElement || !linkElement.href) {
        return;
    }

    if (allowQueryString || !allowExternalLinks && linkElement.origin != location.origin && !('instant' in linkElement.dataset)) {
        // Check external
        if (!allowExternalLinks && linkElement.origin != location.origin) return;
    }

    if (!['http:', 'https:'].includes(linkElement.protocol)) {
        return;
    }

    if (linkElement.protocol == 'http:' && location.protocol == 'https:') {
        return;
    }

    if (!allowQueryString && linkElement.search && !('instant' in linkElement.dataset)) {
        return;
    }

    if (linkElement.hash && linkElement.pathname + linkElement.search == location.pathname + location.search) {
        return;
    }

    if ('noInstant' in linkElement.dataset) {
        return;
    }

    return true;
}

function preload(url) {
    if (prefetched.has(url)) {
        return;
    }

    const prefetcher = document.createElement('link');
    prefetcher.rel = 'prefetch';
    prefetcher.href = url;
    document.head.appendChild(prefetcher);

    prefetched.add(url);
}
