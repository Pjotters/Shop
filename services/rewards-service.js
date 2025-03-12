import { db, ref, get, update, serverTimestamp } from '../firebase-config.js';

export class RewardsService {
    constructor(userId) {
        this.userId = userId;
        this.dailyRewards = {
            day1: { points: 100, icon: "🎁" },
            day2: { points: 200, icon: "💎" },
            day3: { points: 300, icon: "🌟" },
            day4: { points: 400, icon: "🏆" },
            day5: { points: 500, icon: "👑" },
            day6: { points: 600, icon: "💫" },
            day7: { points: 1000, icon: "🎉" }
        };
    }

    async claimReward(points) {
        const userRef = ref(db, `users/${this.userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val() || {};
        
        await update(userRef, {
            points: (userData.points || 0) + points,
            lastRewardClaim: serverTimestamp()
        });
        
        return { success: true, points };
    }

    async updateUserReward(points, today) {
        const userRef = ref(db, `users/${this.userId}`);
        const streakRef = ref(db, `users/${this.userId}/dailyStreak`);
        
        await update(userRef, {
            points: (userData.points || 0) + points,
            'dailyStreak/currentStreak': streak.currentStreak + 1,
            'dailyStreak/lastClaim': today
        });
    }

    async claimDailyReward(userId) {
        const today = new Date().toISOString().split('T')[0];
        const streakRef = ref(db, `users/${userId}/dailyStreak`);
        const snapshot = await get(streakRef);
        const streak = snapshot.val() || { currentStreak: 0, lastClaim: null };
        
        if (streak.lastClaim === today) {
            return { claimed: false, message: "Je hebt je dagelijkse beloning al geclaimd!" };
        }

        const reward = this.dailyRewards[`day${streak.currentStreak + 1}`] || this.dailyRewards.day1;
        
        // Update gebruiker punten en streak
        await updateUserReward(userId, reward.points, today);
        
        return {
            claimed: true,
            reward: reward,
            streak: streak.currentStreak + 1
        };
    }
} 