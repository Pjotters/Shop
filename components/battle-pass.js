export class BattlePass {
    constructor(userId) {
        this.userId = userId;
        this.service = new BattlePassService(userId);
        this.tierService = new TierService(userId);
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

    async renderTierProgress(progress) {
        const tierProgress = document.createElement('div');
        tierProgress.className = 'tier-progress';
        
        const currentTierXP = this.tierService.tierLevels[progress.tier].xpNeeded;
        const nextTierXP = this.tierService.tierLevels[progress.tier + 1]?.xpNeeded || currentTierXP;
        const xpProgress = ((progress.experience - currentTierXP) / (nextTierXP - currentTierXP)) * 100;

        tierProgress.innerHTML = `
            <div class="tier-info">
                <span class="current-tier">TIER ${progress.tier}</span>
                <span class="xp-counter">${progress.experience} / ${nextTierXP} XP</span>
            </div>
            <div class="progress-bar">
                <div class="progress" style="width: ${xpProgress}%"></div>
            </div>
            <div class="stars-info">
                <i class="fas fa-star"></i>
                <span>${progress.stars} beschikbare stars</span>
            </div>
        `;

        document.querySelector('.battlepass-progress').appendChild(tierProgress);
    }

    async addGameExperience(xpAmount) {
        const result = await this.tierService.addExperience(xpAmount);
        
        if (result.earnedStars > 0) {
            this.showReward(`Je hebt tier ${result.newTier} bereikt!`, 
                           `+${result.earnedStars} Battle Stars verdiend!`);
        }
        
        await this.renderBattlePass();
    }
} 