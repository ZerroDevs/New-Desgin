export async function onRequest(context) {
    const url = new URL(context.request.url);

    // Check if the hostname is admin.zeronux.store
    if (url.hostname === 'admin.zeronux.store' && url.pathname === '/') {
        // Rewrite the path to /admin.html so the user sees the admin dashboard
        // while keeping the URL as admin.zeronux.store
        url.pathname = '/admin.html';
        return context.env.ASSETS.fetch(url);
    }

    // Pass through all other requests
    return context.next();
}
