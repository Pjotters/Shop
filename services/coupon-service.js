import { db } from '../firebase-config.js';
import { ref, set, get, query, orderByChild, startAt } from 'firebase/database';
import { EmailService } from '../email-service.js';

export class CouponService {
    constructor() {
        this.emailService = new EmailService();
    }

    generateCouponCode() {
        return 'PJ-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    async createCoupon(userId, pointsValue, title) {
        const couponData = {
            code: this.generateCouponCode(),
            pointsValue: pointsValue,
            title: title,
            expiryDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 dagen
            userId: userId,
            used: false,
            createdAt: new Date().toISOString()
        };

        try {
            // Sla coupon op in Firebase
            await set(ref(db, `coupons/${couponData.code}`), couponData);
            
            // Haal gebruiker email op
            const userSnapshot = await get(ref(db, `users/${userId}`));
            const userEmail = userSnapshot.val().email;
            
            // Verstuur email
            await this.emailService.sendCouponEmail(userEmail, couponData);
            
            return couponData;
        } catch (error) {
            console.error('Coupon aanmaken mislukt:', error);
            throw error;
        }
    }

    async getUserCoupons(userId) {
        const couponsRef = ref(db, 'coupons');
        const userCouponsQuery = query(
            couponsRef,
            orderByChild('userId'),
            startAt(userId)
        );

        const snapshot = await get(userCouponsQuery);
        const coupons = [];

        snapshot.forEach(childSnapshot => {
            const coupon = childSnapshot.val();
            if (coupon.userId === userId && !coupon.used && 
                new Date(coupon.expiryDate) > new Date()) {
                coupons.push({
                    code: childSnapshot.key,
                    ...coupon
                });
            }
        });

        return coupons;
    }

    async validateCoupon(code) {
        const couponRef = ref(db, `coupons/${code}`);
        const snapshot = await get(couponRef);
        
        if (!snapshot.exists()) return null;
        
        const coupon = snapshot.val();
        if (coupon.used || new Date(coupon.expiryDate) < new Date()) {
            return null;
        }
        
        return coupon;
    }
} 