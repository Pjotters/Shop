import { auth, db } from '../firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { checkTermsAcceptance } from './terms-popup.js';

class FlappyBird {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bird = {
            x: 50,
            y: canvas.height / 2,
            velocity: 0,
            gravity: 0.5,
            jump: -8,
            size: 20
        };
        this.pipes = [];
        this.score = 0;
        this.earnedPoints = 0;
        this.gameLoop = null;
        this.isGameOver = false;
        
        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.jump();
        });
        
        canvas.addEventListener('click', () => this.jump());
        
        // Pipe generation
        setInterval(() => {
            if (!this.isGameOver) this.addPipe();
        }, 2000);
    }

    jump() {
        if (!this.isGameOver) {
            this.bird.velocity = this.bird.jump;
        }
    }

    addPipe() {
        const gap = 150;
        const minHeight = 50;
        const maxHeight = this.canvas.height - gap - minHeight;
        const height = Math.random() * (maxHeight - minHeight) + minHeight;

        this.pipes.push({
            x: this.canvas.width,
            top: height,
            bottom: height + gap,
            counted: false
        });
    }

    update() {
        if (this.isGameOver) return;

        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // Check collisions
        if (this.bird.y < 0 || this.bird.y > this.canvas.height) {
            this.endGame();
            return;
        }

        // Update pipes
        this.pipes.forEach((pipe, index) => {
            pipe.x -= 3;

            // Remove off-screen pipes
            if (pipe.x + 50 < 0) {
                this.pipes.splice(index, 1);
            }

            // Check collisions
            if (
                this.bird.x + this.bird.size > pipe.x &&
                this.bird.x < pipe.x + 50 &&
                (this.bird.y < pipe.top || this.bird.y + this.bird.size > pipe.bottom)
            ) {
                this.endGame();
            }

            // Score points
            if (!pipe.counted && pipe.x < this.bird.x) {
                this.score++;
                this.earnedPoints += 10;
                pipe.counted = true;
                document.getElementById('currentScore').textContent = this.score;
                document.getElementById('earnedPoints').textContent = this.earnedPoints;
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw bird
        this.ctx.fillStyle = '#45B7AF';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw pipes
        this.pipes.forEach(pipe => {
            this.ctx.fillStyle = '#4fd1c5';
            this.ctx.fillRect(pipe.x, 0, 50, pipe.top);
            this.ctx.fillRect(pipe.x, pipe.bottom, 50, this.canvas.height - pipe.bottom);
        });
    }

    async endGame() {
        this.isGameOver = true;
        clearInterval(this.gameLoop);

        const user = auth.currentUser;
        if (!user) return;

        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val() || {};
        
        const updates = {};
        if (!userData.games?.flappyBird?.highscore || this.score > userData.games.flappyBird.highscore) {
            updates['games/flappyBird/highscore'] = this.score;
        }
        updates.points = (userData.points || 0) + this.earnedPoints;
        
        await update(userRef, updates);
    }

    start() {
        this.isGameOver = false;
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.earnedPoints = 0;
        
        document.getElementById('currentScore').textContent = '0';
        document.getElementById('earnedPoints').textContent = '0';
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 1000 / 60);
    }
}

// Game initialisatie
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const termsAccepted = await checkTermsAcceptance();
        if (!termsAccepted) return;

        const canvas = document.getElementById('gameCanvas');
        canvas.width = 1000;
        canvas.height = 600;
        
        const game = new FlappyBird(canvas);
        
        document.getElementById('startGame').addEventListener('click', () => {
            game.start();
        });

        document.getElementById('backToDashboard').addEventListener('click', () => {
            window.location.href = '../dashboard.html';
        });
    } catch (error) {
        console.error('Game initialization error:', error);
    }
}); 