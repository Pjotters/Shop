export class BattlePass {
    constructor(userId) {
        this.userId = userId;
        this.service = new BattlePassService(userId);
        this.currentPage = 1;
        this.initializeBattlePass();
    }

    async initializeBattlePass() {
        await this.service.initializeBattlePass();
        await this.renderBattlePass();
        this.addEventListeners();
    }

    async renderBattlePass() {
        const progress = await this.service.getBattlePassProgress();
        const rewardsTrack = document.querySelector('.rewards-track');
        const pageIndicator = document.querySelector('.page-indicator');
        
        // Update header info
        document.querySelector('.tier-number').textContent = `TIER ${progress.tier}/14`;
        document.querySelector('.stars-display span').textContent = progress.stars;

        // Render rewards voor huidige pagina
        const rewards = this.service.rewards[this.currentPage];
        rewardsTrack.innerHTML = rewards.map(reward => this.createRewardElement(reward, progress)).join('');
        
        pageIndicator.textContent = `PAGINA ${this.currentPage}/14`;
    }

    createRewardElement(reward, progress) {
        const isLocked = progress.tier < this.currentPage;
        const isClaimed = progress.claimedRewards?.[reward.id];
        
        return `
            <div class="reward-item ${isLocked ? 'locked' : ''} ${isClaimed ? 'claimed' : ''}" 
                 data-reward-id="${reward.id}">
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-info">
                    <h4>${reward.name}</h4>
                    <span class="rarity ${reward.rarity}">${reward.rarity}</span>
                </div>
                <div class="reward-cost">${reward.cost}⭐</div>
            </div>
        `;
    }

    addEventListeners() {
        document.querySelectorAll('.reward-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                const rewardId = e.currentTarget.dataset.rewardId;
                try {
                    await this.service.claimReward(rewardId, this.currentPage);
                    await this.renderBattlePass(); // Ververs de weergave
                } catch (error) {
                    alert(error.message);
                }
            });
        });

        // Navigatie knoppen
        document.querySelector('.prev-page')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderBattlePass();
            }
        });

        document.querySelector('.next-page')?.addEventListener('click', () => {
            if (this.currentPage < 14) {
                this.currentPage++;
                this.renderBattlePass();
            }
        });
    }
} 