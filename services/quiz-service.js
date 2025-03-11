import { db } from '../firebase-config.js';
import { ref, get, set, query, orderByChild, limitToLast } from 'firebase/database';

export class QuizService {
    constructor() {
        this.questions = [
            {
                question: "Wat was de eerste Pjotters game?",
                answers: ["Snake", "Flappy Bird", "Pac-Man", "Tetris"],
                correct: 1
            },
            {
                question: "Hoeveel punten krijg je voor een perfect potje Snake?",
                answers: ["100", "200", "500", "1000"],
                correct: 2
            }
            // Voeg meer vragen toe
        ];
    }

    async getDailyQuestion(userId) {
        const today = new Date().toISOString().split('T')[0];
        const userRef = ref(db, `users/${userId}/dailyQuiz/${today}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            return null; // Al gespeeld vandaag
        }

        const randomQuestion = this.questions[Math.floor(Math.random() * this.questions.length)];
        return { ...randomQuestion, date: today };
    }

    async submitAnswer(userId, questionDate, answerIndex) {
        const correct = this.questions[0].correct === answerIndex;
        await set(ref(db, `users/${userId}/dailyQuiz/${questionDate}`), {
            answered: true,
            correct: correct,
            points: correct ? 100 : 0
        });

        if (correct) {
            const userRef = ref(db, `users/${userId}`);
            const snapshot = await get(userRef);
            const userData = snapshot.val();
            await set(ref(db, `users/${userId}/points`), userData.points + 100);
        }

        return correct;
    }
} 