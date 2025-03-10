import { auth, db } from './firebase-config.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { requireAuth } from './auth-helper.js';
import { ShopService } from './services/shop-service.js';
import { CouponService } from './services/coupon-service.js';

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
        this.setupEventListeners();
        this.loadUserCoupons();
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
}

// Initialiseer dashboard
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
}); 