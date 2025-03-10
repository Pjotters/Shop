import { auth, db } from './firebase-config.js';
import { ref, onValue, update } from 'firebase/database';

document.addEventListener('DOMContentLoaded', () => {
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        
        initializeDashboard(user);
    });
});

function initializeDashboard(user) {
    const userRef = ref(db, `users/${user.uid}`);
    
    // Luister naar gebruikersdata updates
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (!userData) return;

        // Update UI elementen
        document.querySelector('.username').textContent = userData.name || 'Gebruiker';
        document.querySelector('.points-amount').textContent = userData.points || 0;
        
        // Update game scores
        updateGameScores(userData.games);
        
        // Update bestellingen
        updateOrders(userData.orders);
        
        // Update beschikbare rewards
        updateRewards(userData.points);
    });

    // Event listeners voor games
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const game = card.dataset.game;
            startGame(game, user.uid);
        });
    });

    // Event listeners voor rewards
    document.querySelectorAll('.claim-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const reward = btn.dataset.reward;
            claimReward(reward, user.uid);
        });
    });
}

function updateGameScores(games) {
    if (!games) return;
    
    Object.entries(games).forEach(([game, data]) => {
        const scoreElement = document.querySelector(`[data-game="${game}"] .highscore`);
        if (scoreElement) {
            scoreElement.textContent = `Highscore: ${data.highscore}`;
        }
    });
}

function updateOrders(orders) {
    const ordersList = document.querySelector('.orders-list');
    if (!orders || !ordersList) return;
    
    ordersList.innerHTML = Object.entries(orders)
        .map(([id, order]) => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">#${id}</span>
                    <span class="order-date">${new Date(order.date).toLocaleDateString()}</span>
                </div>
                <div class="order-products">
                    ${order.products.map(p => `
                        <div class="order-product">
                            <span>${p.name}</span>
                            <span>€${p.price}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    Totaal: €${order.total}
                </div>
            </div>
        `).join('');
}

function updateRewards(points) {
    document.querySelectorAll('.reward-card').forEach(card => {
        const costElement = card.querySelector('.points-cost');
        const claimBtn = card.querySelector('.claim-btn');
        const cost = parseInt(costElement.textContent);
        
        claimBtn.disabled = points < cost;
        card.classList.toggle('available', points >= cost);
    });
}

// Deze functie wordt aangeroepen wanneer een spel start
function startGame(game, userId) {
    // Open het spel in een modal of nieuwe pagina
    window.location.href = `/games/${game}.html?uid=${userId}`;
}

// Deze functie wordt aangeroepen wanneer een reward wordt geclaimd
async function claimReward(reward, userId) {
    const rewardCosts = {
        'coupon5': 500,
        'coupon10': 1000,
        'coupon20': 2000
    };

    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        
        if (userData.points >= rewardCosts[reward]) {
            await update(userRef, {
                points: userData.points - rewardCosts[reward],
                [`rewards/${reward}`]: serverTimestamp()
            });
            
            alert('Reward succesvol geclaimd!');
        }
    } catch (error) {
        console.error('Error claiming reward:', error);
        alert('Er ging iets mis bij het claimen van de reward.');
    }
} 