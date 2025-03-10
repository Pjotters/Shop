import { loginUser, registerUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide forms with animation
            if (tab === 'login') {
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                loginForm.classList.add('animate__fadeInRight');
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                registerForm.classList.add('animate__fadeInRight');
            }
        });
    });

    // Login form handling
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = '/dashboard.html';
        } catch (error) {
            showError('Login mislukt: ' + error.message);
        }
    });

    // Register form handling
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.name.value;
        const email = registerForm.email.value;
        const password = registerForm.password.value;
        const confirmPassword = registerForm.confirmPassword.value;

        if (password !== confirmPassword) {
            showError('Wachtwoorden komen niet overeen');
            return;
        }

        try {
            await registerUser(email, password, name);
            window.location.href = '/dashboard.html';
        } catch (error) {
            showError(error.message);
        }
    });
});

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error animate__animated animate__fadeIn';
    errorDiv.textContent = message;
    
    const activeForm = document.querySelector('.auth-form[style*="block"]');
    activeForm.insertBefore(errorDiv, activeForm.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
} 