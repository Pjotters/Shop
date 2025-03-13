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
        this.gameLoop = null;
        this.isGameOver = false;
        
        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.jump();
        });
        canvas.addEventListener('click', () => this.jump());
    }

    jump() {
        if (!this.isGameOver) {
            this.bird.velocity = this.bird.jump;
        }
    }

    spawnPipe() {
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

        // Bird physics
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // Check boundaries
        if (this.bird.y < 0 || this.bird.y > this.canvas.height) {
            this.gameOver();
        }

        // Update pipes
        this.pipes.forEach((pipe, index) => {
            pipe.x -= 2;

            // Check collision
            if (
                this.bird.x + this.bird.size > pipe.x &&
                this.bird.x < pipe.x + 50 &&
                (this.bird.y < pipe.top || this.bird.y + this.bird.size > pipe.bottom)
            ) {
                this.gameOver();
            }

            // Score point
            if (!pipe.counted && pipe.x < this.bird.x) {
                this.score++;
                pipe.counted = true;
                document.getElementById('currentScore').textContent = this.score;
            }

            // Remove off-screen pipes
            if (pipe.x + 50 < 0) {
                this.pipes.splice(index, 1);
            }
        });
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#70c5ce';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw bird
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x + this.bird.size/2, this.bird.y + this.bird.size/2, 
                    this.bird.size/2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw pipes
        this.pipes.forEach(pipe => {
            this.ctx.fillStyle = '#2ed573';
            this.ctx.fillRect(pipe.x, 0, 50, pipe.top);
            this.ctx.fillRect(pipe.x, pipe.bottom, 50, this.canvas.height - pipe.bottom);
        });
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameLoop);
        setTimeout(() => {
            alert(`Game Over! Score: ${this.score}`);
            this.reset();
        }, 100);
    }

    reset() {
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.isGameOver = false;
        document.getElementById('currentScore').textContent = '0';
    }

    start() {
        this.reset();
        this.gameLoop = setInterval(() => {
            this.update();
            this.draw();
        }, 1000/60);
        setInterval(() => {
            if (!this.isGameOver) this.spawnPipe();
        }, 2000);
    }
}

// Game initialisatie
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = 800;
    canvas.height = 400;
    
    const game = new FlappyBird(canvas);
    
    document.getElementById('startGame').addEventListener('click', () => {
        game.start();
    });
}); 