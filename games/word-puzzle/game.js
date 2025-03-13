import { GameInitializer } from '../../game-init.js';
import { PowerUpService } from '../../services/power-up-service.js';

export class WordPuzzle {
    constructor(userId) {
        this.userId = userId;
        this.gameInitializer = new GameInitializer('wordPuzzle');
        this.powerUpService = new PowerUpService(userId);
        
        this.gameTypes = {
            anagram: 'Anagram',
            woordzoeker: 'Woordzoeker',
            cryptogram: 'Cryptogram',
            lettermix: 'Lettermix'
        };
        
        this.currentGame = null;
        this.gamesPlayed = 0;
        this.lastPlayTime = 0;
        this.maxGamesPerPeriod = 5;
        this.cooldownPeriod = 1800000; // 30 minuten in milliseconds
        
        this.words = {
            easy: ['PROGRAMMEREN', 'COMPUTER', 'TOETSENBORD', 'INTERNET'],
            medium: ['ALGORITME', 'DATABASE', 'NETWERK', 'SOFTWARE'],
            hard: ['ENCRYPTIE', 'FRAMEWORK', 'INTERFACE', 'PROTOCOL']
        };
    }

    async initialize() {
        await this.gameInitializer.initializeGame();
        this.powerUps = await this.powerUpService.getActivePowerUps('wordPuzzle');
        this.checkGameAvailability();
    }

    checkGameAvailability() {
        const now = Date.now();
        if (this.gamesPlayed >= this.maxGamesPerPeriod && 
            (now - this.lastPlayTime) < this.cooldownPeriod) {
            const remainingTime = this.cooldownPeriod - (now - this.lastPlayTime);
            this.showCooldownMessage(remainingTime);
            return false;
        }
        return true;
    }

    async startGame(gameType) {
        if (!this.checkGameAvailability()) return;
        
        this.currentGame = gameType;
        this.timeLeft = 60;
        if (this.powerUps.includes('timeBonus')) {
            this.timeLeft += 30;
        }
        
        switch(gameType) {
            case 'anagram':
                this.startAnagramGame();
                break;
            case 'woordzoeker':
                this.startWoordzoekerGame();
                break;
            // Voeg andere speltypen toe
        }
        
        this.gamesPlayed++;
        this.lastPlayTime = Date.now();
    }

    useHint() {
        if (this.powerUps.includes('hint')) {
            // Implementeer hint logica per speltype
            this.powerUpService.consumePowerUp('wordPuzzle', 'hint');
        }
    }
} 