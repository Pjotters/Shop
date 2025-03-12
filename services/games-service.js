import { db, ref, get, update, onValue } from '../firebase-config.js';
import { GameRewardsService } from './game-rewards-service.js';

export class GamesService {
    constructor(userId) {
        this.userId = userId;
        this.rewardsService = new GameRewardsService(userId);
        this.games = {
            flappyBird: {
                id: 'flappyBird',
                name: 'Flappy Bird',
                icon: '🐦',
                description: 'Vlieg door de obstakels!',
                highScore: 0,
                playCount: 0,
                status: 'popular',
                difficulty: 'medium',
                minPoints: 10,
                maxPoints: 100
            },
            snake: {
                id: 'snake',
                name: 'Snake',
                icon: '🐍',
                description: 'Verzamel alle appels!',
                highScore: 0,
                playCount: 0,
                status: 'popular',
                difficulty: 'easy',
                minPoints: 5,
                maxPoints: 50
            },
            pacman: {
                id: 'pacman',
                name: 'Pacman',
                icon: '👻',
                description: 'Eet alle stippen!',
                highScore: 0,
                playCount: 0,
                status: 'new',
                difficulty: 'hard',
                minPoints: 15,
                maxPoints: 150
            }
        };
    }

    async startGame(gameId) {
        const gameRef = ref(db, `users/${this.userId}/games/${gameId}`);
        await update(gameRef, {
            lastPlayed: new Date().toISOString(),
            playCount: (await this.getGameStats(gameId)).playCount + 1
        });
        
        this.rewardsService.startGameSession(gameId);
        return this.games[gameId];
    }

    async endGame(gameId, score) {
        const gameRef = ref(db, `users/${this.userId}/games/${gameId}`);
        const stats = await this.getGameStats(gameId);
        
        // Update high score als nodig
        if (score > stats.highScore) {
            await update(gameRef, { highScore: score });
        }

        // Bereken verdiende punten
        const game = this.games[gameId];
        const earnedPoints = Math.min(
            Math.max(
                Math.floor(score * (game.maxPoints / 100)),
                game.minPoints
            ),
            game.maxPoints
        );

        // Update gebruiker punten
        const userRef = ref(db, `users/${this.userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        
        await update(userRef, {
            points: (userData.points || 0) + earnedPoints
        });

        this.rewardsService.endGameSession();

        return {
            earnedPoints,
            newHighScore: score > stats.highScore,
            totalPoints: userData.points + earnedPoints
        };
    }

    async getGameStats(gameId) {
        const gameRef = ref(db, `users/${this.userId}/games/${gameId}`);
        const snapshot = await get(gameRef);
        return snapshot.val() || { highScore: 0, playCount: 0 };
    }
} 