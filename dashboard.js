import { auth, db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { requireAuth } from './auth-helper.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await requireAuth();
        loadUserData(user);
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = 'login.html';
    }
});

function loadUserData(user) {
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val() || {};
        
        // Update totale punten
        document.getElementById('totalPoints').textContent = userData.points || 0;
        
        // Update game statistieken
        const games = userData.games || {};
        
        // Flappy Bird stats
        if (games.flappyBird) {
            document.getElementById('flappyHighscore').textContent = games.flappyBird.highscore || 0;
            document.getElementById('flappyPoints').textContent = games.flappyBird.totalPoints || 0;
        }
        
        // Snake stats
        if (games.snake) {
            document.getElementById('snakeHighscore').textContent = games.snake.highscore || 0;
            document.getElementById('snakePoints').textContent = games.snake.totalPoints || 0;
        }
        
        // Pacman stats
        if (games.pacman) {
            document.getElementById('pacmanHighscore').textContent = games.pacman.highscore || 0;
            document.getElementById('pacmanPoints').textContent = games.pacman.totalPoints || 0;
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