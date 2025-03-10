import { auth, db, dbRef } from './firebase-config.js';
import { onValue } from 'firebase/database';
import { requireAuth } from './auth-helper.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await requireAuth();
        
        // Realtime punten updates
        const userRef = dbRef.user(user.uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                document.querySelector('.points-amount').textContent = userData.points || 0;
                document.querySelector('.username').textContent = userData.name || 'Gebruiker';
                updateGameScores(userData.games);
                updateRewards(userData.points);
            }
        });

        // Games grid vullen
        const gamesGrid = document.querySelector('.games-grid');
        gamesGrid.innerHTML = `
            <div class="game-card" data-game="flappy">
                <img src="games/flappy.png" alt="Flappy Bird">
                <h4>Flappy Bird</h4>
                <span class="highscore">Highscore: 0</span>
                <span class="points-info">Verdien 10 punten per pipe!</span>
            </div>
            <div class="game-card" data-game="snake">
                <img src="games/snake.png" alt="Snake">
                <h4>Snake</h4>
                <span class="highscore">Highscore: 0</span>
                <span class="points-info">Verdien 5 punten per appel!</span>
            </div>
            <div class="game-card" data-game="pacman">
                <img src="games/pacman.png" alt="Pac-Man">
                <h4>Pac-Man</h4>
                <span class="highscore">Highscore: 0</span>
                <span class="points-info">Verdien 2 punten per dot!</span>
            </div>
        `;

        // Game cards klikbaar maken
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const game = card.dataset.game;
                window.location.href = `games/${game}.html`;
            });
        });
    } catch (error) {
        console.error('Auth error:', error);
    }
});

function updateGameScores(games) {
    if (!games) return;
    Object.entries(games).forEach(([game, data]) => {
        const scoreElement = document.querySelector(`[data-game="${game}"] .highscore`);
        if (scoreElement) {
            scoreElement.textContent = `Highscore: ${data.highscore}`;
        }
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