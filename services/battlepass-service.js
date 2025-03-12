import { db } from '../firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

export class BattlePassService {
    constructor(userId) {
        this.userId = userId;
        this.currentTier = 1;
        this.maxTier = 14;
        this.rewards = [
            { id: 1, type: 'banner', rarity: 'uncommon', name: 'Reality Zero', cost: 3, claimed: false },
            { id: 2, type: 'currency', amount: 100, rarity: 'common', cost: 2, claimed: false },
            { id: 3, type: 'skin', name: 'Cyber Warrior', rarity: 'rare', cost: 4, claimed: false },
            { id: 4, type: 'emote', name: 'Victory Dance', rarity: 'uncommon', cost: 3, claimed: false },
            // Voeg meer rewards toe
        ];
    }

    async getCurrentTier() {
        const userRef = ref(db, `users/${this.userId}/battlepass`);
        const snapshot = await get(userRef);
        const data = snapshot.val() || { tier: 1, points: 0 };
        return data;
    }

    async claimReward(rewardId) {
        const userRef = ref(db, `users/${this.userId}`);
        const battlepassRef = ref(db, `users/${this.userId}/battlepass/rewards/${rewardId}`);
        
        try {
            await update(battlepassRef, {
                claimed: true,
                claimedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Fout bij claimen reward:', error);
            return false;
        }
    }
} 