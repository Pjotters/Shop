import { db } from '../firebase-config.js';
import { ref, get, update, set } from 'firebase/database';

export class BattlePassService {
    constructor(userId) {
        this.userId = userId;
        this.rewards = {
            1: [
                { id: 'banner_1', type: 'banner', name: 'Reality Zero', rarity: 'uncommon', cost: 3, icon: '🎨' },
                { id: 'vbucks_1', type: 'currency', amount: 100, rarity: 'common', cost: 2, icon: '💰' },
                { id: 'skin_1', type: 'skin', name: 'Cyber Warrior', rarity: 'rare', cost: 5, icon: '👤' },
                { id: 'emote_1', type: 'emote', name: 'Victory Dance', rarity: 'uncommon', cost: 3, icon: '💃' },
                { id: 'weapon_1', type: 'weapon', name: 'Laser Rifle', rarity: 'rare', cost: 4, icon: '🔫' },
                { id: 'pickaxe_1', type: 'pickaxe', name: 'Star Wand', rarity: 'uncommon', cost: 3, icon: '⛏️' },
                { id: 'glider_1', type: 'glider', name: 'Cyber Wings', rarity: 'epic', cost: 6, icon: '🦋' },
                { id: 'trail_1', type: 'trail', name: 'Stardust', rarity: 'rare', cost: 4, icon: '✨' }
            ]
            // Voeg meer pagina's toe voor levels 2-14
        };
    }

    async initializeBattlePass() {
        const userRef = ref(db, `users/${this.userId}/battlepass`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
            await set(userRef, {
                tier: 1,
                stars: 0,
                experience: 0,
                premium: false,
                claimedRewards: {}
            });
        }
    }

    async getBattlePassProgress() {
        const userRef = ref(db, `users/${this.userId}/battlepass`);
        const snapshot = await get(userRef);
        return snapshot.val() || { tier: 1, stars: 0, experience: 0, premium: false };
    }

    async claimReward(rewardId, tier) {
        const userRef = ref(db, `users/${this.userId}`);
        const battlepassRef = ref(db, `users/${this.userId}/battlepass`);
        const userData = (await get(userRef)).val();
        const battlepassData = (await get(battlepassRef)).val();

        const reward = this.rewards[tier].find(r => r.id === rewardId);
        if (!reward) throw new Error('Beloning niet gevonden');

        if (battlepassData.stars < reward.cost) {
            throw new Error('Niet genoeg Battle Stars');
        }

        const updates = {
            [`battlepass/stars`]: battlepassData.stars - reward.cost,
            [`battlepass/claimedRewards/${rewardId}`]: true
        };

        if (reward.type === 'currency') {
            updates.points = (userData.points || 0) + reward.amount;
        }

        await update(userRef, updates);
        return true;
    }

    async addExperience(amount) {
        const battlepassRef = ref(db, `users/${this.userId}/battlepass`);
        const data = (await get(battlepassRef)).val();
        
        const newExp = (data.experience || 0) + amount;
        const expPerTier = 1000;
        const newTier = Math.floor(newExp / expPerTier) + 1;
        const newStars = Math.floor(newExp / 100); // Elke 100 XP = 1 Battle Star

        await update(battlepassRef, {
            experience: newExp,
            tier: Math.min(newTier, 14), // Max tier is 14
            stars: newStars
        });
    }
} 