import { auth, db, dbRef } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { onValue } from 'firebase/database';
import { requireAuth } from './auth-helper.js';

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadUserData(user);
        } else {
            window.location.href = 'login.html';
        }
    });
});

function loadUserData(user) {
    // Laad gebruikerspunten
    const userPointsRef = dbRef.points(user.uid);
    onValue(userPointsRef, (snapshot) => {
        const points = snapshot.val() || 0;
        document.getElementById('totalPoints').textContent = points;
    });

    // Laad game statistieken
    const userGamesRef = dbRef.games(user.uid);
    onValue(userGamesRef, (snapshot) => {
        const games = snapshot.val() || {};
        
        // Update Flappy Bird stats
        if (games.flappyBird) {
            document.getElementById('flappyHighscore').textContent = games.flappyBird.highscore || 0;
            document.getElementById('flappyPoints').textContent = games.flappyBird.totalPoints || 0;
        }
        
        // Voeg hier meer game statistieken toe
    });
}

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