document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('loginPassword');
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    loginForm.appendChild(errorContainer);

    // Toggle para mostrar/esconder senha
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Validação do login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorContainer.textContent = '';
        
        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;

        try {
            const response = await fetch('https://fit-plus-backend.onrender.com/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('userEmail', document.getElementById('username').value.trim());
                window.location.href = 'home.html';
            } else {
                errorContainer.textContent = result.message;
            }
        } catch (error) {
            errorContainer.textContent = 'Erro ao conectar com o servidor';
            console.error('Erro no login:', error);
        }
    });
});