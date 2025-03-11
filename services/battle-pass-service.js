import { db, ref, get, update, set } from '../firebase-config.js';

export class BattlePassService {
    constructor() {
        this.rewards = {
            1: {
                type: 'loading_screen',
                name: 'Reality Zero',
                rarity: 'UNCOMMON',
                cost: 3
            },
            2: {
                type: 'coins',
                amount: 100,
                cost: 3
            },
            3: {
                type: 'emote',
                name: 'Victory Dance',
                cost: 4
            },
            4: {
                type: 'skin',
                name: 'Cyber Warrior',
                rarity: 'RARE',
                cost: 5
            }
            // ... meer rewards
        };
        
        this.currentPage = 1;
        this.totalPages = 14;
    }

    async initializeBattlePass(userId) {
        const battlePassRef = ref(db, `users/${userId}/battlePass`);
        const snapshot = await get(battlePassRef);

        if (!snapshot.exists()) {
            await set(battlePassRef, {
                level: 1,
                coins: 0,
                claimedRewards: {},
                premium: false
            });
        }
    }

    async claimReward(userId, rewardId) {
        const userRef = ref(db, `users/${userId}`);
        const battlePassRef = ref(db, `users/${userId}/battlePass`);
        
        const [userSnap, battlePassSnap] = await Promise.all([
            get(userRef),
            get(battlePassRef)
        ]);

        const userData = userSnap.val();
        const battlePassData = battlePassSnap.val();
        const reward = this.rewards[rewardId];

        if (!reward) throw new Error('Ongeldige reward');
        if (battlePassData.claimedRewards[rewardId]) throw new Error('Al geclaimd');
        if (battlePassData.coins < reward.cost) throw new Error('Niet genoeg coins');

        // Update gebruiker data
        const updates = {
            [`battlePass/coins`]: battlePassData.coins - reward.cost,
            [`battlePass/claimedRewards/${rewardId}`]: true
        };

        if (reward.type === 'coins') {
            updates.points = (userData.points || 0) + reward.amount;
        } else {
            updates[`inventory/${reward.type}s/${reward.name.toLowerCase()}`] = true;
        }

        await update(userRef, updates);
        return reward;
    }
} 