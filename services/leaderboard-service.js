import { db, ref, get, query, orderByChild, limitToLast, set, serverTimestamp } from '../firebase-config.js';

export class LeaderboardService {
    constructor() {
        this.leaderboardSize = 10;
    }

    async getGameLeaderboard(gameId) {
        const leaderboardRef = ref(db, `leaderboards/${gameId}`);
        const leaderboardQuery = query(
            leaderboardRef,
            orderByChild('score'),
            limitToLast(this.leaderboardSize)
        );

        const snapshot = await get(leaderboardQuery);
        const leaderboard = [];
        
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                leaderboard.unshift({
                    userId: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }

        // Haal gebruikersnamen op
        for (let entry of leaderboard) {
            const userSnapshot = await get(ref(db, `users/${entry.userId}`));
            const userData = userSnapshot.val();
            entry.username = userData?.username || 'Anoniem';
            entry.avatar = userData?.avatar || '👤';
        }

        return leaderboard;
    }

    async updateLeaderboard(gameId, userId, score) {
        const leaderboardRef = ref(db, `leaderboards/${gameId}/${userId}`);
        const currentSnapshot = await get(leaderboardRef);
        
        if (!currentSnapshot.exists() || score > currentSnapshot.val().score) {
            await set(leaderboardRef, {
                score,
                timestamp: serverTimestamp()
            });
        }
    }
} 