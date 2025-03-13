import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase, ref, onValue, get, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { BattlePassService } from './services/battlepass-service.js';
import { GamesService } from './services/games-service.js';
import { DailyChallengesService } from './services/daily-challenges-service.js';
import { AchievementService } from './services/achievement-service.js';
import { QuizService } from './services/quiz-service.js';

const firebaseConfig = {
    apiKey: "AIzaSyBCXaYJI9dxwqKD1Qsb_9AOdsnVTPG2uHM",
    authDomain: "pjotters-company.firebaseapp.com",
    databaseURL: "https://pjotters-company-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pjotters-company",
    storageBucket: "pjotters-company.appspot.com",
    messagingSenderId: "64413422793",
    appId: "1:64413422793:web:b85d4d5f3a5f2c5c6c1f0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Basis services
class DashboardServices {
    constructor(user) {
        this.user = user;
        this.db = getDatabase();
        this.dailyChallenges = new DailyChallengesService(user.uid);
        this.achievements = new AchievementService(user.uid);
        this.quizService = new QuizService(user.uid);
        this.gamesService = new GamesService(user.uid);
        this.setupTabNavigation();
        this.initializeGameButtons();
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab-target');
                this.switchTab(target);
            });
        });
    }

    async switchTab(targetId) {
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        const targetPane = document.querySelector(targetId);
        const targetBtn = document.querySelector(`[data-tab-target="${targetId}"]`);
        
        if (targetPane && targetBtn) {
            targetPane.classList.add('active');
            targetBtn.classList.add('active');
            
            // Laad content gebaseerd op tab
            if (targetId === '#shop') {
                await this.loadShopItems();
            } else if (targetId === '#games') {
                await this.loadGames();
            } else if (targetId === '#battlepass') {
                await this.loadBattlePass();
            } else if (targetId === '#quiz') {
                await this.loadDailyQuiz();
            }
        }
    }

    async loadGames() {
        const gamesGrid = document.querySelector('.games-grid');
        if (!gamesGrid) return;

        const games = Object.values(this.gamesService.games);

        // Filter functionaliteit
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const filteredGames = filter === 'all' 
                    ? games 
                    : games.filter(game => game.status === filter);
                
                renderGames(filteredGames);
            });
        });

        const renderGames = async (gamesToRender) => {
            const gamesHTML = await Promise.all(gamesToRender.map(async game => {
                const stats = await this.gamesService.getGameStats(game.id);
                return `
                    <div class="game-card ${game.status}">
                        <div class="game-icon">${game.icon}</div>
                        <div class="game-info">
                            <h3>${game.name}</h3>
                            <p>${game.description}</p>
                            <div class="game-stats">
                                <span><i class="fas fa-trophy"></i> ${stats.highScore}</span>
                                <span><i class="fas fa-gamepad"></i> ${stats.playCount}x</span>
                            </div>
                            <button onclick="startGame('${game.id}')" class="play-btn">
                                <i class="fas fa-play"></i> Spelen
                            </button>
                        </div>
                    </div>
                `;
            }));

            gamesGrid.innerHTML = gamesHTML.join('');
        };

        // Initiële render
        renderGames(games);

        // Voeg globale startGame functie toe
        window.startGame = async (gameId) => {
            await this.startGame(gameId);
        };
    }

    async loadShopItems() {
        const shopContainer = document.querySelector('.shop-items');
        if (!shopContainer) return;

        // Gebruik de shopItems uit shop.js
        const shopItems = {
            characterSkins: [
                { id: 'flappy_gold', name: 'Gouden Vogel', price: 1000, image: 'images/shop/flappy-gold.png', game: 'flappyBird' },
                { id: 'snake_neon', name: 'Neon Slang', price: 800, image: 'images/shop/snake-neon.png', game: 'snake' }
            ],
            powerUps: [
                { id: 'double_points', name: 'Dubbele Punten', price: 500, duration: '24 uur', description: 'Verdien 2x zoveel punten in alle games' },
                { id: 'shield', name: 'Schild', price: 300, duration: '1 game', description: 'Één extra leven per game' }
            ]
        };

        shopContainer.innerHTML = `
            <div class="shop-header">
                <h2><i class="fas fa-store"></i> Game Shop</h2>
                <div class="points-display">
                    <i class="fas fa-coins"></i> ${document.getElementById('totalPoints').textContent} punten
                </div>
            </div>
            <div class="shop-content">
                ${Object.entries(shopItems).map(([category, items]) => `
                    <div class="shop-category">
                        <h3>${category === 'characterSkins' ? 'Karakter Skins' : 'Power-ups'}</h3>
                        <div class="items-grid">
                            ${items.map(item => `
                                <div class="shop-item">
                                    ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<i class="fas fa-bolt"></i>'}
                                    <h4>${item.name}</h4>
                                    ${item.description ? `<p>${item.description}</p>` : ''}
                                    ${item.duration ? `<p><i class="fas fa-clock"></i> ${item.duration}</p>` : ''}
                                    <p class="price"><i class="fas fa-coins"></i> ${item.price}</p>
                                    <button onclick="window.buyItem('${item.id}', ${item.price})" class="buy-btn">
                                        <i class="fas fa-shopping-cart"></i> Kopen
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Voeg de buyItem functie toe aan window scope
        window.buyItem = async (itemId, price) => {
            try {
                const userRef = ref(this.db, `users/${this.user.uid}`);
                const snapshot = await get(userRef);
                const userData = snapshot.val();

                if (userData.points < price) {
                    alert('Niet genoeg punten!');
                    return;
                }

                await update(userRef, {
                    points: userData.points - price,
                    [`inventory/${itemId}`]: {
                        purchaseDate: new Date().toISOString(),
                        active: true
                    }
                });

                document.getElementById('totalPoints').textContent = userData.points - price;
                alert('Aankoop succesvol!');
            } catch (error) {
                console.error('Aankoop fout:', error);
                alert('Er ging iets mis bij de aankoop');
            }
        };
    }

    async loadBattlePass() {
        const battlepassContainer = document.querySelector('.battlepass-content');
        if (!battlepassContainer) return;

        const battlePassService = new BattlePassService(this.user.uid);
        const currentTier = await battlePassService.getCurrentTier();
        
        // Update rewards grid
        const rewardsGrid = battlepassContainer.querySelector('.rewards-grid');
        if (rewardsGrid) {
            rewardsGrid.innerHTML = battlePassService.rewards.map(reward => `
                <div class="reward-item ${reward.rarity}" data-reward-id="${reward.id}">
                    <img src="images/rewards/${reward.type}.png" alt="${reward.name}">
                    <div class="reward-cost">${reward.cost}★</div>
                    ${!reward.claimed ? `
                        <button class="claim-button" onclick="claimReward(${reward.id})">
                            CLAIM
                        </button>
                    ` : ''}
                </div>
            `).join('');
        }
    }

    async loadDailyQuiz() {
        const quizContent = document.getElementById('quizContent');
        if (!quizContent) return;

        const question = await this.quizService.getDailyQuestion();
        
        if (question.completed) {
            quizContent.innerHTML = `
                <div class="quiz-completed">
                    <h4>Je hebt de quiz van vandaag al voltooid!</h4>
                    <p>Kom morgen terug voor een nieuwe vraag.</p>
                    ${question.correct ? 
                        `<div class="quiz-reward">
                            <p>Je verdiende: <span>+${question.points} 🪙</span> <span>+${question.xp} XP</span></p>
                        </div>` : 
                        '<p>Helaas was je antwoord niet correct.</p>'
                    }
                </div>
            `;
            return;
        }

        quizContent.innerHTML = `
            <div class="quiz-question">${question.question}</div>
            <div class="quiz-answers">
                ${question.answers.map((answer, index) => `
                    <button class="quiz-answer" data-index="${index}">
                        ${answer}
                    </button>
                `).join('')}
            </div>
            <div class="quiz-explanation"></div>
        `;

        // Event listeners voor antwoorden
        quizContent.querySelectorAll('.quiz-answer').forEach(button => {
            button.addEventListener('click', async () => {
                const answerIndex = parseInt(button.dataset.index);
                const result = await this.quizService.submitAnswer(question.id, answerIndex);
                
                this.showQuizResult(result, button);
            });
        });
    }

    showQuizResult(result, selectedButton) {
        const answers = document.querySelectorAll('.quiz-answer');
        answers.forEach(answer => answer.disabled = true);
        
        selectedButton.classList.add(result.correct ? 'correct' : 'incorrect');
        
        const explanation = document.querySelector('.quiz-explanation');
        explanation.innerHTML = `
            <p><i class="fas ${result.correct ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
            ${result.explanation}</p>
            <div class="quiz-rewards">
                <span>+${result.points} 🪙</span>
                <span>+${result.xp} XP</span>
            </div>
        `;
        explanation.classList.add('show');
    }

    initializeGameButtons() {
        document.querySelectorAll('.game-card button').forEach(button => {
            const gameId = button.closest('.game-card').dataset.gameId;
            button.addEventListener('click', () => this.startGame(gameId));
        });
    }

    async startGame(gameId) {
        await this.gamesService.startGameSession(gameId);
        window.location.href = `/games/${gameId}.html`;
    }
}

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

        // Initialize services
        const services = new DashboardServices(user);

        // Load user data
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, async (snapshot) => {
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

            // Load games
            await services.loadGames();
            await services.loadShopItems();
            await services.loadBattlePass();
            await services.loadDailyQuiz();

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

class Dashboard {
    constructor(userId) {
        this.userId = userId;
        this.gamesService = new GamesService(userId);
        this.initializeDashboard();
        this.initializeGameLauncher();
    }

    initializeGameLauncher() {
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const gameId = e.target.closest('.game-card').dataset.gameId;
                this.launchGame(gameId);
            });
        });
    }

    async launchGame(gameId) {
        try {
            // Start een nieuwe game sessie
            await this.gamesService.startGameSession(gameId);
            
            // Navigeer naar de game pagina
            window.location.href = `games/${gameId}/index.html`;
        } catch (error) {
            console.error('Fout bij het starten van de game:', error);
            alert('Er is een fout opgetreden bij het starten van de game.');
        }
    }

    createGameCard(game) {
        return `
            <div class="game-card" data-game-id="${game.id}">
                <div class="game-icon">${game.icon}</div>
                <h3>${game.name}</h3>
                <p>${game.description}</p>
                <div class="game-stats">
                    <span class="highscore">
                        <i class="fas fa-trophy"></i> ${game.highScore || 0}
                    </span>
                    <span class="plays">
                        <i class="fas fa-gamepad"></i> ${game.playCount || 0}x
                    </span>
                </div>
                <button class="play-button">Spelen</button>
            </div>
        `;
    }

    async initializeDashboard() {
        const gamesContainer = document.querySelector('.games-container');
        const games = this.gamesService.games;

        for (const [gameId, game] of Object.entries(games)) {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = this.createGameCard(game);
            
            gamesContainer.appendChild(gameCard);
        }
    }
}

// Initialiseer dashboard wanneer de pagina laadt
document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.currentUser;
    if (user) {
        const dashboard = new Dashboard(user.uid);
    }
}); 