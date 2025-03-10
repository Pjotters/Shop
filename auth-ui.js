import { loginUser, registerUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetForm = btn.dataset.tab === 'login' ? loginForm : registerForm;
            const otherForm = btn.dataset.tab === 'login' ? registerForm : loginForm;
            
            btn.classList.add('active');
            targetForm.style.display = 'flex';
            otherForm.style.display = 'none';
            
            tabBtns.forEach(otherBtn => {
                if (otherBtn !== btn) otherBtn.classList.remove('active');
            });
        });
    });

    // Login form handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        try {
            const user = await loginUser(email, password);
            window.location.href = '/dashboard.html';
        } catch (error) {
            showError(error.message);
        }
    });

    // Register form handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm.querySelector('input[type="text"]').value;
        const email = registerForm.querySelector('input[type="email"]').value;
        const password = registerForm.querySelector('input[type="password"]').value;
        const confirmPassword = registerForm.querySelectorAll('input[type="password"]')[1].value;

        if (password !== confirmPassword) {
            showError('Wachtwoorden komen niet overeen');
            return;
        }

        try {
            const user = await registerUser(email, password);
            window.location.href = '/dashboard.html';
        } catch (error) {
            showError(error.message);
        }
    });
});

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.auth-box');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
} 