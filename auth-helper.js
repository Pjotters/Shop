import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

export function requireAuth() {
    return new Promise((resolve, reject) => {
        const auth = getAuth();
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user);
            } else {
                window.location.href = '/login.html';
                reject('Niet ingelogd');
            }
        });
    });
}

export const checkAuthState = () => {
    auth.onAuthStateChanged(user => {
        const protectedPages = [
            '/dashboard.html',
            '/games/flappy.html',
            '/games/snake.html',
            '/games/pacman.html'
        ];
        
        const currentPath = window.location.pathname;
        
        if (protectedPages.includes(currentPath) && !user) {
            window.location.href = '/login.html';
        } else if (currentPath === '/login.html' && user) {
            window.location.href = '/dashboard.html';
        }
    });
}; 