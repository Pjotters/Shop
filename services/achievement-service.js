import { db, ref, get, update, serverTimestamp } from '../firebase-config.js';

export class AchievementService {
    constructor(userId) {
        this.userId = userId;
        this.achievements = {
            // Algemene achievements
            firstWin: { 
                id: 'firstWin',
                title: 'Eerste Overwinning', 
                description: 'Win je eerste game', 
                icon: '🏆',
                reward: 100,
                xp: 500,
                rarity: 'common'
            },
            speedRunner: { 
                id: 'speedRunner',
                title: 'Speed Runner', 
                description: 'Speel 3 games binnen 5 minuten', 
                icon: '⚡',
                reward: 250,
                xp: 1000,
                rarity: 'rare'
            },
            pointCollector: { 
                id: 'pointCollector',
                title: 'Punt Verzamelaar', 
                description: 'Verzamel 1000 punten', 
                icon: '💎',
                reward: 500,
                xp: 2000,
                rarity: 'epic'
            },

            // Game-specifieke achievements
            flappyMaster: {
                id: 'flappyMaster',
                title: 'Flappy Meester',
                description: 'Behaal een score van 100 in Flappy Bird',
                icon: '🐦',
                reward: 1000,
                xp: 5000,
                rarity: 'legendary',
                game: 'flappyBird'
            },
            snakeCharmer: {
                id: 'snakeCharmer',
                title: 'Slangenbezweerder',
                description: 'Bereik een lengte van 30 in Snake',
                icon: '🐍',
                reward: 800,
                xp: 4000,
                rarity: 'epic',
                game: 'snake'
            },
            pacmanFeast: {
                id: 'pacmanFeast',
                title: 'Spokenfeest',
                description: 'Eet 10 spoken in één game van Pac-Man',
                icon: '👻',
                reward: 1200,
                xp: 6000,
                rarity: 'legendary',
                game: 'pacman'
            }
        };
    }

    async checkAchievement(achievementId, value) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return;

        const userAchievementsRef = ref(db, `users/${this.userId}/achievements/${achievementId}`);
        const snapshot = await get(userAchievementsRef);

        if (snapshot.exists() && snapshot.val().completed) return; // Al behaald

        const completed = this.evaluateAchievement(achievement, value);
        if (completed) {
            await this.unlockAchievement(achievement);
        }
    }

    evaluateAchievement(achievement, value) {
        // Hier kun je specifieke logica toevoegen per achievement
        switch (achievement.id) {
            case 'pointCollector':
                return value >= 1000;
            case 'speedRunner':
                return value >= 3;
            case 'flappyMaster':
                return value >= 100;
            case 'snakeCharmer':
                return value >= 30;
            case 'pacmanFeast':
                return value >= 10;
            default:
                return true;
        }
    }

    async unlockAchievement(achievement) {
        // Update achievement status
        const achievementRef = ref(db, `users/${this.userId}/achievements/${achievement.id}`);
        await update(achievementRef, {
            completed: true,
            unlockedAt: serverTimestamp(),
            reward: achievement.reward,
            xp: achievement.xp
        });

        // Update user stats
        const userRef = ref(db, `users/${this.userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        await update(userRef, {
            points: (userData.points || 0) + achievement.reward,
            xp: (userData.xp || 0) + achievement.xp,
            achievementsCompleted: (userData.achievementsCompleted || 0) + 1
        });

        // Toon notificatie
        this.showAchievementPopup(achievement);
        this.createParticleEffect();
    }

    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-notification';
        popup.innerHTML = `
            <div class="achievement-content ${achievement.rarity}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                    <div class="achievement-rewards">
                        <span class="coins">+${achievement.reward} 🪙</span>
                        <span class="xp">+${achievement.xp} XP</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
        requestAnimationFrame(() => popup.classList.add('show'));

        setTimeout(() => {
            popup.classList.add('hide');
            setTimeout(() => popup.remove(), 500);
        }, 4000);
    }

    createParticleEffect() {
        const container = document.createElement('div');
        container.className = 'particle-container';
        document.body.appendChild(container);

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const hue = Math.random() * 360;
            particle.style.background = `hsl(${hue}, 100%, 50%)`;
            particle.style.left = '50%';
            particle.style.top = '50%';
            
            const angle = (i / 30) * Math.PI * 2;
            const velocity = 2 + Math.random() * 2;
            particle.style.setProperty('--tx', `${Math.cos(angle) * 100 * velocity}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * 100 * velocity}px`);
            
            container.appendChild(particle);
        }

        setTimeout(() => container.remove(), 1000);
    }
} 