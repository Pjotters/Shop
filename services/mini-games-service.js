import { db } from '../firebase-config.js';
import { ref, get, set, update } from '/firebase/database';

export class MiniGamesService {
    constructor() {
        this.games = {
            memoryCard: {
                name: "Memory",
                description: "Match de kaarten en verdien punten!",
                maxPoints: 50,
                cooldown: 3600,
                levels: [
                    { pairs: 6, timeLimit: 60, reward: 20 },
                    { pairs: 8, timeLimit: 90, reward: 30 },
                    { pairs: 12, timeLimit: 120, reward: 50 }
                ],
                cards: [
                    '🎮', '🎲', '🎯', '🎪', '🎨', '🎭',
                    '🎪', '🎫', '🎬', '🎤', '🎧', '🎵'
                ]
            },
            wordScramble: {
                name: "Woordpuzzel",
                description: "Ontcijfer het woord binnen de tijd!",
                maxPoints: 30,
                cooldown: 1800,
                wordLists: {
                    easy: ['GAME', 'PLAY', 'SCORE', 'WIN'],
                    medium: ['PLAYER', 'GAMING', 'POINTS', 'REWARD'],
                    hard: ['CHALLENGE', 'ADVENTURE', 'HIGHSCORE', 'ACHIEVEMENT']
                },
                timeLimit: 30
            },
            quickMath: {
                name: "Snelle Rekensommen",
                description: "Los zo veel mogelijk sommen op!",
                maxPoints: 40,
                cooldown: 2700,
                operations: ['+', '-', '*'],
                difficulty: {
                    easy: { max: 10, reward: 2 },
                    medium: { max: 25, reward: 3 },
                    hard: { max: 50, reward: 5 }
                },
                timeLimit: 60
            }
        };
    }

    async startMiniGame(userId, gameType) {
        const userRef = ref(db, `users/${userId}/miniGames/${gameType}`);
        const snapshot = await get(userRef);
        const gameData = snapshot.val() || {};

        // Check cooldown
        if (gameData.lastPlayed) {
            const cooldown = this.games[gameType].cooldown;
            const timePassed = Date.now() - new Date(gameData.lastPlayed).getTime();
            
            if (timePassed < cooldown * 1000) {
                const waitTime = Math.ceil((cooldown * 1000 - timePassed) / 1000 / 60);
                throw new Error(`Wacht nog ${waitTime} minuten voor je weer kunt spelen`);
            }
        }

        // Start nieuwe game sessie
        const gameSession = {
            startTime: new Date().toISOString(),
            gameType: gameType,
            completed: false,
            score: 0
        };

        // Game-specifieke initialisatie
        switch (gameType) {
            case 'memoryCard':
                gameSession.cards = this.shuffleCards(this.games.memoryCard.cards);
                gameSession.level = 1;
                break;
            case 'wordScramble':
                gameSession.word = this.getRandomWord('medium');
                gameSession.scrambled = this.scrambleWord(gameSession.word);
                break;
            case 'quickMath':
                gameSession.problems = this.generateMathProblems(10, 'medium');
                break;
        }

        await set(userRef, {
            ...gameData,
            currentSession: gameSession
        });

        return gameSession;
    }

    async submitGameResult(userId, gameType, result) {
        const userRef = ref(db, `users/${userId}`);
        const gameRef = ref(db, `users/${userId}/miniGames/${gameType}`);
        
        const [userSnapshot, gameSnapshot] = await Promise.all([
            get(userRef),
            get(gameRef)
        ]);

        const userData = userSnapshot.val();
        const gameData = gameSnapshot.val();

        if (!gameData.currentSession || gameData.currentSession.completed) {
            throw new Error('Geen actieve game sessie gevonden');
        }

        // Bereken punten op basis van resultaat
        const earnedPoints = this.calculatePoints(gameType, result);

        // Update gebruiker statistieken
        const updates = {
            [`miniGames/${gameType}`]: {
                lastPlayed: new Date().toISOString(),
                highScore: Math.max(gameData.highScore || 0, result.score),
                gamesPlayed: (gameData.gamesPlayed || 0) + 1,
                currentSession: null
            },
            points: userData.points + earnedPoints
        };

        await update(userRef, updates);

        return {
            earnedPoints,
            newTotal: userData.points + earnedPoints,
            newHighScore: updates[`miniGames/${gameType}`].highScore
        };
    }

    // Helper functies
    shuffleCards(cards) {
        const doubled = [...cards, ...cards];
        for (let i = doubled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
        }
        return doubled;
    }

    getRandomWord(difficulty) {
        const words = this.games.wordScramble.wordLists[difficulty];
        return words[Math.floor(Math.random() * words.length)];
    }

    scrambleWord(word) {
        return word.split('')
            .sort(() => Math.random() - 0.5)
            .join('');
    }

    generateMathProblems(count, difficulty) {
        const { max, reward } = this.games.quickMath.difficulty[difficulty];
        const problems = [];

        for (let i = 0; i < count; i++) {
            const num1 = Math.floor(Math.random() * max) + 1;
            const num2 = Math.floor(Math.random() * max) + 1;
            const operation = this.games.quickMath.operations[
                Math.floor(Math.random() * this.games.quickMath.operations.length)
            ];

            problems.push({
                problem: `${num1} ${operation} ${num2}`,
                answer: this.calculateAnswer(num1, num2, operation),
                reward: reward
            });
        }

        return problems;
    }

    calculateAnswer(num1, num2, operation) {
        switch (operation) {
            case '+': return num1 + num2;
            case '-': return num1 - num2;
            case '*': return num1 * num2;
            default: return 0;
        }
    }

    calculatePoints(gameType, result) {
        const gameConfig = this.games[gameType];
        let points = 0;

        switch (gameType) {
            case 'memoryCard':
                points = Math.min(
                    gameConfig.maxPoints,
                    result.pairs * gameConfig.levels[result.level - 1].reward
                );
                break;
            case 'wordScramble':
                points = Math.min(
                    gameConfig.maxPoints,
                    Math.floor((gameConfig.timeLimit - result.timeUsed) * 2)
                );
                break;
            case 'quickMath':
                points = Math.min(
                    gameConfig.maxPoints,
                    result.correctAnswers * gameConfig.difficulty[result.difficulty].reward
                );
                break;
        }

        return points;
    }
} 