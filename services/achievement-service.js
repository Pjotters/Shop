import { db } from '../firebase-config.js';
import { ref, get, set } from '/firebase/database';

export class AchievementService {
    constructor() {
        this.achievements = {
            points_collector: {
                title: "Punten Verzamelaar",
                description: "Verzamel 1000 punten",
                icon: "🌟",
                check: (userData) => userData.points >= 1000,
                reward: 500
            },
            daily_player: {
                title: "Dagelijkse Speler",
                description: "Speel 5 dagen achter elkaar",
                icon: "📅",
                check: (userData) => this.checkConsecutiveDays(userData) >= 5,
                reward: 1000
            }
        };
    }

    async checkAchievements(userId) {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        
        const unlockedAchievements = [];
        
        for (const [id, achievement] of Object.entries(this.achievements)) {
            if (!userData.achievements?.[id] && achievement.check(userData)) {
                await set(ref(db, `users/${userId}/achievements/${id}`), {
                    unlockedAt: new Date().toISOString()
                });
                await set(ref(db, `users/${userId}/points`), 
                    userData.points + achievement.reward
                );
                unlockedAchievements.push(achievement);
            }
        }
        
        return unlockedAchievements;
    }
} 