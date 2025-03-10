import { auth, db, dbRef } from '../firebase-config.js';
import { ref, update, get } from 'firebase/database';

class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.earnedPoints = 0;
        this.pointsPerFood = 5;
        
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp': this.direction = 'up'; break;
                case 'ArrowDown': this.direction = 'down'; break;
                case 'ArrowLeft': this.direction = 'left'; break;
                case 'ArrowRight': this.direction = 'right'; break;
            }
        });
    }

    generateFood() {
        return {
            x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
            y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
        };
    }

    update() {
        if (this.gameOver) return;

        const head = {...this.snake[0]};
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check collisions
        if (this.checkCollision(head)) {
            this.gameOver = true;
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        // Check food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.earnedPoints += this.pointsPerFood;
            this.food = this.generateFood();
            document.getElementById('currentScore').textContent = this.score;
            document.getElementById('earnedPoints').textContent = this.earnedPoints;
        } else {
            this.snake.pop();
        }
    }

    checkCollision(head) {
        return (
            head.x < 0 || 
            head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || 
            head.y >= this.canvas.height / this.gridSize ||
            this.snake.some(segment => segment.x === head.x && segment.y === head.y)
        );
    }

    async endGame() {
        const user = auth.currentUser;
        if (!user) return;

        const userGameRef = dbRef.games(user.uid);
        const userPointsRef = dbRef.points(user.uid);

        const snapshot = await get(userGameRef);
        const currentData = snapshot.val() || {};
        
        if (!currentData.snake || this.score > currentData.snake.highscore) {
            await update(userGameRef, {
                'snake/highscore': this.score
            });
        }

        const pointsSnapshot = await get(userPointsRef);
        const currentPoints = pointsSnapshot.val() || 0;
        await update(ref(db, `users/${user.uid}`), {
            points: currentPoints + this.earnedPoints
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snake
        this.ctx.fillStyle = '#45B7AF';
        this.snake.forEach(segment => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }

    start() {
        setInterval(() => {
            this.update();
            this.draw();
        }, 100);
    }
}

// Game initialisatie
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = 400;
    canvas.height = 400;
    
    const game = new SnakeGame(canvas);
    
    document.getElementById('startGame').addEventListener('click', () => {
        game.start();
    });
}); 