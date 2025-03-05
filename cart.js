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
        this.total = 0;
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
}

const cart = new ShoppingCart(); 