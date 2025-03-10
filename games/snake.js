import { auth, db } from '../firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { checkTermsAcceptance } from './terms-popup.js';

class Snake {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.earnedPoints = 0;
        this.gameLoop = null;
        this.isGameOver = false;

        // Canvas grootte aanpassen
        this.canvas.width = 600;
        this.canvas.height = 400;

        // Event listeners voor toetsenbord
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Mobile controls
        document.getElementById('upBtn').addEventListener('click', () => this.direction = 'up');
        document.getElementById('downBtn').addEventListener('click', () => this.direction = 'down');
        document.getElementById('leftBtn').addEventListener('click', () => this.direction = 'left');
        document.getElementById('rightBtn').addEventListener('click', () => this.direction = 'right');
    }

    generateFood() {
        return {
            x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
            y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
        };
    }

    handleKeyPress(event) {
        const key = event.key;
        if (key === 'ArrowUp' && this.direction !== 'down') this.direction = 'up';
        if (key === 'ArrowDown' && this.direction !== 'up') this.direction = 'down';
        if (key === 'ArrowLeft' && this.direction !== 'right') this.direction = 'left';
        if (key === 'ArrowRight' && this.direction !== 'left') this.direction = 'right';
    }

    update() {
        if (this.isGameOver) return;

        const head = {...this.snake[0]};
        
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check voor botsingen
        if (this.checkCollision(head)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        // Check of slang eten heeft gevangen
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 1;
            this.earnedPoints += 5;
            this.food = this.generateFood();
            document.getElementById('currentScore').textContent = this.score;
            document.getElementById('earnedPoints').textContent = this.earnedPoints;
        } else {
            this.snake.pop();
        }
    }

    checkCollision(head) {
        // Muur botsing
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }

        // Slang botsing met zichzelf
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Teken slang
        this.ctx.fillStyle = '#4fd1c5';
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Teken voedsel
        this.ctx.fillStyle = '#fc8181';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }

    async endGame() {
        this.isGameOver = true;
        clearInterval(this.gameLoop);

        const user = auth.currentUser;
        if (!user) return;

        // Update highscore en punten in database
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val() || {};
        
        const updates = {};
        
        // Update highscore als nodig
        if (!userData.games?.snake?.highscore || this.score > userData.games.snake.highscore) {
            updates['games/snake/highscore'] = this.score;
        }
        
        // Update punten
        updates.points = (userData.points || 0) + this.earnedPoints;
        
        await update(userRef, updates);
    }

    start() {
        this.isGameOver = false;
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.score = 0;
        this.earnedPoints = 0;
        this.food = this.generateFood();
        
        document.getElementById('currentScore').textContent = '0';
        document.getElementById('earnedPoints').textContent = '0';
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 100);
    }
}

// Game initialisatie
document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Snake(canvas);
    
    const termsAccepted = await checkTermsAcceptance();
    if (!termsAccepted) return;
    
    document.getElementById('startGame').addEventListener('click', () => {
        game.start();
    });

    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = '../dashboard.html';
    });
}); 