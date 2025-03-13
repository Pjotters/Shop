import { db, ref, get, update } from '../firebase-config.js';

export class PowerUpService {
    constructor(userId) {
        this.userId = userId;
        this.powerUps = {
            pjottersJump: {
                doubleJump: {
                    name: 'Double Jump',
                    description: 'Spring twee keer!',
                    price: 1000,
                    duration: 300000 // 5 minuten
                },
                shield: {
                    name: 'Shield',
                    description: 'Bescherming tegen één botsing',
                    price: 750,
                    duration: 180000 // 3 minuten
                }
            },
            spaceShooter: {
                rapidFire: {
                    name: 'Rapid Fire',
                    description: 'Schiet sneller!',
                    price: 1200,
                    duration: 240000 // 4 minuten
                },
                tripleShot: {
                    name: 'Triple Shot',
                    description: 'Schiet drie lasers tegelijk',
                    price: 2000,
                    duration: 180000 // 3 minuten
                }
            },
            wordPuzzle: {
                hint: {
                    name: 'Hint',
                    description: 'Krijg een hint voor het woord',
                    price: 500,
                    uses: 1
                },
                timeBonus: {
                    name: 'Extra Tijd',
                    description: '+30 seconden',
                    price: 300,
                    uses: 1
                }
            }
        };
    }

    async buyPowerUp(gameId, powerUpId) {
        const userRef = ref(db, `users/${this.userId}`);
        const userData = (await get(userRef)).val();
        const powerUp = this.powerUps[gameId][powerUpId];

        if (userData.points >= powerUp.price) {
            await update(userRef, {
                points: userData.points - powerUp.price,
                [`powerUps/${gameId}/${powerUpId}`]: {
                    active: true,
                    purchasedAt: Date.now(),
                    expiresAt: Date.now() + (powerUp.duration || 0),
                    remainingUses: powerUp.uses || null
                }
            });
            return true;
        }
        return false;
    }

    async getActivePowerUps(gameId) {
        const powerUpsRef = ref(db, `users/${this.userId}/powerUps/${gameId}`);
        const snapshot = await get(powerUpsRef);
        const activePowerUps = [];

        if (snapshot.exists()) {
            const powerUps = snapshot.val();
            for (const [id, powerUp] of Object.entries(powerUps)) {
                if (powerUp.active && 
                    (powerUp.expiresAt > Date.now() || powerUp.remainingUses > 0)) {
                    activePowerUps.push(id);
                }
            }
        }

        return activePowerUps;
    }
} 