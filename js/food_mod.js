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
        document.querySelectorAll('#foodAddModal select').forEach(select => {
            // Para selects múltiplos
            if (select.multiple) {
                Array.from(select.options).forEach(option => {
                    option.selected = false;
                });
                // Limpa o container de tags
                const container = select.nextElementSibling;
                if (container && container.classList.contains('selected-tags-container')) {
                    container.innerHTML = '';
                }
            } 
            // Para selects normais
            else {
                select.selectedIndex = -1; // Nenhuma opção selecionada
            }
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
    // Elementos do DOM
        const saveBtn = document.getElementById('saveFoodBtn');
        const foodAddModal = document.getElementById('foodAddModal');
        
        // Função para calcular proporção (regra de 3)
        const calculateProportion = (value, basePortion) => {
            return basePortion === 0 ? 0 : (value * 100) / basePortion;
        };

        // Função para salvar alimento
        saveBtn.addEventListener('click', async function() {

            // Coletar dados do formulário
            const formData = {
                // Bloco 1
                item: document.getElementById('foodItemName').value.trim(),
                marca: document.getElementById('foodBrand').value.trim(),
                modo_preparo: document.getElementById('foodPreparation').value,
                grupo_alimentar: document.getElementById('foodGroup').value,
                porcao_base: 100, // Valor fixo conforme regra
                base_portion_original: parseFloat(document.getElementById('foodBasePortion').value) || 0,
                
                // Valores nutricionais (com cálculo proporcional)
                calorias_kcal: calculateProportion(
                    parseFloat(document.getElementById('foodCalories').value) || 0,
                    parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                proteina_gr: calculateProportion(
                    parseFloat(document.getElementById('foodProteins').value) || 0,
                    parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),
                carbo_gr: calculateProportion(
                parseFloat(document.getElementById('foodCarbs').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                gorduras_totais_gr: calculateProportion(
                parseFloat(document.getElementById('foodFats').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                gorduras_boas_gr: calculateProportion(
                parseFloat(document.getElementById('foodGoodFats').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                gorduras_ruins_gr: calculateProportion(
                parseFloat(document.getElementById('foodBadFats').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                omega_tres_mg: calculateProportion(
                parseFloat(document.getElementById('foodOmega3').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                fibras_gr: calculateProportion(
                parseFloat(document.getElementById('foodFiber').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                sodio_mg: calculateProportion(
                parseFloat(document.getElementById('foodSodium').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                colesterol_mg: calculateProportion(
                parseFloat(document.getElementById('foodCholesterol').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                acucares_gr: calculateProportion(
                parseFloat(document.getElementById('foodSugar').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                indice_glicemico: calculateProportion(
                parseFloat(document.getElementById('foodGlycemicIndex').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                carga_glicemica: calculateProportion(
                parseFloat(document.getElementById('foodGlycemicLoad').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                calcio_mg: calculateProportion(
                parseFloat(document.getElementById('foodCalcium').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                ferro_mg: calculateProportion(
                parseFloat(document.getElementById('foodIron').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                potassio_mg: calculateProportion(
                parseFloat(document.getElementById('foodPotassium').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                magnesio_mg: calculateProportion(
                parseFloat(document.getElementById('foodMagnesium').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                zinco_mg: calculateProportion(
                parseFloat(document.getElementById('foodZinc').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                vitamina_c_mg: calculateProportion(
                parseFloat(document.getElementById('foodVitaminC').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                vitamina_a_mcg: calculateProportion(
                parseFloat(document.getElementById('foodVitaminA').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                vitamina_d_mcg: calculateProportion(
                parseFloat(document.getElementById('foodVitaminD').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                vitamina_b12_mcg: calculateProportion(
                parseFloat(document.getElementById('foodVitaminB12').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                acido_folico_mcg: calculateProportion(
                parseFloat(document.getElementById('foodFolicAcid').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                teor_alcoolico: calculateProportion(
                parseFloat(document.getElementById('foodAlcohol').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                acucar_adicionado_gr: calculateProportion(
                parseFloat(document.getElementById('foodSugaradd').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                vitamina_e_mcg: calculateProportion(
                parseFloat(document.getElementById('foodVitaminE').value) || 0,
                parseFloat(document.getElementById('foodBasePortion').value) || 100
                ),

                // ... (repetir para todos os campos nutricionais)
                
                // Bloco 3
                categoria_nutricional: document.getElementById('foodCategory').value,
                origem: document.getElementById('foodOrigin').value,
                nivel_processamento: document.getElementById('foodProcessing').value,
                glutem: document.getElementById('foodGluten').value === 'true',
                carga_antioxidante: document.getElementById('foodAntioxidants').value.trim() || null,
                observacoes: document.getElementById('foodObservations').value.trim(),
                img_registro: await getImageBase64()  // ← Nova função para a imagem
            };

            //Inicio DeepSeek #3
                async function getImageBase64() {
                const file = document.getElementById('foodImage').files[0];
                if (!file) return null;
                
                return new Promise((resolve) => {
                //Inicio DeepSeek #3.1
                if (file.size > 2 * 1024 * 1024) {
                    compressImage(file, 0.5).then(resolve);
                } else {
                //Fim DeepSeek #3.1
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => {
                        // Remove o prefixo "data:image/...;base64,"
                        const base64Data = reader.result.split(',')[1]; 
                        resolve(base64Data);
                    };
                }
                });
            }
            //Fim DeepSeek #3

            //Inicio DeepSeek #3.1
            function compressImage(file, quality) {
            return new Promise((resolve) => {
                const img = new Image();
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
                };
                
                img.src = URL.createObjectURL(file);
            });
        }
            //Fim DeepSeek #3.1

            //Inicio Alterações GPT
                // GARANTIR TOKEN
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Usuário não autenticado. Faça login novamente.');
                    return;  // para não continuar o envio
                }
            //Fim Alterações GPT

            // Validar campos obrigatórios
            if (!formData.item || !formData.marca || !formData.modo_preparo || !formData.grupo_alimentar) {
                alert('Preencha todos os campos obrigatórios!');
                return;
            }

            // Enviar para o servidor

            //Inicio Alterações GPT
            const API_URL = 'https://fit-plus-backend.onrender.com/api/save-food'; // URL completa
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    alert('Alimento salvo com sucesso!');
                    foodAddModal.style.display = 'none';
                    // Limpar formulário ou recarregar dados
                } else {
                    throw new Error(result.message || 'Erro ao salvar');
                }
            } catch (error) {
                // Verificar se response existe para evitar erro
                if (error instanceof TypeError) {
                    // Erro de rede ou CORS provavelmente
                    console.error('Erro de rede ou CORS:', error);
                } else {
                    console.error('Erro inesperado:', error);
                }
                alert('Erro ao conectar com o servidor. Verifique o console (F12)');
            }
            });
            //FIm Alterações GPT

        

        // Carregar opções de selects (tabelas auxiliares)
    async function loadSelectOptions() {
        const selects = {
            'foodPreparation': '/api/get-options?table=tbl_aux_modo_preparo',
            'foodGroup': '/api/get-options?table=tbl_aux_grupo_alimentar',
            'foodCategory': '/api/get-options?table=tbl_aux_categoria_nutri',
            'foodOrigin': '/api/get-options?table=tbl_aux_origem_alimentar',
            'foodProcessing': '/api/get-options?table=tbl_aux_processamento',
            // ... outros selects
        };

        for (const [id, url] of Object.entries(selects)) {
            const response = await fetch(url);
            const options = await response.json();
            const select = document.getElementById(id);

            // Limpa opções existentes
            select.innerHTML = '';
            
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.id;
                option.textContent = opt.nome;
                select.appendChild(option);
            });
                
            }
        }

        loadSelectOptions();
    //FIM ALTERAÇÕES DEEPSEEK

        // ========== INICIALIZAÇÃO ==========
        loadUserData();
        initializeEmptyTable();
        setupCollapsibleBlocks();
        setupPortionUnitToggle();
        setupModalCleanup();
    });