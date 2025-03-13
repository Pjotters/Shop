export class PowerUpShop {
    constructor(userId) {
        this.userId = userId;
        this.powerUpService = new PowerUpService(userId);
    }

    async renderShop() {
        const shopContainer = document.getElementById('powerUpShop');
        const games = ['pjottersJump', 'spaceShooter', 'wordPuzzle'];
        
        for (const gameId of games) {
            const powerUps = this.powerUpService.powerUps[gameId];
            const gameSection = document.createElement('div');
            gameSection.className = 'game-power-ups';
            
            gameSection.innerHTML = `
                <h3>${this.getGameTitle(gameId)}</h3>
                <div class="power-up-grid">
                    ${Object.entries(powerUps).map(([id, powerUp]) => `
                        <div class="power-up-card">
                            <h4>${powerUp.name}</h4>
                            <p>${powerUp.description}</p>
                            <div class="power-up-price">
                                <span>💰 ${powerUp.price}</span>
                                <button onclick="buyPowerUp('${gameId}', '${id}')">
                                    Koop
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            shopContainer.appendChild(gameSection);
        }
    }
} 