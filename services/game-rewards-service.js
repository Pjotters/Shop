import { db, ref, onValue, update, serverTimestamp } from '../firebase-config.js';

export class GameRewardsService {
    constructor(userId) {
        this.userId = userId;
        this.gameStartTime = null;
        this.activeGame = null;
        this.checkInterval = null;
    }

    startGameSession(gameId) {
        this.gameStartTime = new Date();
        this.activeGame = gameId;
        
        // Start interval voor het checken van speeltijd
        this.checkInterval = setInterval(() => {
            this.updatePlayTimeRewards();
        }, 60000); // Check elke minuut
    }

    async updatePlayTimeRewards() {
        if (!this.gameStartTime || !this.activeGame) return;

        const playTimeMinutes = Math.floor((new Date() - this.gameStartTime) / 60000);
        const baseStars = playTimeMinutes; // 1 ster per minuut
        let bonusStars = 0;

        // Bereken bonus sterren
        const bonusThresholds = Math.floor(playTimeMinutes / 10);
        if (bonusThresholds > 0) {
            bonusStars = bonusThresholds * 5;
        }

        const totalStars = baseStars + bonusStars;

        // Update in Firebase
        const userRef = ref(db, `users/${this.userId}`);
        const updates = {
            tierStars: totalStars,
            lastGamePlayed: this.activeGame,
            lastPlayTime: serverTimestamp()
        };

        await update(userRef, updates);
    }

    endGameSession() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.gameStartTime = null;
        this.activeGame = null;
    }
} 