import { auth, db } from '../firebase-config.js';
import { ref, get, set } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

export async function checkTermsAcceptance() {
    const user = auth.currentUser;
    if (!user) return false;

    const userRef = ref(db, `users/${user.uid}/termsAccepted`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
        return true;
    }

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'terms-overlay';
        
        const popup = document.createElement('div');
        popup.className = 'terms-popup';
        popup.innerHTML = `
            <h2>Rewardprogramma Voorwaarden</h2>
            <p>Om deel te nemen aan het Rewardprogramma van Pjotters, moet u akkoord gaan met de volgende voorwaarden:</p>
            <ul>
                <li>Punten worden alleen toegekend bij actief spelen</li>
                <li>Misbruik van het systeem leidt tot uitsluiting</li>
                <li>Punten zijn niet overdraagbaar</li>
                <li>Pjotters behoudt het recht om het programma aan te passen</li>
            </ul>
            <div class="buttons">
                <button id="declineTerms" class="auth-button">Weigeren</button>
                <button id="acceptTerms" class="auth-button">Akkoord</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        document.getElementById('acceptTerms').addEventListener('click', async () => {
            await set(userRef, true);
            overlay.remove();
            popup.remove();
            resolve(true);
        });

        document.getElementById('declineTerms').addEventListener('click', () => {
            overlay.remove();
            popup.remove();
            window.location.href = '../dashboard.html';
            resolve(false);
        });
    });
} 