import { 
    db, 
    ref, 
    get, 
    update, 
    serverTimestamp, 
    onValue 
} from '../firebase-config.js';

export class DailyChallengesService {
    constructor(userId) {
        this.userId = userId;
        this.challenges = {
            flappyBird: [
                { 
                    id: 'fb_score_50',
                    type: 'score', 
                    target: 50, 
                    reward: 100, 
                    description: 'Behaal 50 punten in één game',
                    xp: 500
                },
                { 
                    id: 'fb_time_60',
                    type: 'time', 
                    target: 60, 
                    reward: 150, 
                    description: 'Overleef 60 seconden',
                    xp: 750
                },
                { 
                    id: 'fb_pipes_20',
                    type: 'pipes', 
                    target: 20, 
                    reward: 200, 
                    description: 'Passeer 20 pijpen',
                    xp: 1000
                }
            ],
            snake: [
                { 
                    id: 'sn_length_15',
                    type: 'length', 
                    target: 15, 
                    reward: 120, 
                    description: 'Bereik lengte 15',
                    xp: 600
                },
                { 
                    id: 'sn_apples_10',
                    type: 'apples', 
                    target: 10, 
                    reward: 100, 
                    description: 'Eet 10 appels in één game',
                    xp: 500
                },
                { 
                    id: 'sn_speed_5',
                    type: 'speed', 
                    target: 5, 
                    reward: 180, 
                    description: 'Bereik snelheidsniveau 5',
                    xp: 900
                }
            ],
            pacman: [
                { 
                    id: 'pm_ghosts_4',
                    type: 'ghosts', 
                    target: 4, 
                    reward: 200, 
                    description: 'Eet 4 spoken in één game',
                    xp: 1000
                },
                { 
                    id: 'pm_points_1000',
                    type: 'points', 
                    target: 1000, 
                    reward: 150, 
                    description: 'Score 1000 punten',
                    xp: 750
                },
                { 
                    id: 'pm_powerups_3',
                    type: 'powerups', 
                    target: 3, 
                    reward: 130, 
                    description: 'Gebruik 3 power-ups',
                    xp: 650
                }
            ]
        };
        
        this.setupRealtimeUpdates();
    }

    setupRealtimeUpdates() {
        const challengesRef = ref(db, `users/${this.userId}/dailyChallenges`);
        onValue(challengesRef, (snapshot) => {
            if (snapshot.exists()) {
                this.updateChallengesUI(snapshot.val());
            }
        });
    }

    updateChallengesUI(challenges) {
        const container = document.getElementById('dailyChallenges');
        if (!container) return;

        const today = new Date().toISOString().split('T')[0];
        const todaysChallenges = challenges[today] || [];

        container.innerHTML = `
            <div class="challenges-header">
                <h3>Dagelijkse Uitdagingen</h3>
                <span class="refresh-time">Ververst om middernacht</span>
            </div>
            <div class="challenges-grid">
                ${todaysChallenges.map(challenge => `
                    <div class="challenge-card ${challenge.completed ? 'completed' : ''}">
                        <div class="challenge-icon">
                            ${this.getGameIcon(challenge.game)}
                        </div>
                        <div class="challenge-info">
                            <h4>${challenge.description}</h4>
                            <div class="challenge-progress">
                                <div class="progress-bar" style="width: ${(challenge.progress || 0) / challenge.target * 100}%"></div>
                                <span>${challenge.progress || 0}/${challenge.target}</span>
                            </div>
                        </div>
                        <div class="challenge-rewards">
                            <span class="coins">+${challenge.reward} 🪙</span>
                            <span class="xp">+${challenge.xp} XP</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getGameIcon(game) {
        const icons = {
            flappyBird: '🐦',
            snake: '🐍',
            pacman: '👻'
        };
        return icons[game] || '🎮';
    }

    async getDailyChallenges() {
        const today = new Date().toISOString().split('T')[0];
        const challengesRef = ref(db, `users/${this.userId}/dailyChallenges/${today}`);
        const snapshot = await get(challengesRef);
        
        if (snapshot.exists()) {
            return snapshot.val();
        }

        const dailyChallenges = this.generateDailyChallenges();
        await update(challengesRef, {
            challenges: dailyChallenges,
            generatedAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
        });
        return dailyChallenges;
    }

    generateDailyChallenges() {
        const games = Object.keys(this.challenges);
        return games.map(game => {
            const gamesChallenges = this.challenges[game];
            const randomChallenge = gamesChallenges[Math.floor(Math.random() * gamesChallenges.length)];
            return {
                ...randomChallenge,
                game,
                progress: 0,
                completed: false,
                startedAt: serverTimestamp()
            };
        });
    }

    async updateChallengeProgress(gameId, type, value) {
        const today = new Date().toISOString().split('T')[0];
        const challengesRef = ref(db, `users/${this.userId}/dailyChallenges/${today}/challenges`);
        const snapshot = await get(challengesRef);
        
        if (!snapshot.exists()) return;

        const challenges = snapshot.val();
        const updatedChallenges = challenges.map(challenge => {
            if (challenge.game === gameId && challenge.type === type && !challenge.completed) {
                const newProgress = Math.min(challenge.target, (challenge.progress || 0) + value);
                const completed = newProgress >= challenge.target;
                
                if (completed && !challenge.completed) {
                    this.rewardChallenge(challenge);
                }

                return {
                    ...challenge,
                    progress: newProgress,
                    completed,
                    completedAt: completed ? serverTimestamp() : null
                };
            }
            return challenge;
        });

        await update(challengesRef, updatedChallenges);
    }

    async rewardChallenge(challenge) {
        const userRef = ref(db, `users/${this.userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        await update(userRef, {
            points: (userData.points || 0) + challenge.reward,
            xp: (userData.xp || 0) + challenge.xp
        });

        // Toon achievement notificatie
        this.showChallengeComplete(challenge);
    }

    showChallengeComplete(challenge) {
        const notification = document.createElement('div');
        notification.className = 'challenge-complete-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getGameIcon(challenge.game)}</div>
                <div class="notification-text">
                    <h4>Uitdaging Voltooid!</h4>
                    <p>${challenge.description}</p>
                </div>
                <div class="notification-rewards">
                    <span>+${challenge.reward} 🪙</span>
                    <span>+${challenge.xp} XP</span>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
} 