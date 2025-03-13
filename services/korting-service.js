import { db, ref, get, update } from '../firebase-config.js';

export class KortingService {
    constructor(userId) {
        this.userId = userId;
    }

    async claimCoupon(pointsRequired, couponValue) {
        const userRef = ref(db, `users/${this.userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (!userData || userData.points < pointsRequired) {
            throw new Error('Niet genoeg punten beschikbaar');
        }

        const updates = {
            points: userData.points - pointsRequired,
            [`coupons/${Date.now()}`]: {
                value: couponValue,
                claimed: true,
                claimedAt: new Date().toISOString()
            }
        };

        await update(userRef, updates);
        return true;
    }
} 