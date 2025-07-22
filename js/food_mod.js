// food_mod.js
document.addEventListener('DOMContentLoaded', function() {
    // ========== ELEMENTOS DO MENU (IGUAL AO HOME.JS) ==========
    const menuButton = document.getElementById('menuButton');
    const menuPanel = document.getElementById('menuPanel');
    const logoutBtn = document.getElementById('logoutBtn');
    const changePicBtn = document.getElementById('changePicBtn');
    const profilePicInput = document.getElementById('profilePicInput');

    // ========== ELEMENTOS DO MÓDULO DE ALIMENTOS ==========
    const addBtn = document.querySelector('.food-add-btn');
    const detailModal = document.getElementById('foodDetailModal');
    const addModal = document.getElementById('foodAddModal');
    const closeButtons = document.querySelectorAll('.food-modal-close');
    const foodTableBody = document.querySelector('.food-table tbody');
    const profilePic = document.getElementById('profilePic');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userNameSpan = document.getElementById('userName');

    // ========== FUNÇÕES DO MENU ==========
    // Alternar visibilidade do menu
    menuButton.addEventListener('click', function(e) {
        e.stopPropagation();
        menuPanel.classList.toggle('active');
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        if (menuPanel.classList.contains('active') && !menuPanel.contains(e.target)) {
            menuPanel.classList.remove('active');
        }
    });

    // Botão Sair
    logoutBtn.addEventListener('click', function() {
        const confirmLogout = confirm('Tem certeza que deseja sair?');
        if (confirmLogout) {
            localStorage.removeItem('userEmail');
            window.location.href = 'login.html';
        }
    });

    // Botão Alterar Foto
    changePicBtn.addEventListener('click', () => profilePicInput.click());
    
    profilePicInput.addEventListener('change', async function() {
        const file = this.files[0];
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
                await loadUserData(); // Recarrega a foto
            } else {
                alert('Erro: ' + (result.message || 'Falha ao atualizar foto'));
            }
        } catch (error) {
            console.error('Erro ao enviar foto:', error);
            alert('Erro ao enviar foto');
        }
    });

    // ========== FUNÇÕES DO MODAL DE CADASTRO (FASE 1 - BLOCO 1) ==========
    // Alternar blocos recolhíveis
    function setupCollapsibleBlocks() {
        document.querySelectorAll('.food-block-header').forEach(header => {
            header.addEventListener('click', () => {
                const block = header.parentElement;
                const content = block.querySelector('.food-block-content');
                const toggleIcon = block.querySelector('.food-block-toggle');
                
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
                toggleIcon.textContent = content.style.display === 'none' ? '►' : '▼';
            });
        });
    }

    // Altera unidade da porção base conforme grupo alimentar
    function setupPortionUnitToggle() {
        const foodGroupSelect = document.getElementById('foodGroup');
        if (foodGroupSelect) {
            foodGroupSelect.addEventListener('change', function() {
                const unitSpan = document.getElementById('foodPortionUnit');
                if (this.value === 'bebida' || this.value === 'bebida-alcoolica') {
                    unitSpan.textContent = 'ml';
                } else {
                    unitSpan.textContent = 'g';
                }
            });
        }
    }

    // Limpa campos ao fechar o modal
    function setupModalCleanup() {
        document.querySelector('.food-modal-close').addEventListener('click', () => {
            document.querySelectorAll('.food-input, .food-select').forEach(field => {
                field.value = '';
            });
            document.getElementById('foodBasePortion').value = '100.00';
        });
    }

    // ========== FUNÇÕES DO MÓDULO DE ALIMENTOS ==========
    // Carrega os dados do usuário logado
    async function loadUserData() {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // Carrega nome do usuário
            const response = await fetch(`https://fit-plus-backend.onrender.com/api/get-user-data?email=${encodeURIComponent(userEmail)}`);
            const result = await response.json();

            if (result.success) {
                userNameSpan.textContent = result.userName;
                if (welcomeMessage) {
                    welcomeMessage.textContent = `Bem-vindo, ${result.userName}`;
                }
            }

            // Carrega foto de perfil
            const picResponse = await fetch(`https://fit-plus-backend.onrender.com/api/profile-pic?email=${encodeURIComponent(userEmail)}`);
            if (picResponse.ok) {
                const blob = await picResponse.blob();
                profilePic.src = URL.createObjectURL(blob);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    // Inicialização da tabela vazia
    function initializeEmptyTable() {
        if (foodTableBody) {
            foodTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhum alimento cadastrado</td></tr>';
        }
    }

    // Abrir modal de cadastro
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addModal.style.display = 'block';
            // Garante que todos os blocos estão visíveis ao abrir
            document.querySelectorAll('.food-block-content').forEach(content => {
                content.style.display = 'block';
            });
        });
    }

    // Fechar modais
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.food-modal').style.display = 'none';
        });
    });

    // Fechar ao clicar fora do modal
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('food-modal')) {
            event.target.style.display = 'none';
        }
    });

    // Adicione esta função no seu arquivo:
    function clearModalFields() {
        // Limpa todos os inputs
        document.querySelectorAll('#foodAddModal .food-input').forEach(input => {
            if (input.type !== 'file') { // Mantém o file input diferente
                input.value = '';
            }
        });
        
        // Reseta os selects
        document.querySelectorAll('#foodAddModal .food-select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        // Reseta o valor padrão da porção
        const portionInput = document.getElementById('foodBasePortion');
        if (portionInput) {
            portionInput.value = '100.00';
            document.getElementById('foodPortionUnit').textContent = 'g';
        }
        
        // Limpa o input de arquivo (imagem)
        const fileInput = document.getElementById('foodImage');
        if (fileInput) {
            fileInput.value = '';
        }

        // Limpa os campos do Bloco 2
    const block2Inputs = [
        'foodGoodFats', 'foodBadFats', 'foodFiber', 'foodSodium',
        'foodCholesterol', 'foodSugar', 'foodGlycemicIndex', 'foodGlycemicLoad',
        'foodCalcium', 'foodIron', 'foodPotassium', 'foodMagnesium',
        'foodZinc', 'foodVitaminC', 'foodVitaminA', 'foodVitaminD',
        'foodVitaminB12', 'foodOmega3', 'foodFolicAcid', 'foodAlcohol'
    ];

    block2Inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });

    // Limpa os campos do Bloco 3
    const block3Inputs = [
        'foodCategory', 'foodOrigin', 'foodProcessing', 'foodGluten',
        'foodAntioxidants', 'foodObservations'
    ];

    block3Inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });

    // Limpa select múltiplo
    const allergensSelect = document.getElementById('foodAllergens');
    if (allergensSelect) {
        Array.from(allergensSelect.options).forEach(option => {
        option.selected = false;
        });
    }
    }

    // Atualize o evento de fechar o modal (substitua o existente):
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.food-modal').style.display = 'none';
            clearModalFields(); // Limpa os campos ao fechar
        });
    });

    // Atualize também o clique fora do modal:
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('food-modal')) {
            event.target.style.display = 'none';
            clearModalFields(); // Limpa os campos ao fechar
        }
    });

    //ALTERAÇÕES DEEPSEEK

        // Função para salvar alimento
        document.getElementById('saveFoodBtn').addEventListener('click', async function() {
            const foodName = document.getElementById('foodItemName').value;
            
            if (!foodName) {
                alert('Por favor, preencha o nome do item');
                return;
            }

            try {
                const response = await fetch('/api/save-food', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        item: foodName
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Alimento salvo com sucesso!');
                    // Fecha o modal após salvar
                    document.getElementById('foodAddModal').style.display = 'none';
                } else {
                    alert('Erro ao salvar: ' + (result.message || 'Erro desconhecido'));
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao conectar com o servidor');
            }
        });

    //FIM ALTERAÇÕES DEEPSEEK

        // ========== INICIALIZAÇÃO ==========
        loadUserData();
        initializeEmptyTable();
        setupCollapsibleBlocks();
        setupPortionUnitToggle();
        setupModalCleanup();
    });