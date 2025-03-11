class GameAnimations {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
    }

    createScorePopup(x, y, score) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${score}`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), 1000);
    }

    createParticleEffect(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x,
                y,
                color,
                velocity: {
                    x: (Math.random() - 0.5) * 8,
                    y: (Math.random() - 0.5) * 8
                },
                size: Math.random() * 5 + 2,
                life: 1
            });
        }
    }

    updateParticles() {
        this.particles.forEach((particle, index) => {
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.life -= 0.02;
            
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`;
            this.ctx.fill();
        });
    }

    powerUpCollectAnimation(x, y) {
        this.createParticleEffect(x, y, '69, 183, 175');
        // Voeg glow effect toe
        const glowRadius = 50;
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, 'rgba(69, 183, 175, 0.8)');
        gradient.addColorStop(1, 'rgba(69, 183, 175, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
    }
}

export default GameAnimations; 