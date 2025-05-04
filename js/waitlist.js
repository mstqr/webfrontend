// js/waitlist.js
// Handles waitlist form submission and saves phone number to Firestore

// Import Firebase config and initialize (reuse existing config logic)
// If config.js exports firebaseConfig, you can import it, otherwise duplicate here

// Waitlist Firebase initialization (standalone, for mstqrweb project)
const firebaseConfig = {
    apiKey: "AIzaSyCE_XbhQQpfTrtCvqjQloioBqeoAhDKYXs",
    authDomain: "mstqrweb.firebaseapp.com",
    projectId: "mstqrweb",
    storageBucket: "mstqrweb.firebasestorage.app",
    messagingSenderId: "181872086077",
    appId: "1:181872086077:web:3337f34676d6404129ae54",
    measurementId: "G-PD25M967XC"
};

if (typeof firebase !== 'undefined' && (!firebase.apps || !firebase.apps.length)) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

document.getElementById('waitlistForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const phone = document.getElementById('phone').value.trim();
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = '';
    // Validate phone: must be 10 or 11 digits, no country code, only numbers
    if (!/^[0-9]{10,11}$/.test(phone)) {
        messageDiv.textContent = 'Please enter a valid phone number (10 or 11 digits, no country code).';
        messageDiv.classList.add('error');
        return;
    }
    try {
        await db.collection('waitlist').add({
            phone: phone,
            joinedAt: new Date()
        });
        // Hide form and show visual confirmation
        document.getElementById('waitlistForm').style.display = 'none';
        messageDiv.textContent = '';
        messageDiv.className = '';
        document.getElementById('success-visual').style.display = 'block';
    } catch (error) {
        messageDiv.textContent = 'Error joining waitlist. Please try again later.';
        messageDiv.classList.add('error');
        console.error(error);
    }
});
