export class PowerUpsService {
    constructor() {
        this.powerUps = {
            doublePoints: {
                name: "Dubbele Punten",
                description: "Verdien 2x zoveel punten voor 1 uur",
                cost: 500,
                duration: 3600
            },
            extraLife: {
                name: "Extra Leven",
                description: "Krijg een extra leven in games",
                cost: 300,
                uses: 1
            },
            timeSlow: {
                name: "Tijd Vertrager",
                description: "Vertraag de tijd in games voor 30 seconden",
                cost: 200,
                duration: 30
            }
        };
    }

    async purchasePowerUp(userId, powerUpId) {
        // Koop en activeer power-up
    }
} 