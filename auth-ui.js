import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { loginUser, registerUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const errorDisplay = document.querySelector('.auth-error');

    // Functie om naar een specifieke tab te switchen
    const switchToTab = (tabName) => {
        const targetBtn = Array.from(tabBtns).find(btn => btn.dataset.tab === tabName);
        if (targetBtn) {
            targetBtn.click();
        }
    };

    // Check URL parameters voor directe tab switch
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'register') {
        switchToTab('register');
    }

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Reset error display
            errorDisplay.style.display = 'none';
            
            // Show/hide forms with animation
            if (tab === 'login') {
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                loginForm.classList.add('animate__animated', 'animate__fadeIn');
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                registerForm.classList.add('animate__animated', 'animate__fadeIn');
            }
        });
    });

    const showError = (message) => {
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
        errorDisplay.classList.add('animate__animated', 'animate__shakeX');
    };

    // Login form handling
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            await loginUser(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            showError('Login mislukt: ' + error.message);
        }
    });

    // Register form handling
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const name = registerForm.name.value;
            
            await registerUser(email, password, name);
            window.location.href = 'dashboard.html';
        } catch (error) {
            showError('Registratie mislukt: ' + error.message);
        }
    });

    // Password reset link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            // TODO: Implementeer wachtwoord reset functionaliteit
            showError('Wachtwoord reset functionaliteit komt binnenkort!');
        });
    }
}); 