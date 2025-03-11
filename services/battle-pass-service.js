import { db } from '../firebase-config.js';
import { ref, get, set, update } from 'firebase/database';

export class BattlePassService {
    constructor() {
        this.currentSeason = 1;
        this.tiers = {
            1: { 
                reward: { type: 'avatar', item: 'space_explorer', name: 'Space Explorer Avatar' },
                points: 100,
                type: 'free'
            },
            2: { 
                reward: { type: 'coins', amount: 200, name: '200 Coins Bonus' },
                points: 200,
                type: 'premium'
            },
            // ... meer tiers
            30: { 
                reward: { type: 'special_skin', item: 'golden_warrior', name: 'Golden Warrior Skin' },
                points: 3000,
                type: 'premium'
            }
        };
        this.premiumPrice = 1000;
        this.seasonEndDate = new Date('2024-08-31').getTime();
    }

    async initializeBattlePass(userId) {
        const userBattlePassRef = ref(db, `users/${userId}/battlePass`);
        const snapshot = await get(userBattlePassRef);

        if (!snapshot.exists()) {
            await set(userBattlePassRef, {
                season: this.currentSeason,
                tier: 1,
                points: 0,
                premium: false,
                claimedRewards: {}
            });
        }
    }

    async unlockPremium(userId) {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData.points < this.premiumPrice) {
            throw new Error('Niet genoeg punten voor Premium Battle Pass');
        }

        await update(userRef, {
            points: userData.points - this.premiumPrice,
            'battlePass/premium': true
        });

        return true;
    }

    async addBattlePassPoints(userId, points) {
        const userBattlePassRef = ref(db, `users/${userId}/battlePass`);
        const snapshot = await get(userBattlePassRef);
        const battlePassData = snapshot.val();

        const newPoints = battlePassData.points + points;
        const newTier = this.calculateTier(newPoints);

        await update(userBattlePassRef, {
            points: newPoints,
            tier: newTier
        });

        return {
            newPoints,
            newTier,
            tierUp: newTier > battlePassData.tier
        };
    }

    calculateTier(points) {
        let tier = 1;
        let totalRequired = 0;

        for (const [tierLevel, tierData] of Object.entries(this.tiers)) {
            totalRequired += tierData.points;
            if (points >= totalRequired) {
                tier = parseInt(tierLevel);
            } else {
                break;
            }
        }

        return tier;
    }

    async claimTierReward(userId, tier) {
        const userBattlePassRef = ref(db, `users/${userId}/battlePass`);
        const snapshot = await get(userBattlePassRef);
        const battlePassData = snapshot.val();

        if (battlePassData.tier < tier) {
            throw new Error('Je hebt dit tier nog niet bereikt');
        }

        if (battlePassData.claimedRewards[tier]) {
            throw new Error('Je hebt deze beloning al geclaimd');
        }

        const tierData = this.tiers[tier];
        if (tierData.type === 'premium' && !battlePassData.premium) {
            throw new Error('Deze beloning is alleen voor Premium leden');
        }

        // Beloning toevoegen aan gebruiker
        await this.addRewardToUser(userId, tierData.reward);

        // Markeer als geclaimd
        await update(userBattlePassRef, {
            [`claimedRewards/${tier}`]: true
        });

        return tierData.reward;
    }

    async addRewardToUser(userId, reward) {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        switch (reward.type) {
            case 'coins':
                await update(userRef, {
                    points: userData.points + reward.amount
                });
                break;
            case 'avatar':
                await update(userRef, {
                    [`inventory/avatars/${reward.item}`]: true
                });
                break;
            case 'special_skin':
                await update(userRef, {
                    [`inventory/skins/${reward.item}`]: true
                });
                break;
            // Voeg meer reward types toe indien nodig
        }
    }

    getTimeRemaining() {
        const now = new Date().getTime();
        const timeLeft = this.seasonEndDate - now;
        
        return {
            days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
            hours: Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
        };
    }
} 