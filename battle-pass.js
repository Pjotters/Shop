class BattlePass {
    constructor() {
        this.rewards = [
            { id: 1, type: 'banner', icon: '🎨', cost: 3, requiredLevel: 1 },
            { id: 2, type: 'vbucks', icon: 'V', cost: 2, requiredLevel: 2 },
            { id: 3, type: 'skin', icon: '👤', cost: 5, requiredLevel: 3 },
            { id: 4, type: 'weapon', icon: '🔫', cost: 4, requiredLevel: 4 },
            { id: 5, type: 'emote', icon: '💃', cost: 3, requiredLevel: 5 },
            { id: 6, type: 'pickaxe', icon: '⛏️', cost: 4, requiredLevel: 6 },
            { id: 7, type: 'emoticon', icon: '😎', cost: 3, requiredLevel: 7 },
            { id: 8, type: 'vbucks', icon: 'V', cost: 2, requiredLevel: 8 }
        ];
        
        this.userLevel = 1;
        this.battleStars = 0;
        this.initializeBattlePass();
    }

    async initializeBattlePass() {
        await this.loadUserProgress();
        this.renderRewards();
        this.addEventListeners();
    }

    async loadUserProgress() {
        // Hier komt de Firebase integratie voor het laden van gebruikersvoortgang
        this.userLevel = 1; // Voorbeeld
        this.battleStars = 30; // Voorbeeld
    }

    renderRewards() {
        const rewardsTrack = document.querySelector('.rewards-track');
        rewardsTrack.innerHTML = this.rewards.map(reward => `
            <div class="reward-item ${this.userLevel < reward.requiredLevel ? 'locked' : ''}"
                 data-reward-id="${reward.id}">
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-cost">${reward.cost}⭐</div>
            </div>
        `).join('');
    }

    addEventListeners() {
        document.querySelectorAll('.reward-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const rewardId = e.currentTarget.dataset.rewardId;
                this.selectReward(rewardId);
            });
        });
    }

    selectReward(rewardId) {
        const reward = this.rewards.find(r => r.id === parseInt(rewardId));
        if (!reward) return;

        if (this.userLevel < reward.requiredLevel) {
            alert('Je moet eerst een hoger level bereiken!');
            return;
        }

        if (this.battleStars < reward.cost) {
            alert('Je hebt niet genoeg Battle Stars!');
            return;
        }

        // Implementeer hier de claim logica
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BattlePass();
}); 