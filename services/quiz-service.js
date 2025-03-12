import { db, ref, get, set, update, serverTimestamp } from '../firebase-config.js';

export class QuizService {
    constructor(userId) {
        this.userId = userId;
        this.questions = [
            {
                id: 'q1',
                question: "Wat was de eerste Pjotters game?",
                answers: ["Snake", "Flappy Bird", "Pac-Man", "Tetris"],
                correct: 1,
                explanation: "Flappy Bird was de eerste game die we lanceerden!",
                points: 100,
                xp: 500
            },
            {
                id: 'q2',
                question: "Hoeveel punten krijg je voor een perfect potje Snake?",
                answers: ["100", "200", "500", "1000"],
                correct: 2,
                explanation: "Een perfect potje Snake levert 500 punten op!",
                points: 100,
                xp: 500
            },
            {
                id: 'q3',
                question: "Welke power-up vind je niet in Pac-Man?",
                answers: ["Speed Boost", "Ghost Eater", "Teleport", "Shield"],
                correct: 3,
                explanation: "Teleport is geen power-up in Pac-Man!",
                points: 100,
                xp: 500
            }
        ];
    }

    async getDailyQuestion() {
        const today = new Date().toISOString().split('T')[0];
        const quizRef = ref(db, `users/${this.userId}/dailyQuiz/${today}`);
        const snapshot = await get(quizRef);

        if (snapshot.exists()) {
            return { completed: true, ...snapshot.val() };
        }

        // Selecteer vraag gebaseerd op datum
        const dayOfYear = Math.floor((new Date() - new Date(today.slice(0,4), 0, 0)) / (1000 * 60 * 60 * 24));
        const questionIndex = dayOfYear % this.questions.length;
        
        return {
            ...this.questions[questionIndex],
            date: today,
            completed: false
        };
    }

    async submitAnswer(questionId, answerIndex) {
        const question = this.questions.find(q => q.id === questionId);
        const today = new Date().toISOString().split('T')[0];
        const quizRef = ref(db, `users/${this.userId}/dailyQuiz/${today}`);
        
        const correct = question.correct === answerIndex;
        const result = {
            questionId,
            answered: true,
            correct,
            selectedAnswer: answerIndex,
            points: correct ? question.points : 0,
            xp: correct ? question.xp : Math.floor(question.xp / 4),
            answeredAt: serverTimestamp()
        };

        await set(quizRef, result);

        if (correct) {
            const userRef = ref(db, `users/${this.userId}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            
            await update(userRef, {
                points: (userData.points || 0) + question.points,
                xp: (userData.xp || 0) + question.xp,
                'stats/quizStreak': (userData.stats?.quizStreak || 0) + 1,
                'stats/totalQuizCompleted': (userData.stats?.totalQuizCompleted || 0) + 1
            });
        }

        return { ...result, explanation: question.explanation };
    }
} 