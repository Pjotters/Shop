import { auth, db } from './firebase-config.js';
import { ref, onValue, get } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { requireAuth } from './auth-helper.js';
import { ShopService } from './services/shop-service.js';
import { CouponService } from './services/coupon-service.js';
import { QuizService } from './services/quiz-service.js';   
import { AchievementService } from './services/achievement-service.js';
import { LeaderboardService } from './services/leaderboard-service.js';
import { BattlePassService } from './services/battle-pass-service.js';
import { MiniGamesService } from './services/mini-games-service.js';
import { MissionsService } from './services/missions-service.js';
import { PowerUpsService } from './services/power-ups-service.js';

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
    constructor() {
        this.loadUserProfile();
        this.initializeAnimations();
        this.setupEventListeners();
        this.currentTutorialStep = 0;
        this.tutorialSteps = [
            {
                element: '.tab-navigation',
                message: 'Gebruik de tabs om te navigeren tussen verschillende secties!',
                position: 'bottom'
            },
            {
                element: '.games-grid',
                message: 'Speel je favoriete games en verdien punten!',
                position: 'right'
            },
            {
                element: '.battle-pass-section',
                message: 'Unlock beloningen in de Battle Pass!',
                position: 'left'
            }
        ];
        this.currentTab = 'games';
        this.initializeTabs();
        this.initializeTutorial();
        this.services = {
            battlePass: new BattlePassService(),
            miniGames: new MiniGamesService(),
            missions: new MissionsService(),
            powerUps: new PowerUpsService()
        };
        this.initializeDashboard();
    }

    async loadUserProfile() {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        // Update UI elementen
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userPoints').textContent = userData.points.toLocaleString();
        document.getElementById('userLevel').textContent = this.calculateLevel(userData.points);
        document.getElementById('achievementCount').textContent = 
            Object.keys(userData.achievements || {}).length;

        // Update subscription badge
        const subType = userData.subscription?.type || 'basic';
        const subBadge = document.getElementById('subscriptionType');
        subBadge.textContent = subType.charAt(0).toUpperCase() + subType.slice(1);
        subBadge.className = `subscription-badge ${subType}`;

        // Laad avatar als aanwezig
        if (userData.avatar) {
            document.getElementById('userAvatar').src = userData.avatar;
        }
    }

    calculateLevel(points) {
        return Math.floor(Math.sqrt(points / 100)) + 1;
    }

    initializeAnimations() {
        // Voeg entry animaties toe met delays
        document.querySelectorAll('.game-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });

        document.querySelectorAll('.mini-game-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });

        // Tab wissel animaties
        this.setupTabTransitions();
    }

    setupTabTransitions() {
        const tabs = document.querySelectorAll('.tab-pane');
        tabs.forEach(tab => {
            tab.addEventListener('transitionend', () => {
                if (!tab.classList.contains('active')) {
                    tab.style.display = 'none';
                }
            });
        });
    }

    switchTab(tabId) {
        const oldTab = document.querySelector('.tab-pane.active');
        const newTab = document.getElementById(tabId);

        oldTab.style.animation = 'fadeOut 0.3s ease forwards';
        
        setTimeout(() => {
            oldTab.classList.remove('active');
            newTab.style.display = 'block';
            newTab.style.animation = 'fadeIn 0.3s ease forwards';
            newTab.classList.add('active');
            
            // Reset animaties voor nieuwe tab inhoud
            this.initializeAnimations();
        }, 300);
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });
    }

    initializeTutorial() {
        if (!localStorage.getItem('tutorialCompleted')) {
            this.showTutorial();
        }
    }

    showTutorial() {
        const tutorial = document.getElementById('tutorial');
        tutorial.classList.add('active');
        this.showTutorialStep(0);
    }

    showTutorialStep(stepIndex) {
        const step = this.tutorialSteps[stepIndex];
        const element = document.querySelector(step.element);
        
        // Verwijder vorige highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        // Voeg nieuwe highlight toe
        element.classList.add('tutorial-highlight');
        
        // Toon tutorial bericht
        this.showTutorialMessage(step.message, element, step.position);
    }

    async initializeDashboard() {
        const user = auth.currentUser;
        if (!user) return;

        await Promise.all([
            this.services.battlePass.initializeBattlePass(user.uid),
            this.loadMiniGames(user.uid),
            this.loadDailyMissions(user.uid),
            this.loadActivePowerUps(user.uid)
        ]);

        this.setupEventListeners();
    }

    async loadMiniGames(userId) {
        const miniGamesData = await this.services.miniGames.getUserMiniGamesData(userId);
        this.renderMiniGames(miniGamesData);
    }

    async loadDailyMissions(userId) {
        const missions = await this.services.missions.getDailyMissions(userId);
        this.renderDailyMissions(missions);
    }

    async loadActivePowerUps(userId) {
        const powerUps = await this.services.powerUps.getActivePowerUps(userId);
        this.renderPowerUps(powerUps);
    }

    setupEventListeners() {
        // Event listeners voor alle nieuwe UI elementen
        document.querySelectorAll('.mini-game-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                const gameType = e.currentTarget.dataset.game;
                try {
                    const gameSession = await this.services.miniGames.startMiniGame(
                        auth.currentUser.uid,
                        gameType
                    );
                    this.startMiniGame(gameType, gameSession);
                } catch (error) {
                    alert(error.message);
                }
            });
        });
    }
}

// Initialiseer dashboard
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
}); 