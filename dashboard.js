import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyBCXaYJI9dxwqKD1Qsb_9AOdsnVTPG2uHM",
    authDomain: "pjotters-company.firebaseapp.com",
    databaseURL: "https://pjotters-company-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pjotters-company",
    storageBucket: "pjotters-company.appspot.com",
    messagingSenderId: "64413422793",
    appId: "1:64413422793:web:37debb74f7c7d3ead6e918"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Debug functie
function showError(message) {
    console.error(message);
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
        loadingScreen.innerHTML = `<p>Error: ${message}</p>`;
    }
}

// Wacht tot de pagina geladen is
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded'); // Debug log
    
    const loadingScreen = document.getElementById('loading');
    const content = document.getElementById('content');
    
    if (!loadingScreen || !content) {
        showError('Required DOM elements not found');
        return;
    }

    // Check auth status
    onAuthStateChanged(auth, (user) => {
        console.log('Auth state:', user ? 'logged in' : 'not logged in'); // Debug log
        
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        // Load user data
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            console.log('User data:', userData); // Debug log
            
            if (!userData) {
                showError('Geen gebruikersdata gevonden');
                return;
            }

            // Update UI
            const welcomeMessage = document.querySelector('.welcome-message');
            const pointsElement = document.getElementById('totalPoints');
            
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welkom terug, ${userData.name || user.email.split('@')[0]}!`;
            }
            
            if (pointsElement) {
                pointsElement.textContent = userData.points || 0;
            }

            // Show content
            loadingScreen.style.display = 'none';
            content.style.display = 'block';
        }, (error) => {
            showError(`Database error: ${error.message}`);
        });
    });
});

function updateRewards(points) {
    const rewards = [
        { id: 'coupon5', cost: 500, title: '€5 Korting', icon: '🎫' },
        { id: 'coupon10', cost: 1000, title: '€10 Korting', icon: '🎫' },
        { id: 'coupon20', cost: 2000, title: '€20 Korting', icon: '🎫' },
        { id: 'premium_week', cost: 5000, title: '1 Week Premium', icon: '⭐' }
    ];

    const rewardsGrid = document.querySelector('.rewards-grid');
    rewardsGrid.innerHTML = rewards.map(reward => `
        <div class="reward-card ${points >= reward.cost ? 'available' : ''}">
            <span class="reward-icon">${reward.icon}</span>
            <h4>${reward.title}</h4>
            <span class="points-cost">${reward.cost} punten</span>
            <button class="claim-btn" data-reward="${reward.id}" 
                    ${points < reward.cost ? 'disabled' : ''}>
                Claim
            </button>
        </div>
    `).join('');
} 