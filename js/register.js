document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário principal
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const passwordRequirements = {
        length: document.getElementById('length'),
        uppercase: document.getElementById('uppercase'),
        number: document.getElementById('number'),
        special: document.getElementById('special')
    };

    // Limpeza segura do formulário
    document.getElementById('backToLogin').addEventListener('click', (e) => {
        if (registerForm.elements.length > 0 && Array.from(registerForm.elements).some(el => el.value)) {
            if (!confirm('Deseja descartar todos os dados inseridos?')) {
                e.preventDefault();
            }
        }
        // O redirecionamento será feito naturalmente pelo href do link
    });

    // Elementos do modal de validação
    const validationModal = document.getElementById('validationModal');
    const userEmailSpan = document.getElementById('userEmail');
    const validationCodeInput = document.getElementById('validationCode');
    const validateBtn = document.getElementById('validateBtn');
    const resendBtn = document.getElementById('resendBtn');
    const countdownSpan = document.getElementById('countdown');
    const closeModal = document.querySelector('.close-modal');

    // Variáveis de estado
    let currentUserEmail = '';
    let countdownInterval;
    let canResend = false;

    // Máscara para telefone
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', formatPhone);

    // Toggle para mostrar/esconder senha
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', togglePasswordVisibility);
    });

    // Validação em tempo real da senha
    passwordInput.addEventListener('input', validatePasswordStrength);

    // Fechar modal
    closeModal.addEventListener('click', () => {
        validationModal.style.display = 'none';
        clearInterval(countdownInterval);
    });

    // Validação do formulário principal
    registerForm.addEventListener('submit', handleRegisterSubmit);

    // Validação do código
    validateBtn.addEventListener('click', handleValidation);

    // Reenviar código
    resendBtn.addEventListener('click', handleResendCode);

    // Funções auxiliares
    function formatPhone(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = value;
    }

    function togglePasswordVisibility() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    }

    function validatePasswordStrength() {
        const value = this.value;
        passwordRequirements.length.classList.toggle('met', value.length >= 8);
        passwordRequirements.uppercase.classList.toggle('met', /[A-Z]/.test(value));
        passwordRequirements.number.classList.toggle('met', /[0-9]/.test(value));
        passwordRequirements.special.classList.toggle('met', /[^A-Za-z0-9]/.test(value));
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }

    function validateForm() {
        let isValid = true;
        clearErrors();

        // Validação do e-mail
        const email = document.getElementById('email').value;
        if (!email) {
            document.getElementById('email-error').textContent = 'E-mail é obrigatório';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('email-error').textContent = 'E-mail inválido';
            isValid = false;
        }

        // Validação do nome
        const firstName = document.getElementById('firstName').value;
        if (!firstName) {
            document.getElementById('firstName-error').textContent = 'Nome é obrigatório';
            isValid = false;
        }

        // Validação do sobrenome
        const lastName = document.getElementById('lastName').value;
        if (!lastName) {
            document.getElementById('lastName-error').textContent = 'Sobrenome é obrigatório';
            isValid = false;
        }

        // Validação da data de nascimento
        const birthDate = document.getElementById('birthDate').value;
        if (!birthDate) {
            document.getElementById('birthDate-error').textContent = 'Data de nascimento é obrigatória';
            isValid = false;
        } else {
            const birthDateObj = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }
            
            if (age < 18) {
                document.getElementById('birthDate-error').textContent = 'Você deve ter pelo menos 18 anos';
                isValid = false;
            }
        }

        // Validação do sexo
        const gender = document.getElementById('gender').value;
        if (!gender) {
            document.getElementById('gender-error').textContent = 'Sexo é obrigatório';
            isValid = false;
        }

        // Validação do telefone
        const phone = document.getElementById('phone').value;
        if (!phone) {
            document.getElementById('phone-error').textContent = 'Telefone é obrigatório';
            isValid = false;
        } else if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(phone)) {
            document.getElementById('phone-error').textContent = 'Telefone inválido';
            isValid = false;
        }

        // Validação da senha
        const password = passwordInput.value;
        if (!password) {
            document.getElementById('password-error').textContent = 'Senha é obrigatória';
            isValid = false;
        } else if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
            document.getElementById('password-error').textContent = 'Senha não atende aos requisitos';
            isValid = false;
        }

        // Validação da confirmação de senha
        const confirmPassword = confirmPasswordInput.value;
        if (!confirmPassword) {
            document.getElementById('confirmPassword-error').textContent = 'Confirmação de senha é obrigatória';
            isValid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('confirmPassword-error').textContent = 'Senhas não coincidem';
            isValid = false;
        }

        return isValid;
    }

    async function handleRegisterSubmit(e) {
        e.preventDefault();
        
        if (!validateForm()) return;

        const formData = {
            email: document.getElementById('email').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            birthDate: document.getElementById('birthDate').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            password: passwordInput.value
        };

        try {
            const response = await fetch('http://localhost:3002/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                currentUserEmail = formData.email;
                userEmailSpan.textContent = currentUserEmail;
                validationModal.style.display = 'block';
                startCountdown();
            } else {
                const errorField = result.message.includes('e-mail') ? 'email-error' : 'password-error';
                document.getElementById(errorField).textContent = result.message;
            }
        } catch (error) {
            console.error('Erro ao registrar:', error);
            alert('Erro ao conectar com o servidor. Tente novamente.');
        }
    }

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

    async function handleValidation() {
    const code = validationCodeInput.value.trim();
    const codeErrorElement = document.getElementById('code-error');
    
    // Limpa erros anteriores
    codeErrorElement.textContent = '';
    
    // Validação básica do formato
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
        codeErrorElement.textContent = 'Digite um código válido de 6 dígitos';
        return;
    }

    try {
        console.log('Validando código...');
        const response = await fetch('http://localhost:3002/api/validate', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                email: currentUserEmail, 
                code 
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Erro na validação');
        }

        if (result.success) {
            alert('✅ Cadastro confirmado com sucesso!');
            validationModal.style.display = 'none';
            registerForm.reset();
            clearInterval(countdownInterval);

            // Redireciona para a página de login após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            codeErrorElement.textContent = result.message;
        }
    } catch (error) {
        console.error('Erro na validação:', error);
        codeErrorElement.textContent = typeof error === 'string' ? error : 'Erro ao validar código';
    }
}

    async function handleResendCode() {
        if (!canResend) return;

        try {
            resendBtn.disabled = true;
            const response = await fetch('http://localhost:3002/api/resend-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUserEmail })
            });

            const result = await response.json();

            if (result.success) {
                startCountdown();
                alert('Novo código enviado para seu e-mail!');
            } else {
                alert(result.message);
                resendBtn.disabled = false;
            }
        } catch (error) {
            console.error('Erro ao reenviar código:', error);
            alert('Erro ao reenviar código');
            resendBtn.disabled = false;
        }
    }
});