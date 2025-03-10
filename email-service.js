import emailjs from '@emailjs/browser';

export class EmailService {
    constructor() {
        this.publicKey = 'VSO6TQThqiwRD3XiK';
        this.serviceId = 'service_fwi5n3f';
        this.templateId = 'template_nxme3is';
        emailjs.init(this.publicKey);
    }

    async sendCouponEmail(userEmail, couponData) {
        const templateParams = {
            to_email: userEmail,
            coupon_code: couponData.code,
            points_value: couponData.pointsValue,
            expiry_date: new Date(couponData.expiryDate).toLocaleDateString('nl-NL')
        };

        try {
            const response = await emailjs.send(
                this.serviceId,
                this.templateId,
                templateParams
            );
            console.log('Email verzonden:', response);
            return response;
        } catch (error) {
            console.error('Email verzenden mislukt:', error);
            throw error;
        }
    }
} 