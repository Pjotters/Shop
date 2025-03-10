import { auth, db } from './firebase-config.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const shopItems = {
    characterSkins: [
        {
            id: 'flappy_gold',
            name: 'Gouden Vogel',
            price: 1000,
            image: 'images/shop/flappy-gold.png',
            game: 'flappyBird'
        },
        {
            id: 'snake_neon',
            name: 'Neon Slang',
            price: 800,
            image: 'images/shop/snake-neon.png',
            game: 'snake'
        }
    ],
    powerUps: [
        {
            id: 'double_points',
            name: 'Dubbele Punten',
            price: 500,
            duration: '24 uur',
            description: 'Verdien 2x zoveel punten in alle games'
        },
        {
            id: 'shield',
            name: 'Schild',
            price: 300,
            duration: '1 game',
            description: 'Één extra leven per game'
        }
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserPoints();
    renderShopItems();
});

async function loadUserPoints() {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    
    document.getElementById('userPoints').textContent = userData.points || 0;
}

async function buyItem(item) {
    const user = auth.currentUser;
    if (!user) {
        alert('Je moet ingelogd zijn om items te kopen!');
        return;
    }

    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();

    if (userData.points < item.price) {
        alert('Niet genoeg punten!');
        return;
    }

    try {
        const updates = {
            points: userData.points - item.price,
            [`inventory/${item.id}`]: {
                purchaseDate: new Date().toISOString(),
                active: true
            }
        };

        await update(userRef, updates);
        alert('Aankoop succesvol!');
        loadUserPoints();
    } catch (error) {
        console.error('Aankoop fout:', error);
        alert('Er ging iets mis bij de aankoop');
    }
}

function renderShopItems() {
    const characterContainer = document.getElementById('characterSkins');
    const powerUpsContainer = document.getElementById('powerUps');

    shopItems.characterSkins.forEach(skin => {
        const itemElement = createShopItemElement(skin);
        characterContainer.appendChild(itemElement);
    });

    shopItems.powerUps.forEach(powerUp => {
        const itemElement = createShopItemElement(powerUp);
        powerUpsContainer.appendChild(itemElement);
    });
}

function createShopItemElement(item) {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
        <img src="${item.image || 'images/shop/default.png'}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>${item.description || ''}</p>
        ${item.duration ? `<p>Duur: ${item.duration}</p>` : ''}
        <p class="price"><i class="fas fa-coins"></i> ${item.price}</p>
        <button onclick="buyItem(${JSON.stringify(item)})">Kopen</button>
    `;
    return div;
} 