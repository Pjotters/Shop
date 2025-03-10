import { auth, db, dbRef } from '../firebase-config.js';
import { ref, update, get } from 'firebase/database';

class FlappyBird {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bird = { x: 50, y: 150, velocity: 0 };
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.gravity = 0.5;
        this.jump = -8;
        this.pipeGap = 120;
        
        // Points systeem
        this.pointsMultiplier = 10; // 10 punten per pipe
        this.earnedPoints = 0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.gameOver) {
                this.bird.velocity = this.jump;
            }
        });

        document.addEventListener('touchstart', () => {
            if (!this.gameOver) {
                this.bird.velocity = this.jump;
            }
        });
    }

    update() {
        if (this.gameOver) return;

        // Update bird
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        // Generate pipes
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 200) {
            const y = Math.random() * (this.canvas.height - this.pipeGap - 100) + 50;
            this.pipes.push({ x: this.canvas.width, y });
        }

        // Update pipes
        this.pipes.forEach(pipe => {
            pipe.x -= 2;

            // Check collision
            if (this.checkCollision(pipe)) {
                this.gameOver = true;
                this.endGame();
            }

            // Score point
            if (pipe.x === 48) {
                this.score++;
                this.earnedPoints += this.pointsMultiplier;
                document.getElementById('currentScore').textContent = this.score;
                document.getElementById('earnedPoints').textContent = this.earnedPoints;
            }
        });

        // Remove off-screen pipes
        this.pipes = this.pipes.filter(pipe => pipe.x > -50);

        // Check boundaries
        if (this.bird.y > this.canvas.height || this.bird.y < 0) {
            this.gameOver = true;
            this.endGame();
        }
    }

    async endGame() {
        const user = auth.currentUser;
        if (!user) return;

        // Update highscore en punten in database
        const userGameRef = dbRef.games(user.uid);
        const userPointsRef = dbRef.points(user.uid);

        const snapshot = await get(userGameRef);
        const currentData = snapshot.val() || {};
        
        if (!currentData.flappyBird || this.score > currentData.flappyBird.highscore) {
            await update(userGameRef, {
                'flappyBird/highscore': this.score
            });
        }

        // Update punten
        const pointsSnapshot = await get(userPointsRef);
        const currentPoints = pointsSnapshot.val() || 0;
        await update(ref(db, `users/${user.uid}`), {
            points: currentPoints + this.earnedPoints
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bird
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw pipes
        this.ctx.fillStyle = 'green';
        this.pipes.forEach(pipe => {
            this.ctx.fillRect(pipe.x, 0, 30, pipe.y);
            this.ctx.fillRect(pipe.x, pipe.y + this.pipeGap, 30, this.canvas.height);
        });
    }

    checkCollision(pipe) {
        return (
            this.bird.x + 15 > pipe.x &&
            this.bird.x - 15 < pipe.x + 30 &&
            (this.bird.y - 15 < pipe.y || this.bird.y + 15 > pipe.y + this.pipeGap)
        );
    }

    start() {
        this.gameLoop();
    }

    gameLoop() {
        this.update();
        this.draw();
        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Game initialisatie
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = 400;
    canvas.height = 500;
    
    const game = new FlappyBird(canvas);
    
    document.getElementById('startGame').addEventListener('click', () => {
        game.start();
    });
    
    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = '../dashboard.html';
    });
}); 