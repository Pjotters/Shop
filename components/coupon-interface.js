import { db, auth, ref, get, update } from '../firebase-config.js';

class CouponInterface {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const claimButtons = document.querySelectorAll('.claim-btn');
        claimButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const rewardId = e.target.dataset.reward;
                await this.claimReward(rewardId);
            });
        });
    }

    async claimReward(rewardId) {
        const user = auth.currentUser;
        if (!user) {
            alert('Je moet ingelogd zijn om rewards te claimen!');
            return;
        }

        try {
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();

            const reward = this.getRewardDetails(rewardId);
            if (userData.points < reward.cost) {
                alert('Niet genoeg punten!');
                return;
            }

            // Genereer coupon code
            const couponCode = this.generateCouponCode();
            
            // Update gebruiker punten en voeg coupon toe
            const updates = {
                points: userData.points - reward.cost,
                [`coupons/${couponCode}`]: {
                    type: rewardId,
                    value: reward.value,
                    createdAt: new Date().toISOString(),
                    used: false
                }
            };

            await update(userRef, updates);
            
            // Stuur email met coupon
            await this.sendCouponEmail(user.email, couponCode, reward);
            
            alert(`Je coupon code is: ${couponCode}\nCheck je email voor meer details!`);
            
        } catch (error) {
            console.error('Claim error:', error);
            alert('Er ging iets mis bij het claimen van de reward.');
        }
    }

    getRewardDetails(rewardId) {
        const rewards = {
            coupon5: { cost: 500, value: 5, title: '€5 Korting' },
            coupon10: { cost: 1000, value: 10, title: '€10 Korting' },
            coupon20: { cost: 2000, value: 20, title: '€20 Korting' }
        };
        return rewards[rewardId];
    }

    generateCouponCode() {
        return 'PJ-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    async sendCouponEmail(email, code, reward) {
        // Email verzending logica hier
        console.log(`Email verzonden naar ${email} met coupon ${code}`);
    }
}

export default CouponInterface; 