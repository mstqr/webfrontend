// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCE_XbhQQpfTrtCvqjQloioBqeoAhDKYXs",
    authDomain: "mstqrweb.firebaseapp.com",
    projectId: "mstqrweb",
    storageBucket: "mstqrweb.firebasestorage.app",
    messagingSenderId: "181872086077",
    appId: "1:181872086077:web:3337f34676d6404129ae54",
    measurementId: "G-PD25M967XC"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export auth instance
export const auth = firebase.auth();

console.log('Firebase initialized');
