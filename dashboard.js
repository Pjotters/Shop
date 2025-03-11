import { auth, db, ref, get, onValue } from './firebase-config.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { requireAuth } from './auth-helper.js';
import { ShopService } from './services/shop-service.js';
import { QuizService } from './services/quiz-service.js';   
import { AchievementService } from './services/achievement-service.js';
import { LeaderboardService } from './services/leaderboard-service.js';
import { BattlePassService } from './services/battle-pass-service.js';
import { MiniGamesService } from './services/mini-games-service.js';
import { MissionsService } from './services/missions-service.js';
import { PowerUpsService } from './services/power-ups-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const auth = getAuth();
        
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.replace('/login.html');
                return;
            }
            
            const dashboard = new Dashboard(user);
            await dashboard.initializeDashboard();
        });
    } catch (error) {
        console.error('Auth error:', error);
        window.location.replace('/login.html');
    }
});

function loadUserData(user) {
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val() || {};
        
        // Update welkomstboodschap
        const username = userData.username || user.email.split('@')[0];
        document.querySelector('.welcome-message').textContent = `Welkom terug, ${username}!`;
        
        // Update totale punten met animatie
        const pointsElement = document.getElementById('totalPoints');
        const currentPoints = parseInt(pointsElement.textContent);
        const newPoints = userData.points || 0;
        animateNumber(currentPoints, newPoints, pointsElement);
        
        // Update game statistieken
        updateGameStats(userData.games || {});
    });
}

function animateNumber(start, end, element) {
    const duration = 1000;
    const steps = 60;
    const increment = (end - start) / steps;
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            clearInterval(timer);
            element.textContent = end;
        } else {
            element.textContent = Math.round(current);
        }
    }, duration / steps);
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

class Dashboard {
    constructor(user) {
        this.user = user;
        this.services = {
            shop: new ShopService(),
            quiz: new QuizService(),
            achievements: new AchievementService(),
            battlePass: new BattlePassService()
        };
    }

    async initializeDashboard() {
        await this.loadUserData();
        this.initializeTabs();
        await this.loadGamesContent();
    }

    async loadUserData() {
        const userRef = ref(db, `users/${this.user.uid}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val() || {};
            
            // Update welkomstboodschap
            const username = userData.username || this.user.email.split('@')[0];
            const welcomeMessage = document.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welkom terug, ${username}!`;
            }
            
            // Update punten
            const pointsElement = document.getElementById('totalPoints');
            if (pointsElement) {
                pointsElement.textContent = userData.points || 0;
            }
        });
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const target = button.getAttribute('data-tab-target');
                
                // Verwijder active class van alle tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Voeg active class toe aan geselecteerde tab
                button.classList.add('active');
                document.querySelector(target).classList.add('active');
                
                // Laad content voor specifieke tab
                this.loadTabContent(target);
            });
        });
    }

    async loadTabContent(target) {
        switch(target) {
            case '#games':
                await this.loadGamesContent();
                break;
            case '#shop':
                await this.services.shop.loadShopItems();
                break;
            case '#achievements':
                await this.services.achievements.loadAchievements();
                break;
            case '#battlepass':
                await this.services.battlePass.loadBattlePass();
                break;
        }
    }

    async loadGamesContent() {
        const gamesGrid = document.querySelector('.games-grid');
        gamesGrid.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const games = await this.fetchGames();
            gamesGrid.innerHTML = games.map((game, index) => `
                <div class="game-card" style="animation-delay: ${index * 0.1}s">
                    <img src="${game.image}" alt="${game.title}">
                    <h3>${game.title}</h3>
                    <div class="game-stats">
                        <span><i class="fas fa-trophy"></i> Highscore: ${game.highscore}</span>
                        <span><i class="fas fa-clock"></i> Gespeeld: ${game.timesPlayed}x</span>
                    </div>
                    <button class="play-button" onclick="window.location.href='/games/${game.id}'">
                        Spelen
                    </button>
                </div>
            `).join('');
        } catch (error) {
            this.showError('Kon games niet laden');
        }
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Start de dashboard met alle animaties
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
}); 