import { auth, db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

let products = [];

// Producten ophalen
fetch('products.json')
    .then(response => response.json())
    .then(data => {
        products = data;
    })
    .catch(error => console.error('Error loading products:', error));

class ShoppingCart {
    constructor() {
        this.items = [];
        this.couponDiscount = 0;
        this.activeCoupon = null;
        this.init();
    }

    init() {
        // Laad opgeslagen winkelwagen
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.items = JSON.parse(savedCart);
            this.updateTotal();
        }

        // Event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                const productId = e.target.dataset.productId;
                const quantity = document.querySelector('.qty-input')?.value || 1;
                this.addItem(productId, quantity);
            }
        });
    }

    addItem(productId, quantity) {
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
            // Check of het product al in de winkelwagen zit
            const existingItem = this.items.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += parseInt(quantity);
            } else {
                this.items.push({
                    ...product,
                    quantity: parseInt(quantity)
                });
            }
            
            this.updateCart();
            this.showNotification('Product toegevoegd aan winkelwagen');
        }
    }

    updateCart() {
        this.updateTotal();
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateCartIcon();
    }

    updateTotal() {
        this.total = this.items.reduce((sum, item) => {
            const price = item.price === "Gratis" ? 0 : parseFloat(item.price.replace(',', '.').replace('€', ''));
            return sum + (price * item.quantity);
        }, 0);
    }

    updateCartIcon() {
        const cartIcon = document.querySelector('.shopping-cart');
        cartIcon.innerHTML = `🛒 ${this.items.length}`;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification animate__animated animate__fadeIn';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.updateCartDisplay();
    }

    async validateCoupon(code) {
        const couponRef = ref(db, 'coupons');
        const snapshot = await get(couponRef);
        const coupons = snapshot.val();

        const coupon = Object.values(coupons).find(c => 
            c.code === code && !c.used && !c.expired);

        if (coupon) {
            this.couponDiscount = coupon.points;
            this.activeCoupon = coupon;
            this.updateCartDisplay();
            return true;
        }
        return false;
    }

    async checkout() {
        const user = auth.currentUser;
        if (!user) return false;

        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        const totalCost = this.calculateTotal();
        if (userData.points < totalCost) return false;

        const updates = {
            points: userData.points - totalCost + this.couponDiscount,
            inventory: { ...userData.inventory }
        };

        // Voeg gekochte items toe aan inventory
        this.items.forEach(item => {
            updates.inventory[item.id] = {
                purchaseDate: new Date().toISOString(),
                active: true
            };
        });

        // Update coupon status indien gebruikt
        if (this.activeCoupon) {
            updates[`coupons/${this.activeCoupon.id}/used`] = true;
        }

        await update(userRef, updates);
        this.clearCart();
        return true;
    }

    calculateTotal() {
        const subtotal = this.items.reduce((total, item) => total + item.price, 0);
        return Math.max(0, subtotal - this.couponDiscount);
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        const discountAmount = document.getElementById('discountAmount');
        const finalTotal = document.getElementById('finalTotal');

        cartItems.innerHTML = this.items.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p>${item.price} punten</p>
                </div>
                <button onclick="cart.removeItem('${item.id}')">×</button>
            </div>
        `).join('');

        const subtotal = this.items.reduce((total, item) => total + item.price, 0);
        cartTotal.textContent = subtotal;
        discountAmount.textContent = this.couponDiscount;
        finalTotal.textContent = this.calculateTotal();
    }

    clearCart() {
        this.items = [];
        this.couponDiscount = 0;
        this.activeCoupon = null;
        this.updateCartDisplay();
    }
}

// Initialiseer winkelwagen
const cart = new ShoppingCart();
window.cart = cart; // Maak beschikbaar voor HTML onclick handlers

// Event listeners
document.getElementById('checkoutBtn').addEventListener('click', async () => {
    const success = await cart.checkout();
    if (success) {
        alert('Aankoop succesvol!');
        location.reload();
    } else {
        alert('Er ging iets mis bij het afrekenen. Controleer je punten saldo.');
    }
});

document.getElementById('couponInput').addEventListener('keyup', async (e) => {
    if (e.key === 'Enter') {
        const code = e.target.value;
        const valid = await cart.validateCoupon(code);
        if (valid) {
            alert('Coupon toegepast!');
            e.target.value = '';
        } else {
            alert('Ongeldige of verlopen coupon code.');
        }
    }
}); 