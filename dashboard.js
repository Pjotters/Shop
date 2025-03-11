import { auth, db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { requireAuth } from './auth-helper.js';
import { ShopService } from './services/shop-service.js';
import { CouponService } from './services/coupon-service.js';
import { QuizService } from './services/quiz-service.js';
import { AchievementService } from './services/achievement-service.js';
import { LeaderboardService } from './services/leaderboard-service.js';

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
        this.shopService = new ShopService();
        this.couponService = new CouponService();
        this.quizService = new QuizService();
        this.achievementService = new AchievementService();
        this.leaderboardService = new LeaderboardService();
        
        this.setupEventListeners();
        this.loadUserCoupons();
        this.initializeDashboard();
        this.showTutorial();
    }

    setupEventListeners() {
        document.querySelectorAll('.buy-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const itemId = e.target.dataset.itemId;
                const cost = parseInt(e.target.dataset.cost);
                
                try {
                    await this.shopService.purchaseItem(auth.currentUser.uid, {
                        id: itemId,
                        cost: cost
                    });
                    
                    alert('Aankoop succesvol! Check je email voor je bonus coupon!');
                    this.loadUserCoupons(); // Ververs coupon lijst
                } catch (error) {
                    alert(error.message);
                }
            });
        });
    }

    async loadUserCoupons() {
        const couponsGrid = document.querySelector('.coupons-grid');
        const coupons = await this.couponService.getUserCoupons(auth.currentUser.uid);
        
        couponsGrid.innerHTML = coupons.map(coupon => `
            <div class="coupon-card">
                <h4>Coupon: ${coupon.title}</h4>
                <p>Code: ${coupon.code}</p>
                <p>Waarde: ${coupon.pointsValue} punten</p>
                <p>Geldig tot: ${new Date(coupon.expiryDate).toLocaleDateString()}</p>
            </div>
        `).join('');
    }

    async initializeDashboard() {
        await this.loadDailyQuiz();
        await this.loadAchievements();
        await this.loadLeaderboard();
        this.updateLevelProgress();
    }

    calculateLevel(points) {
        const level = Math.floor(points / 1000) + 1;
        const progress = (points % 1000) / 10; // percentage tot volgend level
        return { level, progress };
    }

    async loadDailyQuiz() {
        const question = await this.quizService.getDailyQuestion(auth.currentUser.uid);
        const container = document.getElementById('quizContainer');
        
        if (!question) {
            container.innerHTML = `
                <div class="quiz-completed">
                    <h3>🎯 Quiz Voltooid!</h3>
                    <p>Je hebt de dagelijkse quiz al gespeeld. Kom morgen terug voor een nieuwe uitdaging!</p>
                    <div class="countdown">Volgende quiz over: <span id="quizCountdown">24:00:00</span></div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="quiz-question">
                <h3>🤔 ${question.question}</h3>
                <div class="quiz-answers">
                    ${question.answers.map((answer, index) => `
                        <button class="quiz-answer" data-index="${index}">
                            <span class="answer-letter">${['A', 'B', 'C', 'D'][index]}</span>
                            ${answer}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Voeg event listeners toe voor antwoorden
        container.querySelectorAll('.quiz-answer').forEach(button => {
            button.addEventListener('click', async (e) => {
                const result = await this.handleQuizAnswer(question.date, parseInt(e.target.dataset.index));
                this.showQuizResult(result);
            });
        });
    }

    showQuizResult(correct) {
        const container = document.getElementById('quizContainer');
        container.innerHTML = `
            <div class="quiz-result ${correct ? 'correct' : 'incorrect'}">
                <h3>${correct ? '🎉 Goed gedaan!' : '😅 Helaas!'}</h3>
                <p>${correct ? '+100 punten!' : 'Volgende keer beter!'}</p>
                <div class="points-animation">+100</div>
            </div>
        `;
    }

    async loadAchievements() {
        // Implementeer de logica om achievements te laden
    }

    async loadLeaderboard() {
        // Implementeer de logica om leaderboard te laden
    }

    updateLevelProgress() {
        // Implementeer de logica om level progressie te updaten
    }

    handleQuizAnswer(date, answerIndex) {
        // Implementeer de logica om antwoord te verwerken
    }

    showTutorial() {
        const tutorialHTML = `
            <div class="tutorial-overlay">
                <div class="tutorial-modal">
                    <h2>👋 Welkom bij Pjotters Games!</h2>
                    <div class="tutorial-steps">
                        <div class="tutorial-step">
                            <i class="fas fa-gamepad"></i>
                            <h3>Speel Games voor Korting</h3>
                            <p>Kies uit verschillende games en verdien punten!</p>
                        </div>
                        <div class="tutorial-step">
                            <i class="fas fa-question-circle"></i>
                            <h3>Dagelijkse Quiz</h3>
                            <p>Beantwoord dagelijks een vraag voor 100 bonus punten!</p>
                        </div>
                        <div class="tutorial-step">
                            <i class="fas fa-trophy"></i>
                            <h3>Verdien Achievements</h3>
                            <p>Ontgrendel speciale prestaties en krijg extra beloningen!</p>
                        </div>
                    </div>
                    <button class="tutorial-close">Start je avontuur!</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', tutorialHTML);
        
        const tutorial = document.querySelector('.tutorial-overlay');
        const closeButton = document.querySelector('.tutorial-close');
        
        closeButton.addEventListener('click', () => {
            tutorial.classList.add('tutorial-fade-out');
            setTimeout(() => tutorial.remove(), 500);
        });
    }
}

// Initialiseer dashboard
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
}); 