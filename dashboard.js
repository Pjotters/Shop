import { auth } from './firebase-config.js';
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
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const auth = getAuth();
    
    // Luister naar auth state veranderingen
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Geen ingelogde gebruiker, redirect naar login
            window.location.href = '/login.html';
            return;
        }
        
        // Gebruiker is ingelogd, initialiseer dashboard
        const dashboard = new Dashboard();
        dashboard.initializeDashboard();
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
        const auth = getAuth();
        if (!auth.currentUser) {
            window.location.href = '/login.html';
            return;
        }
        
        this.initializeTabs();
        this.initializeAnimations();
        this.showTutorial();
        this.initializeNotifications();
        this.loadUserProfile();
        this.currentTutorialStep = 0;
        this.tutorialSteps = [
            {
                element: '.tab-navigation',
                message: 'Gebruik de tabs om te navigeren tussen verschillende secties!',
                position: 'bottom'
            },
            {
                element: '.games-grid',
                message: 'Speel je favoriete games en verdien punten voor korting!',
                position: 'right'
            },
            {
                element: '.battle-pass-section',
                message: 'Unlock beloningen in de Battle Pass!',
                position: 'left'
            }
        ];
        this.currentTab = 'games';
        this.services = {
            battlePass: new BattlePassService(),
            miniGames: new MiniGamesService(),
            missions: new MissionsService(),
            powerUps: new PowerUpsService()
        };
        this.initializeDashboard();
    }

    initializeTabs() {
        const tabLinks = document.querySelectorAll('.nav-link');
        const tabContents = document.querySelectorAll('.tab-pane');

        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');

                // Verwijder active class van alle tabs
                tabLinks.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Voeg active class toe aan geselecteerde tab
                link.classList.add('active');
                document.getElementById(tabId)?.classList.add('active');

                // Animeer de nieuwe content
                this.animateTabContent(tabId);
            });
        });
    }

    animateTabContent(tabId) {
        const content = document.getElementById(tabId);
        if (!content) return;

        content.style.animation = 'none';
        content.offsetHeight; // Force reflow
        content.style.animation = 'fadeIn 0.5s ease forwards';
    }

    initializeAnimations() {
        // Animeer getallen (punten, levels, etc.)
        this.numberAnimator = {
            animate: (element, start, end, duration = 1000) => {
                const startTime = performance.now();
                const updateNumber = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing functie voor soepele animatie
                    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                    const current = Math.floor(start + (end - start) * easeOutQuart);
                    
                    element.textContent = current.toLocaleString();
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateNumber);
                    }
                };
                requestAnimationFrame(updateNumber);
            }
        };

        // Animeer nieuwe achievements
        this.achievementAnimator = {
            show: (achievement) => {
                const notification = document.createElement('div');
                notification.className = 'achievement-notification';
                notification.innerHTML = `
                    <i class="fas fa-trophy"></i>
                    <div class="achievement-details">
                        <h4>Nieuwe Prestatie!</h4>
                        <p>${achievement.title}</p>
                    </div>
                `;
                document.body.appendChild(notification);
                
                // Animatie sequence
                setTimeout(() => notification.classList.add('show'), 100);
                setTimeout(() => {
                    notification.classList.add('hide');
                    setTimeout(() => notification.remove(), 500);
                }, 3000);
            }
        };
    }

    initializeNotifications() {
        this.notificationSystem = {
            show: (message, type = 'info') => {
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.innerHTML = `
                    <i class="fas ${this.getNotificationIcon(type)}"></i>
                    <p>${message}</p>
                `;
                
                const container = document.querySelector('.notification-container') 
                    || this.createNotificationContainer();
                
                container.appendChild(notification);
                
                // Animatie sequence met CSS classes
                requestAnimationFrame(() => {
                    notification.classList.add('slide-in');
                    setTimeout(() => {
                        notification.classList.add('slide-out');
                        setTimeout(() => notification.remove(), 300);
                    }, 3000);
                });
            }
        };
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
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

    showTutorial() {
        const tutorialSteps = [
            {
                title: 'Welkom bij de Battle Pass!',
                message: 'Verdien Pjotters-Munten door games te spelen en unlock gave beloningen!',
                position: 'center'
            },
            {
                element: '.rewards-grid',
                title: 'Rewards Track',
                message: 'Hier zie je alle beschikbare beloningen. Klik op een reward om deze te claimen!',
                position: 'bottom'
            },
            {
                element: '.coin-display',
                title: 'Jouw Munten',
                message: 'Hier zie je hoeveel Pjotters-Munten je hebt verzameld.',
                position: 'left'
            }
        ];

        let currentStep = 0;

        const showStep = (step) => {
            const overlay = document.createElement('div');
            overlay.className = 'tutorial-overlay active';
            
            const popup = document.createElement('div');
            popup.className = 'tutorial-step';
            popup.innerHTML = `
                <h3>${tutorialSteps[step].title}</h3>
                <p>${tutorialSteps[step].message}</p>
                <button class="tutorial-next">
                    ${step === tutorialSteps.length - 1 ? 'Afronden' : 'Volgende'}
                </button>
            `;

            overlay.appendChild(popup);
            document.body.appendChild(overlay);

            popup.querySelector('.tutorial-next').addEventListener('click', () => {
                overlay.remove();
                if (step < tutorialSteps.length - 1) {
                    showStep(step + 1);
                }
            });
        };

        showStep(0);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <p>${message}</p>
        `;

        const container = document.querySelector('.notification-container') || 
            (() => {
                const cont = document.createElement('div');
                cont.className = 'notification-container';
                document.body.appendChild(cont);
                return cont;
            })();

        container.appendChild(notification);
        
        // Animatie toevoegen
        setTimeout(() => notification.classList.add('slide-in'), 100);
        
        // Automatisch verwijderen na 3 seconden
        setTimeout(() => {
            notification.classList.add('slide-out');
            setTimeout(() => notification.remove(), 3000);
        }, 3000);
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

        this.initializeRewardListeners();
    }

    // Verbeterde tutorial met animaties
    showTutorialStep(step) {
        const overlay = document.querySelector('.tutorial-overlay');
        const content = document.querySelector('.tutorial-content');
        
        content.style.opacity = '0';
        content.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            content.innerHTML = this.getTutorialStepContent(step);
            content.style.opacity = '1';
            content.style.transform = 'scale(1)';
        }, 300);

        this.highlightElement(this.tutorialSteps[step].element);
    }

    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.animation = 'pulse 2s infinite';
    }

    async loadTabContent(tabId) {
        const contentMap = {
            'games': this.loadGamesContent,
            'battle-pass': this.loadBattlePassContent,
            'shop': this.loadShopContent,
            'achievements': this.loadAchievementsContent
        };

        if (contentMap[tabId]) {
            await contentMap[tabId].call(this);
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

    async loadBattlePassContent() {
        const battlePassGrid = document.querySelector('.rewards-grid');
        const user = auth.currentUser;
        
        if (!user) return;

        try {
            const battlePassSnap = await get(dbRef.battlePass(user.uid));
            const battlePassData = battlePassSnap.val();
            
            const rewards = this.services.battlePass.rewards;
            let rewardsHTML = '';

            Object.entries(rewards).forEach(([id, reward]) => {
                const isClaimed = battlePassData.claimedRewards[id];
                const canClaim = battlePassData.coins >= reward.cost;
                
                rewardsHTML += `
                    <div class="reward-item ${isClaimed ? 'claimed' : ''} ${!canClaim ? 'locked' : ''}"
                         data-reward-id="${id}">
                        <div class="reward-icon">
                            <i class="fas ${this.getRewardIcon(reward.type)}"></i>
                        </div>
                        <div class="reward-info">
                            ${reward.rarity ? `<span class="rarity-badge">${reward.rarity}</span>` : ''}
                            <h4>${reward.name || `${reward.amount} Coins`}</h4>
                        </div>
                        <div class="coin-cost">
                            <i class="fas fa-coins"></i> ${reward.cost}
                        </div>
                    </div>
                `;
            });

            battlePassGrid.innerHTML = rewardsHTML;
            this.initializeRewardListeners();
            
        } catch (error) {
            console.error('Battle Pass laden mislukt:', error);
            this.showError('Kon Battle Pass niet laden');
        }
    }

    async loadShopContent() {
        const shopGrid = document.querySelector('.shop-grid');
        const items = await this.fetchShopItems();
        
        shopGrid.innerHTML = items.map(item => `
            <div class="shop-item">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="item-price">
                    <i class="fas fa-coins"></i> ${item.price}
                </div>
                <button class="buy-button" data-item-id="${item.id}">
                    Kopen
                </button>
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

    initializeRewardListeners() {
        // Reward claim knoppen
        document.querySelectorAll('.reward-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (item.classList.contains('locked')) return;
                
                const rewardId = item.dataset.rewardId;
                try {
                    const reward = await this.services.battlePass.claimReward(
                        auth.currentUser.uid,
                        rewardId
                    );
                    
                    // Animatie en feedback
                    item.classList.add('claimed');
                    this.showNotification(`Je hebt ${reward.name || reward.amount + ' Coins'} geclaimd!`);
                    
                    // Update coins display
                    this.updateCoinsDisplay();
                } catch (error) {
                    this.showError(error.message);
                }
            });
        });

        // Navigatie knoppen
        const prevBtn = document.querySelector('.nav-btn.prev');
        const nextBtn = document.querySelector('.nav-btn.next');
        const pageIndicator = document.querySelector('.page-indicator');

        prevBtn.addEventListener('click', () => {
            if (this.services.battlePass.currentPage > 1) {
                this.services.battlePass.currentPage--;
                this.loadBattlePassContent();
                pageIndicator.textContent = `PAGINA ${this.services.battlePass.currentPage} / ${this.services.battlePass.totalPages}`;
            }
        });

        nextBtn.addEventListener('click', () => {
            if (this.services.battlePass.currentPage < this.services.battlePass.totalPages) {
                this.services.battlePass.currentPage++;
                this.loadBattlePassContent();
                pageIndicator.textContent = `PAGINA ${this.services.battlePass.currentPage} / ${this.services.battlePass.totalPages}`;
            }
        });
    }
}

// Start de dashboard met alle animaties
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
}); 