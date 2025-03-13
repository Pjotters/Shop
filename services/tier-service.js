import { db } from '../firebase-config.js';
import { ref, get, update } from 'firebase/database';

export class TierService {
    constructor(userId) {
        this.userId = userId;
        this.tierLevels = {
            1: { xpNeeded: 0, stars: 5 },
            2: { xpNeeded: 1000, stars: 5 },
            3: { xpNeeded: 2500, stars: 10 },
            4: { xpNeeded: 4000, stars: 10 },
            5: { xpNeeded: 6000, stars: 15 },
            6: { xpNeeded: 8500, stars: 15 },
            7: { xpNeeded: 11000, stars: 20 },
            8: { xpNeeded: 14000, stars: 20 },
            9: { xpNeeded: 17500, stars: 25 },
            10: { xpNeeded: 21000, stars: 25 },
            11: { xpNeeded: 25000, stars: 30 },
            12: { xpNeeded: 29000, stars: 30 },
            13: { xpNeeded: 33000, stars: 35 },
            14: { xpNeeded: 37000, stars: 35 }
        };
    }

    async addExperience(amount) {
        const userRef = ref(db, `users/${this.userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        
        const currentXP = userData.battlepass?.experience || 0;
        const currentTier = userData.battlepass?.tier || 1;
        const currentStars = userData.battlepass?.stars || 0;
        
        const newXP = currentXP + amount;
        const newTier = this.calculateTier(newXP);
        const earnedStars = this.calculateEarnedStars(currentTier, newTier);
        
        await update(userRef, {
            'battlepass/experience': newXP,
            'battlepass/tier': newTier,
            'battlepass/stars': currentStars + earnedStars
        });

        return {
            newTier,
            earnedStars,
            totalStars: currentStars + earnedStars
        };
    }

    calculateTier(xp) {
        let tier = 1;
        for (let i = 14; i > 0; i--) {
            if (xp >= this.tierLevels[i].xpNeeded) {
                tier = i;
                break;
            }
        }
        return tier;
    }

    calculateEarnedStars(oldTier, newTier) {
        let stars = 0;
        for (let i = oldTier + 1; i <= newTier; i++) {
            stars += this.tierLevels[i].stars;
        }
        return stars;
    }
} 