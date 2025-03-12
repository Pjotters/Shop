import { auth, db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { requireAuth } from './auth-helper.js';
import { ShopService } from './services/shop-service.js';
import { QuizService } from './services/quiz-service.js';   
import { AchievementService } from './services/achievement-service.js';
import { LeaderboardService } from './services/leaderboard-service.js';
import { BattlePassService } from './services/battle-pass-service.js';
import { MiniGamesService } from './services/mini-games-service.js';
import { MissionsService } from './services/missions-service.js';
import { PowerUpsService } from './services/power-ups-service.js';

document.addEventListener('DOMContentLoaded', () => {
    onValue(ref(db, '.info/connected'), (snapshot) => {
        const connected = snapshot.val();
        if (!connected) {
            console.error('Geen verbinding met Firebase');
        }
    });

    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.replace('/login.html');
            return;
        }
        new Dashboard(user);
    });
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
    
    const animate = () => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end;
            return;
        }
        element.textContent = Math.round(current);
        requestAnimationFrame(animate);
    };
    
    animate();
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
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            await this.loadUserData();
            this.initializeTabs();
            await this.loadGamesContent();
        } catch (error) {
            console.error('Dashboard initialisatie fout:', error);
            this.showError('Er ging iets mis bij het laden van het dashboard');
        }
    }

    async loadUserData() {
        try {
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
                    const currentPoints = parseInt(pointsElement.textContent) || 0;
                    const newPoints = userData.points || 0;
                    this.animateNumber(currentPoints, newPoints, pointsElement);
                }
            });
        } catch (error) {
            console.error('Gebruikersdata laden fout:', error);
            throw error;
        }
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const target = button.getAttribute('data-tab-target');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                button.classList.add('active');
                document.querySelector(target).classList.add('active');
                
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
        const gamesRef = ref(db, 'games');
        const snapshot = await get(gamesRef);
        const games = snapshot.val() || {};

        const gamesGrid = document.querySelector('.games-grid');
        gamesGrid.innerHTML = Object.entries(games).map(([id, game]) => `
            <div class="game-card">
                <img src="${game.image}" alt="${game.title}" onerror="this.src='images/placeholder.png'">
                <h3>${game.title}</h3>
                <div class="game-stats">
                    <span><i class="fas fa-trophy"></i> Highscore: ${game.highscore || 0}</span>
                    <span><i class="fas fa-clock"></i> Gespeeld: ${game.timesPlayed || 0}x</span>
                </div>
                <a href="/games/${id}.html" class="play-button">
                    <i class="fas fa-play"></i> Spelen
                </a>
            </div>
        `).join('');
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