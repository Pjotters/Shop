document.addEventListener('DOMContentLoaded', () => {
    // Voorbeeld producten data
    const products = [
        {
            id: 1,
            name: "ZipZop AR-Bril",
            price: "€299,99",
            image: "images/zipzop-main.jpg",
            description: "Geavanceerde AR-bril met ESP32 technologie",
            specs: {
                processor: "ESP32-WROOM-32",
                display: "1.3\" OLED",
                battery: "3000mAh",
                connectivity: "WiFi & Bluetooth"
            },
            url: "product-zipzop.html"
        },
        // Voeg meer producten toe
    ];

    // Functie om producten te tonen
    function displayProducts() {
        const productGrid = document.getElementById('featured-products');
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