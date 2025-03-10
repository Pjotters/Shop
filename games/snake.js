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
        this.score = 0;
        this.earnedPoints = 0;
        this.gameSpeed = 150;
        this.powerUps = [];
        
        // Sprites laden
        this.snakeHeadSprite = new Image();
        this.snakeHeadSprite.src = '../images/games/snake-head.png';
        this.snakeBodySprite = new Image();
        this.snakeBodySprite.src = '../images/games/snake-body.png';
        this.appleSprite = new Image();
        this.appleSprite.src = '../images/games/apple.png';
        
        // Power-up types
        this.powerUpTypes = {
            speed: { color: '#FFD700', duration: 5000, effect: () => this.activateSpeedBoost() },
            points: { color: '#FF1493', duration: 0, effect: () => this.doublePoints() },
            ghost: { color: '#00CED1', duration: 8000, effect: () => this.activateGhostMode() }
        };
        
        this.activeEffects = {
            speedBoost: false,
            ghostMode: false
        };

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

        this.food = this.generateFood();
        this.gameLoop = null;
        this.isGameOver = false;
    }

    activateSpeedBoost() {
        this.activeEffects.speedBoost = true;
        this.gameSpeed = 80;
        setTimeout(() => {
            this.activeEffects.speedBoost = false;
            this.gameSpeed = 150;
        }, 5000);
    }

    activateGhostMode() {
        this.activeEffects.ghostMode = true;
        setTimeout(() => {
            this.activeEffects.ghostMode = false;
        }, 8000);
    }

    doublePoints() {
        this.earnedPoints += this.score * 5;
        document.getElementById('earnedPoints').textContent = this.earnedPoints;
    }

    generatePowerUp() {
        if (Math.random() < 0.1 && this.powerUps.length < 2) {
            const types = Object.keys(this.powerUpTypes);
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push({
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize)),
                type: type
            });
        }
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
        // Check collisions
        const head = {...this.snake[0]};
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        // Check food
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

        // Check power-up collectie
        this.powerUps.forEach((powerUp, index) => {
            if (head.x === powerUp.x && head.y === powerUp.y) {
                this.powerUps.splice(index, 1);
                this.powerUpTypes[powerUp.type].effect();
            }
        });

        // Genereer nieuwe power-up
        this.generatePowerUp();
    }

    checkCollision(head) {
        // Check muur botsingen
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }
        
        // Check slang botsingen (behalve in ghost mode)
        if (!this.activeEffects.ghostMode) {
            return this.snake.some((segment, index) => 
                index !== 0 && segment.x === head.x && segment.y === head.y
            );
        }
        return false;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Teken snake
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Teken hoofd met rotatie
                this.ctx.save();
                this.ctx.translate(segment.x * this.gridSize + this.gridSize/2, 
                                 segment.y * this.gridSize + this.gridSize/2);
                this.ctx.rotate(this.getRotation());
                this.ctx.drawImage(this.snakeHeadSprite, 
                                 -this.gridSize/2, -this.gridSize/2, 
                                 this.gridSize, this.gridSize);
                this.ctx.restore();
            } else {
                // Teken lichaam met ghost effect indien actief
                if (this.activeEffects.ghostMode) {
                    this.ctx.globalAlpha = 0.5;
                }
                this.ctx.drawImage(this.snakeBodySprite, 
                                 segment.x * this.gridSize, 
                                 segment.y * this.gridSize, 
                                 this.gridSize, this.gridSize);
                this.ctx.globalAlpha = 1;
            }
        });

        // Teken power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = this.powerUpTypes[powerUp.type].color;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x * this.gridSize + this.gridSize/2,
                        powerUp.y * this.gridSize + this.gridSize/2,
                        this.gridSize/3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Teken appel
        this.ctx.drawImage(this.appleSprite, 
                          this.food.x * this.gridSize, 
                          this.food.y * this.gridSize, 
                          this.gridSize, this.gridSize);
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
        if (this.gameLoop) return;
        this.isGameOver = false;
        this.score = 0;
        this.earnedPoints = 0;
        this.snake = [{x: 10, y: 10}];
        this.direction = 'right';
        this.food = this.generateFood();
        
        // Start game loop
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, this.gameSpeed);
    }

    generateFood() {
        const x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
        const y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
        return {x, y};
    }
}

// Game initialisatie
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const canvas = document.getElementById('gameCanvas');
        canvas.width = 800;
        canvas.height = 800;
        
        const game = new Snake(canvas);

        const startButton = document.getElementById('startGame');
        startButton.addEventListener('click', () => {
            game.start();
            startButton.style.display = 'none';
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp': game.direction = 'up'; break;
                case 'ArrowDown': game.direction = 'down'; break;
                case 'ArrowLeft': game.direction = 'left'; break;
                case 'ArrowRight': game.direction = 'right'; break;
            }
        });
    } catch (error) {
        console.error('Game initialization error:', error);
    }
}); 