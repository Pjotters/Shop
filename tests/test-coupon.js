import { CouponService } from '../services/coupon-service.js';

async function testCouponSystem() {
    const couponService = new CouponService();
    
    try {
        const testCoupon = await couponService.createCoupon(
            'test-user-id',
            500,
            '€5 Korting'
        );
        console.log('Test coupon aangemaakt:', testCoupon);
    } catch (error) {
        console.error('Test mislukt:', error);
    }
}

testCouponSystem(); 