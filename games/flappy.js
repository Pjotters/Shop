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
            size: 30,
            rotation: 0
        };
        this.background = new Image();
        this.background.src = '../images/games/flappy-background.png';
        this.birdSprite = new Image();
        this.birdSprite.src = '../images/games/flappy-sprite.png';
        this.pipeSprite = new Image();
        this.pipeSprite.src = '../images/games/pipe-sprite.png';
        
        this.pipes = [];
        this.score = 0;
        this.earnedPoints = 0;
        this.gameSpeed = 1;
        this.baseSpeed = 3;
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

        // Update game speed based on score
        if (this.score >= 5) this.gameSpeed = 1.2;
        if (this.score >= 10) this.gameSpeed = 1.5;
        if (this.score >= 15) this.gameSpeed = 1.75;
        if (this.score >= 20) this.gameSpeed = 2.0;
        
        // Update bird physics
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        this.bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.bird.velocity * 0.1));

        // Check collisions
        if (this.bird.y < 0 || this.bird.y > this.canvas.height) {
            this.endGame();
            return;
        }

        // Update pipes with current game speed
        this.pipes.forEach((pipe, index) => {
            pipe.x -= this.baseSpeed * this.gameSpeed;

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
                
                const scoreElement = document.getElementById('currentScore');
                const pointsElement = document.getElementById('earnedPoints');
                
                scoreElement.textContent = this.score;
                pointsElement.textContent = this.earnedPoints;
                
                // Voeg bounce animatie toe
                scoreElement.classList.add('score-update');
                pointsElement.classList.add('score-update');
                
                // Verwijder animatie klasse na afloop
                setTimeout(() => {
                    scoreElement.classList.remove('score-update');
                    pointsElement.classList.remove('score-update');
                }, 300);
            }
        });
    }

    draw() {
        // Draw background
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);
        
        // Draw pipes
        this.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.drawImage(this.pipeSprite, pipe.x, 0, 50, pipe.top);
            // Bottom pipe
            this.ctx.drawImage(this.pipeSprite, pipe.x, pipe.bottom, 50, this.canvas.height - pipe.bottom);
        });

        // Draw bird with rotation
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.size/2, this.bird.y + this.bird.size/2);
        this.ctx.rotate(this.bird.rotation);
        this.ctx.drawImage(this.birdSprite, -this.bird.size/2, -this.bird.size/2, this.bird.size, this.bird.size);
        this.ctx.restore();
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
        // Reset game state
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.earnedPoints = 0;
        this.isGameOver = false;
        
        // Reset UI
        document.getElementById('currentScore').textContent = '0';
        document.getElementById('earnedPoints').textContent = '0';
        
        // Start game loop
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