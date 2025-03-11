import { auth, db, dbRef } from '../firebase-config.js';
import { ref, update, get } from '/firebase/database';
import { checkTermsAcceptance } from './terms-popup.js';

class PacMan {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 20;
        this.pacman = {
            x: 10,
            y: 10,
            direction: 'right',
            speed: 0.15,
            mouthOpen: 0.2,
            mouthDir: 0.1
        };
        
        this.score = 0;
        this.earnedPoints = 0;
        this.pointsPerDot = 2;
        this.gameOver = false;
        this.lastTime = 0;
        
        // Maze layout: 0 = wall, 1 = dot, 2 = power pellet, 3 = empty
        this.maze = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0],
            [0,2,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,2,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,1,0],
            [0,1,1,1,1,0,1,1,1,0,0,1,1,1,0,1,1,1,1,0],
            [0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0],
            [0,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,0],
            [0,1,0,0,1,0,1,0,0,3,3,0,0,1,0,1,0,0,1,0],
            [0,1,0,0,1,0,1,0,3,3,3,3,0,1,0,1,0,0,1,0],
            [0,1,1,1,1,1,1,0,0,3,3,0,0,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,1,1,1,1,1,1,1,1,0,1,0,0,1,0],
            [0,1,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,1,0],
            [0,2,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,2,0],
            [0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];

        this.ghosts = [
            {x: 9, y: 9, color: 'red', direction: 'up', speed: 0.1},
            {x: 10, y: 9, color: 'pink', direction: 'up', speed: 0.09},
            {x: 9, y: 10, color: 'cyan', direction: 'down', speed: 0.08},
            {x: 10, y: 10, color: 'orange', direction: 'down', speed: 0.07}
        ];

        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            switch(e.key) {
                case 'ArrowUp': this.pacman.direction = 'up'; break;
                case 'ArrowDown': this.pacman.direction = 'down'; break;
                case 'ArrowLeft': this.pacman.direction = 'left'; break;
                case 'ArrowRight': this.pacman.direction = 'right'; break;
            }
        });

        // Mobile controls
        document.querySelectorAll('.mobile-controls button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.gameOver) return;
                this.pacman.direction = btn.id.replace('Btn', '');
            });
        });
    }

    update(deltaTime) {
        if (this.gameOver) return;

        // Update Pac-Man position
        const moveAmount = this.pacman.speed * deltaTime;
        const newPos = {...this.pacman};
        
        switch(this.pacman.direction) {
            case 'up': newPos.y -= moveAmount; break;
            case 'down': newPos.y += moveAmount; break;
            case 'left': newPos.x -= moveAmount; break;
            case 'right': newPos.x += moveAmount; break;
        }

        // Check collision with walls
        const tileX = Math.floor(newPos.x);
        const tileY = Math.floor(newPos.y);
        
        if (this.maze[tileY] && this.maze[tileY][tileX] !== 0) {
            this.pacman.x = newPos.x;
            this.pacman.y = newPos.y;
            
            // Collect dots
            if (this.maze[tileY][tileX] === 1) {
                this.maze[tileY][tileX] = 3;
                this.score += 10;
                this.earnedPoints += this.pointsPerDot;
                this.updateScoreDisplay();
            }
        }

        // Update ghosts
        this.ghosts.forEach(ghost => this.updateGhost(ghost, deltaTime));

        // Check ghost collisions
        this.checkGhostCollisions();

        // Animate Pac-Man's mouth
        this.pacman.mouthOpen += this.pacman.mouthDir;
        if (this.pacman.mouthOpen >= 0.5 || this.pacman.mouthOpen <= 0) {
            this.pacman.mouthDir *= -1;
        }
    }

    updateGhost(ghost, deltaTime) {
        const moveAmount = ghost.speed * deltaTime;
        const newPos = {...ghost};
        
        switch(ghost.direction) {
            case 'up': newPos.y -= moveAmount; break;
            case 'down': newPos.y += moveAmount; break;
            case 'left': newPos.x -= moveAmount; break;
            case 'right': newPos.x += moveAmount; break;
        }

        const tileX = Math.floor(newPos.x);
        const tileY = Math.floor(newPos.y);

        if (this.maze[tileY] && this.maze[tileY][tileX] !== 0) {
            ghost.x = newPos.x;
            ghost.y = newPos.y;
        } else {
            // Change direction when hitting a wall
            const directions = ['up', 'down', 'left', 'right'];
            ghost.direction = directions[Math.floor(Math.random() * directions.length)];
        }
    }

    checkGhostCollisions() {
        this.ghosts.forEach(ghost => {
            const distance = Math.hypot(
                this.pacman.x - ghost.x,
                this.pacman.y - ghost.y
            );
            
            if (distance < 0.8) {
                this.gameOver = true;
                this.endGame();
            }
        });
    }

    async endGame() {
        const user = auth.currentUser;
        if (!user) return;

        // Update highscore en punten in database
        const userGameRef = dbRef.games(user.uid);
        const userPointsRef = dbRef.points(user.uid);

        const snapshot = await get(userGameRef);
        const currentData = snapshot.val() || {};
        
        if (!currentData.pacman || this.score > currentData.pacman.highscore) {
            await update(userGameRef, {
                'pacman/highscore': this.score
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
        
        // Draw maze
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const tile = this.maze[y][x];
                if (tile === 0) {
                    this.ctx.fillStyle = '#2121DE';
                    this.ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                } else if (tile === 1) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        x * this.tileSize + this.tileSize/2,
                        y * this.tileSize + this.tileSize/2,
                        2,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        }

        // Draw Pac-Man
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(
            this.pacman.x * this.tileSize + this.tileSize/2,
            this.pacman.y * this.tileSize + this.tileSize/2,
            this.tileSize/2,
            this.pacman.mouthOpen * Math.PI,
            (2 - this.pacman.mouthOpen) * Math.PI
        );
        this.ctx.lineTo(
            this.pacman.x * this.tileSize + this.tileSize/2,
            this.pacman.y * this.tileSize + this.tileSize/2
        );
        this.ctx.fill();

        // Draw ghosts
        this.ghosts.forEach(ghost => {
            this.ctx.fillStyle = ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(
                ghost.x * this.tileSize + this.tileSize/2,
                ghost.y * this.tileSize + this.tileSize/2,
                this.tileSize/2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }

    updateScoreDisplay() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('earnedPoints').textContent = this.earnedPoints;
    }

    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        if (!this.gameOver) {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    start() {
        // Reset game state
        this.pacman = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            direction: 'right',
            speed: 5
        };
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
        
        const game = new PacMan(canvas);
        
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