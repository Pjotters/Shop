import { GameInitializer } from '../../game-init.js';
import { PowerUpService } from '../../services/power-up-service.js';

export class SpaceShooter {
    constructor(userId) {
        this.userId = userId;
        this.gameInitializer = new GameInitializer('spaceShooter');
        this.powerUpService = new PowerUpService(userId);
        
        this.player = {
            x: 400,
            y: 550,
            width: 50,
            height: 50,
            speed: 5,
            bullets: [],
            powerUps: []
        };
        
        this.enemies = [];
        this.score = 0;
        this.gameLoop = null;
        this.lastShot = 0;
        this.shootDelay = 250; // milliseconds
    }

    async initialize() {
        await this.gameInitializer.initializeGame();
        this.powerUps = await this.powerUpService.getActivePowerUps('spaceShooter');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        if (this.powerUps.includes('rapidFire')) {
            this.shootDelay = 100;
        }
        
        this.setupControls();
        this.startGame();
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shootDelay) return;
        
        if (this.powerUps.includes('tripleShot')) {
            // Schiet 3 lasers
            for (let i = -1; i <= 1; i++) {
                this.player.bullets.push({
                    x: this.player.x + (this.player.width / 2) + (i * 20),
                    y: this.player.y,
                    speed: 7,
                    angle: i * 0.1
                });
            }
        } else {
            // Normale schot
            this.player.bullets.push({
                x: this.player.x + (this.player.width / 2),
                y: this.player.y,
                speed: 7,
                angle: 0
            });
        }
        
        this.lastShot = now;
    }

    update() {
        // Update bullets
        this.player.bullets = this.player.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            bullet.x += Math.sin(bullet.angle) * bullet.speed;
            return bullet.y > 0;
        });

        // Spawn enemies
        if (Math.random() < 0.02) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: 2 + Math.random() * 2
            });
        }

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            return enemy.y < this.canvas.height;
        });

        // Collision detection
        this.checkCollisions();
    }
} 