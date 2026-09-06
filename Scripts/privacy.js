document.addEventListener('DOMContentLoaded', () => {

    // Elements to update
    const emailEl = document.getElementById('contact-email');

    // Fetch Settings from Firebase
    const db = firebase.database();

    db.ref('settings').once('value').then(snapshot => {
        const settings = snapshot.val() || {};

        // Update Email
        if (settings.contactEmail && emailEl) {
            emailEl.textContent = settings.contactEmail;
            emailEl.href = `mailto:${settings.contactEmail}`;
        } else {
            // Fallback default
            if (emailEl) {
                emailEl.textContent = 'altasmemaljaded@gmail.com';
                emailEl.href = 'mailto:ltasmemaljaded@gmail.com';
            }
        }
    }).catch(err => {
        console.error("Error loading privacy settings:", err);
    });

});
