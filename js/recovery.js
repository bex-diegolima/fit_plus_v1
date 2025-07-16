document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const recoveryForm = document.getElementById('recoveryForm');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const passwordFields = document.getElementById('passwordFields');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');
    const resetBtn = document.getElementById('resetBtn');
    const validationModal = document.getElementById('validationModal');
    const userEmailSpan = document.getElementById('userEmail');
    const validationCodeInput = document.getElementById('validationCode');
    const validateBtn = document.getElementById('validateBtn');
    const resendBtn = document.getElementById('resendBtn');
    const countdownSpan = document.getElementById('countdown');
    const closeModal = document.querySelector('.close-modal');
    const errorMessages = {
        email: document.getElementById('email-error'),
        password: document.getElementById('password-error'),
        confirmPassword: document.getElementById('confirmPassword-error'),
        code: document.getElementById('code-error')
    };

    // Variáveis de estado
    let currentUserEmail = '';
    let countdownInterval;
    let canResend = false;

    // Toggle para mostrar/esconder senha
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye-slash');
            this.classList.toggle('fa-eye');
        });
    });

    // Validação da força da senha (em tempo real)
    newPasswordInput.addEventListener('input', function() {
        const value = this.value;
        document.getElementById('length').classList.toggle('met', value.length >= 8);
        document.getElementById('uppercase').classList.toggle('met', /[A-Z]/.test(value));
        document.getElementById('number').classList.toggle('met', /[0-9]/.test(value));
        document.getElementById('special').classList.toggle('met', /[^A-Za-z0-9]/.test(value));
    });

    // 1. Enviar código de validação
    sendCodeBtn.addEventListener('click', async function() {
        const email = document.getElementById('recoveryEmail').value.trim();
        errorMessages.email.textContent = '';

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorMessages.email.textContent = 'E-mail inválido';
            return;
        }

        try {
            const response = await fetch('https://fit-plus-backend.onrender.com/api/send-recovery-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (result.success) {
                currentUserEmail = email;
                userEmailSpan.textContent = email;
                validationModal.style.display = 'block';
                startCountdown();
            } else {
                errorMessages.email.textContent = result.message || 'E-mail não encontrado';
            }
        } catch (error) {
            console.error('Erro:', error);
            errorMessages.email.textContent = 'Erro ao enviar código';
        }
    });

    // 2. Validar código recebido
    validateBtn.addEventListener('click', async function() {
        const code = validationCodeInput.value.trim();
        errorMessages.code.textContent = '';

        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            errorMessages.code.textContent = 'Código inválido';
            return;
        }

        try {
            const response = await fetch('https://fit-plus-backend.onrender.com/api/validate-recovery-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUserEmail, code })
            });

            const result = await response.json();

            if (result.success) {
                validationModal.style.display = 'none';
                passwordFields.style.display = 'block';
                newPasswordInput.disabled = false;
                confirmPasswordInput.disabled = false;
                resetBtn.disabled = false;
            } else {
                errorMessages.code.textContent = result.message || 'Código incorreto';
            }
        } catch (error) {
            console.error('Erro:', error);
            errorMessages.code.textContent = 'Erro na validação';
        }
    });

    // 3. Redefinir senha
    recoveryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validações
        if (newPassword !== confirmPassword) {
            errorMessages.confirmPassword.textContent = 'As senhas não coincidem';
            return;
        }

        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
            errorMessages.password.textContent = 'Senha não atende aos requisitos';
            return;
        }

        try {
            const response = await fetch('https://fit-plus-backend.onrender.com/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUserEmail, newPassword })
            });

            const result = await response.json();

            if (result.success) {
                alert('Senha redefinida com sucesso!');
                window.location.href = 'login.html';
            } else {
                errorMessages.password.textContent = result.message || 'Erro ao redefinir senha';
            }
        } catch (error) {
            console.error('Erro:', error);
            errorMessages.password.textContent = 'Erro no servidor';
        }
    });

    // Funções auxiliares (countdown e reenvio)
    function startCountdown() {
        let seconds = 60;
        resendBtn.disabled = true;
        canResend = false;
        
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            seconds--;
            countdownSpan.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                resendBtn.disabled = false;
                canResend = true;
                countdownSpan.textContent = '0';
            }
        }, 1000);
    }

    resendBtn.addEventListener('click', async function() {
        if (!canResend) return;

        try {
            resendBtn.disabled = true;
            const response = await fetch('https://fit-plus-backend.onrender.com/api/resend-recovery-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUserEmail })
            });

            const result = await response.json();

            if (result.success) {
                startCountdown();
                alert('Novo código enviado!');
            } else {
                alert(result.message);
                resendBtn.disabled = false;
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao reenviar código');
            resendBtn.disabled = false;
        }
    });

    closeModal.addEventListener('click', () => {
        validationModal.style.display = 'none';
        clearInterval(countdownInterval);
    });
});