document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('menuButton');
    const menuPanel = document.getElementById('menuPanel');
    const logoutBtn = document.getElementById('logoutBtn');

    // 1. Alternar visibilidade do menu
    menuButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Evita fechar ao clicar no botão
        menuPanel.classList.toggle('active');
    });

    // 2. Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        if (menuPanel.classList.contains('active') && !menuPanel.contains(e.target)) {
            menuPanel.classList.remove('active');
        }
    });

    // 3. Botão Sair
    logoutBtn.addEventListener('click', function() {
        const confirmLogout = confirm('Tem certeza que deseja sair?');
        if (confirmLogout) {
            localStorage.removeItem('userEmail'); // Limpa o e-mail salvo
            window.location.href = 'login.html';
        }
        // Se cancelar, não faz nada e o usuário permanece logado
    });
    // 4. Carregar nome do usuário (simulação - substituir por chamada real na próxima etapa)
    fetchUserData();

    // Função para carregar a foto de perfil
    async function loadProfilePic() {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) return;

        try {
            const response = await fetch(`https://fit-plus-backend.onrender.com/api/profile-pic?email=${encodeURIComponent(userEmail)}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                document.getElementById('profilePic').src = url;
            } else {
                // Mantém imagem padrão caso não tenha foto
                console.log('Foto de perfil não encontrada, usando padrão');
            }
        } catch (error) {
            console.error('Erro ao carregar foto de perfil:', error);
        }
    }

    loadProfilePic();

    // Abrir seletor de arquivo ao clicar no botão
    const changePicBtn = document.getElementById('changePicBtn');
    const profilePicInput = document.getElementById('profilePicInput');

    changePicBtn.addEventListener('click', () => {
        profilePicInput.click();
    });

    // Ao selecionar arquivo, enviar para o servidor
    profilePicInput.addEventListener('change', async () => {
        const file = profilePicInput.files[0];
        if (!file) return;

        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            alert('Usuário não logado');
            return;
        }

        const formData = new FormData();
        formData.append('profilePic', file);
        formData.append('email', userEmail);

        try {
            const response = await fetch('https://fit-plus-backend.onrender.com/api/upload-profile-pic', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                alert('Foto de perfil atualizada!');
                loadProfilePic(); // Recarrega a foto no painel
            } else {
                alert('Erro: ' + (result.message || 'Não foi possível atualizar a foto'));
            }
        } catch (error) {
            console.error('Erro ao enviar foto:', error);
            alert('Erro ao enviar foto');
        }
    });
});

// Função simulada (será substituída por chamada real ao backend)
async function fetchUserData() {
    try {
        const userEmail = localStorage.getItem('userEmail'); // Obtém o e-mail salvo no login

        if (!userEmail) {
            throw new Error('E-mail do usuário não encontrado');
        }

        const response = await fetch(`https://fit-plus-backend.onrender.com/api/get-user-data?email=${encodeURIComponent(userEmail)}`);
        const result = await response.json();

        if (result.success) {
            document.getElementById('userName').textContent = result.userName;
        } else {
            console.error('Erro ao carregar nome:', result.message);
            document.getElementById('userName').textContent = 'Usuário';
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        document.getElementById('userName').textContent = 'Usuário';
    }
}

