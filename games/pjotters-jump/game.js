import { GameInitializer } from '../../game-init.js';
import { PowerUpService } from '../../services/power-up-service.js';

export class PjottersJump {
    constructor(userId) {
        this.userId = userId;
        this.gameInitializer = new GameInitializer('pjottersJump');
        this.powerUpService = new PowerUpService(userId);
        
        this.player = {
            x: 50,
            y: 200,
            velocity: 0,
            gravity: 0.5,
            jumpForce: -10,
            isJumping: false,
            skin: 'default',
            powerUps: []
        };
        
        this.obstacles = [];
        this.stars = [];
        this.score = 0;
        this.gameLoop = null;
    }

    async initialize() {
        await this.gameInitializer.initializeGame();
        this.powerUps = await this.powerUpService.getActivePowerUps('pjottersJump');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupEventListeners();
        this.startGame();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.player.isJumping) {
                this.jump();
            }
        });
    }

    jump() {
        this.player.velocity = this.player.jumpForce;
        this.player.isJumping = true;
        
        if (this.powerUps.includes('doubleJump')) {
            setTimeout(() => {
                this.player.canDoubleJump = true;
            }, 100);
        }
    }

    update() {
        // Update player position
        this.player.velocity += this.player.gravity;
        this.player.y += this.player.velocity;

        // Generate obstacles and stars
        if (Math.random() < 0.02) {
            this.obstacles.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 100)
            });
        }

        // Update game objects
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= 5;
            return obstacle.x > -20;
        });

        // Collision detection
        this.checkCollisions();
        
        // Update score
        this.score++;
    }

    checkCollisions() {
        // Implementeer botsingsdetectie
    }

    draw() {
        // Teken spelelementen
    }

    startGame() {
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 1000/60);
    }
} 