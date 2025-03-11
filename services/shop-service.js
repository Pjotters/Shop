import { CouponService } from './coupon-service.js';
import { ref, get, update } from '/firebase/database';
import { db } from '../firebase-config.js';

export class ShopService {
    constructor() {
        this.couponService = new CouponService();
    }

    async purchaseItem(userId, item) {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData.points < item.cost) {
            throw new Error('Niet genoeg punten!');
        }

        // Update gebruiker punten en inventory
        const updates = {
            points: userData.points - item.cost,
            [`inventory/${item.id}`]: {
                purchaseDate: new Date().toISOString(),
                active: true
            }
        };

        await update(userRef, updates);

        // Genereer coupon als bonus (10% van aankoop)
        const couponValue = Math.floor(item.cost * 0.1);
        await this.couponService.createCoupon(
            userId,
            couponValue,
            'Bonus Coupon'
        );

        return true;
    }
} 