import { LeaderboardService } from '../services/leaderboard-service.js';

export class GameInitializer {
    constructor(gameId) {
        this.gameId = gameId;
        this.leaderboardService = new LeaderboardService();
    }

    async initializeGame() {
        await this.loadLeaderboard();
        // Game specifieke initialisatie
    }

    async loadLeaderboard() {
        const leaderboard = await this.leaderboardService.getGameLeaderboard(this.gameId);
        const leaderboardElement = document.getElementById('gameLeaderboard');
        
        leaderboardElement.innerHTML = leaderboard.map((entry, index) => `
            <div class="leaderboard-entry">
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-avatar">${entry.avatar}</span>
                <span class="leaderboard-username">${entry.username}</span>
                <span class="leaderboard-score">${entry.score}</span>
            </div>
        `).join('');
    }
} 