// ============================================
// FIREBASE CONFIGURATION (SHARED)
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyCJzT_VQZCunDf6w0UZhs_LNfo9xlD-NEk",
    authDomain: "new-desgin.firebaseapp.com",
    databaseURL: "https://new-desgin-default-rtdb.firebaseio.com",
    projectId: "new-desgin",
    storageBucket: "new-desgin.firebasestorage.app",
    messagingSenderId: "26859222727",
    appId: "1:26859222727:web:37211c67f667157c9df0e2",
    measurementId: "G-SX1Z1BRV62"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized Successfully (Shared Config)");
} else {
    console.log("Firebase already initialized, skipping...");
}

// Export services globally
// Note: We check if the service is available in the SDK before accessing it
// This prevents errors if a specific page doesn't import the Auth SDK, for example.

if (firebase.database) {
    window.database = firebase.database();
} else {
    console.warn("Firebase Database SDK not loaded.");
}

if (firebase.auth) {
    window.auth = firebase.auth();
}

// Optional: Analytics
if (firebase.analytics) {
    window.analytics = firebase.analytics();
}
