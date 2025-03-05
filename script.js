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
        // Voeg meer producten toe
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