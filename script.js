document.addEventListener('DOMContentLoaded', () => {
    // Voorbeeld producten data
    const products = [
        {
            id: 1,
            name: "ZipZop AR-Bril",
            price: "99,99",
            image: "images/ar-zipzop.png",
            description: "De goedkoopste en geavanceerde AR-bril",
            specs: {
                processor: "ESP32-cam",
                display: "0.96\" OLED",
                battery: "25000mAh",
                connectivity: "WiFi & Bluetooth",
                Usable: "Iphone & androit",
                Systeem: "Pjotters"
            },
            url: "product-zipzop.html"
        },
        {
            id: 2,
            name: "Pjotters-Basis",
            price: "Gratis",
            image: "images/AB-Basic.png",
            description: "3 Gratis bedrijven",
            specs: {
                Toegang: "Basis Pjotters",
                Bedrijven: "3 gratis bedrijven",
                Hulp: "Community support",
                Verzekering: "Voor Altijd Gratis"
            },
            url: "https://pjotters.github.io/company/subscriptions.html"
        },
        {
            id: 3,
            name: "Pjotters-Pro",
            price: "9.99/maand",
            image: "images/AB-Pro.png",
            description: "10 Gratis bedrijven",
            specs: {
                Toegang: "Basis Pjotters",
                Bedrijven: "10 gratis bedrijven",
                Hulp: "Priority support",
                Extra: "News, Updates, Pjotters-Apps, game-realeses, en meer",
                ZipZop: "Extra toegang tot ZipZop (web en app)",
                Verzekering: "Tijdelijk Gratis"
            },
            url: "https://pjotters.github.io/company/subscriptions.html"
        },
        {
            id: 4,
            name: "Pjotters-Premium",
            price: "99.99/maand",
            image: "images/AB-Premium.png",
            description: "Toegang tot alle Pjotters-bedrijven",
            specs: {
                Toegang: "Basis Pjotters",
                Bedrijven: "Alle bedrijven",
                Hulp: "VIP support",
                Pro: "Alles van Pjotters-Pro",
                "ZipZop-Online": "Extra toegang tot ZipZop (web en app)",
                Verzekering: "Tijdelijk Gratis"
            },
            url: "https://pjotters.github.io/company/subscriptions.html"
        },
       
    ];

    // Functie om producten te tonen
    function displayProducts() {
        const productGrid = document.getElementById('featured-products');
        productGrid.className = 'product-grid';
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card animate__animated animate__fadeIn';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="price">${product.price}</div>
                <a href="${product.url}" class="view-details">Bekijk details</a>
            `;
            productGrid.appendChild(productCard);
        });
    }

    displayProducts();
}); 