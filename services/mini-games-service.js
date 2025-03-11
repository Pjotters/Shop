export class MiniGamesService {
    constructor() {
        this.games = {
            memoryCard: {
                name: "Memory",
                maxPoints: 50,
                cooldown: 3600 // 1 uur
            },
            wordScramble: {
                name: "Woordpuzzel",
                maxPoints: 30,
                cooldown: 1800 // 30 minuten
            },
            quickMath: {
                name: "Snelle Rekensommen",
                maxPoints: 40,
                cooldown: 2700 // 45 minuten
            }
        };
    }

    async startMiniGame(userId, gameType) {
        // Start mini-game logica
    }
} 