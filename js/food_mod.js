// INICIO DO ARQUIVO: food_mod.js
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
    const closeButtons = document.querySelectorAll('.food-modal-close, #close-bt');
    const foodTableBody = document.querySelector('.food-table tbody');
    const profilePic = document.getElementById('profilePic');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userNameSpan = document.getElementById('userName');

    //Inicio A#1
    // ========== ELEMENTOS DO MODAL DE REPORTE ==========
    const reportModal = document.getElementById('foodReportModal');
    const submitReportBtn = document.getElementById('submitReportBtn');
    const closeReportBtn = document.getElementById('closeReportBtn');
    //Fim A#1

    // ========== ELEMENTOS DE PESQUISA ==========
    const foodSearchInput = document.querySelector('.food-search-input');
    const paginationInfo = document.querySelector('.pagination-info');
    const prevPageBtn = document.querySelector('.pagination-btn:first-child');
    const nextPageBtn = document.querySelector('.pagination-btn:last-child');

    // Variáveis de estado
    let currentPage = 1;
    const itemsPerPage = 10;
    let searchResults = [];

    // Função para processar pesquisa
    async function searchFoods(searchTerm) {

        // Mostrar loader
        const loaderRow = document.createElement('tr');
        loaderRow.className = 'loader-row';
        loaderRow.innerHTML = `<td colspan="7" class="search-loader">Buscando...</td>`;
        foodTableBody.innerHTML = '';
        foodTableBody.appendChild(loaderRow);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://fit-plus-backend.onrender.com/api/search-foods?term=${encodeURIComponent(searchTerm)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Erro na pesquisa');
            
            const data = await response.json();
            searchResults = data;
            currentPage = 1;
            renderTable();
        } catch (error) {
            console.error('Erro na pesquisa:', error);
            foodTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Erro ao carregar resultados</td></tr>';
        }
    }

    function renderTable() {
        if (searchResults.length === 0) {
            foodTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Nenhum resultado encontrado</td></tr>';
            paginationInfo.textContent = 'Página 0 de 0';
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            return;
        }

        const startIdx = (currentPage - 1) * itemsPerPage;
        const paginatedItems = searchResults.slice(startIdx, startIdx + itemsPerPage);
        const totalPages = Math.ceil(searchResults.length / itemsPerPage);

        foodTableBody.innerHTML = paginatedItems.map(item => `
            <tr data-id="${item.id}">
                <td class="text-left">${item.item}</td>
                <td class="text-left">${item.marca || '-'}</td>
                <td class="text-left">${item.modo_preparo_nome}</td>
                <td class="text-left">${item.grupo_alimentar_nome}</td>
                <td class="text-center">${item.porcao_base}(${item.tipo_medida_nome})</td>
                <td class="text-center">${item.calorias_kcal}</td>
                <td class="food-status-icon">
                    <img src="images/icn_${item.tipo_registro_alimento === 1 ? 'verificado' : 'alerta'}.png" 
                        alt="${item.tipo_registro_alimento === 1 ? 'Verificado' : 'Alerta'}"
                        title="${item.tipo_registro_alimento === 1 ? 
                            'Informações nutricionais validadas por especialistas' : 
                            'Informações nutricionais não verificadas por especialistas'}">
                </td>
            </tr>
        `).join('');

        paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

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
            requestAnimationFrame(() => {
                clearModalFields();
                addModal.scrollTop = 0;
                const modalContent = addModal.querySelector('.food-modal-content');
                if (modalContent) {
                    modalContent.scrollTop = 0;
                    modalContent.style.overflowY = 'hidden';
                    setTimeout(() => { modalContent.style.overflowY = 'auto'; }, 10);
                }
            });
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

    // Atualizar tags de alergênicos selecionados
    function updateSelectedAllergens() {
        const select = document.getElementById('foodAllergs3');
        const tagsContainer = document.getElementById('selectedAllergensTags');
        tagsContainer.innerHTML = '';
        
        Array.from(select.selectedOptions).forEach(option => {
            const tag = document.createElement('div');
            tag.className = 'allergen-tag';
            tag.innerHTML = `
                ${option.textContent}
                <button type="button" data-value="${option.value}">×</button>
            `;
            tagsContainer.appendChild(tag);
        });

        // Evento para remover tags
        document.querySelectorAll('.allergen-tag button').forEach(btn => {
            btn.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const option = select.querySelector(`option[value="${value}"]`);
                option.selected = false;
                updateSelectedAllergens();
            });
        });
    }

    // Adicione esta função no seu arquivo:
    function clearModalFields() {
        // Limpa inputs básicos
        document.querySelectorAll('#foodAddModal input[type="text"], #foodAddModal input[type="number"]').forEach(input => {
        input.value = '';
        });

        // Reseta selects (incluindo o de glúten)
        document.querySelectorAll('#foodAddModal select').forEach(select => {
            select.selectedIndex = 0; // Volta para a primeira opção (placeholder)
        });
        document.querySelectorAll('#foodAddModal .food-block-content').forEach(content => {
            content.style.display = 'block';
        });
        document.querySelectorAll('#foodAddModal .food-block-toggle').forEach(toggle => {
            toggle.textContent = '▼';
        });
        // Reseta o valor padrão da porção
        const portionInput = document.getElementById('foodBasePortion');
        if (portionInput) {
            portionInput.value = '100.00';
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

        document.querySelectorAll('#foodAddModal select').forEach(select => {
            select.selectedIndex = 0; // Reseta para a primeira opção (placeholder)
        });

        const allergSelect = document.getElementById('foodAllergs3');
        if (allergSelect) {
            allergSelect.selectedIndex = -1;
            document.getElementById('selectedAllergensTags').innerHTML = '';
        }

    }

    //FUNÇÕES DETALHES
    async function loadFoodDetails(foodId) {
        const modal = document.getElementById('foodDetailModal');
        //Inicio A#2
        // Adicionar esta linha após abrir o modal:
        modal.setAttribute('data-food-id', foodId);
        //Fim A#2
        const loader = document.getElementById('foodDetailLoader');
        
        // Garantir que o modal está visível antes de manipular o scroll
        await new Promise(resolve => setTimeout(resolve, 50));

        // Resetar estado antes de carregar - usar a variável 'modal' que acabamos de declarar
        modal.scrollTop = 0;
        const modalContent = modal.querySelector('.food-modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
        
        // Garantir que todos os blocos estarão abertos
        document.querySelectorAll('#foodDetailModal .food-block-content').forEach(content => {
            content.style.display = 'block';
        });
        document.querySelectorAll('#foodDetailModal .food-block-toggle').forEach(toggle => {
            toggle.textContent = '▼';
        });

        try {
            // Mostrar loader e esconder conteúdo
            modal.style.display = 'block';
            loader.style.display = 'flex';
            document.querySelector('.food-modal-content > .food-block').style.display = 'none';
            
            const token = localStorage.getItem('token');
            const response = await fetch(`https://fit-plus-backend.onrender.com/api/food-details?id=${foodId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Erro ao carregar detalhes');
            
            const foodData = await response.json();
            
            // Esconder loader e mostrar conteúdo
            loader.style.display = 'none';
            document.querySelector('.food-modal-content > .food-block').style.display = 'block';
            populateFoodDetails(foodData);

            //Inicio A#11
            const permission = await checkDeletePermission(foodId);
            deleteBtn.disabled = !permission.canDelete;
            if (permission.canDelete) {
                deleteBtn.classList.add('enabled');
            } else {
                deleteBtn.classList.remove('enabled');
            }

            // Event listeners para os novos elementos
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    deleteConfirmModal.style.display = 'flex';
                });
            }

            if (cancelDeleteBtn) {
                cancelDeleteBtn.addEventListener('click', () => {
                    deleteConfirmModal.style.display = 'none';
                });
            }

            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', async () => {
                    const foodId = document.querySelector('#foodDetailModal').getAttribute('data-food-id');
                    const loader = document.createElement('div');
                    loader.className = 'delete-loader';
                    loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo Registro...';
                    deleteConfirmModal.appendChild(loader);
                    
                    try {
                        await inactivateFood(foodId);
                        deleteConfirmModal.style.display = 'none';
                        document.getElementById('close-btD').click(); // Fecha o modal de detalhes
                        deleteSuccessModal.style.display = 'flex';
                    } catch (error) {
                        console.error('Erro:', error);
                        deleteConfirmModal.removeChild(loader);
                        alert('Erro ao excluir o alimento');
                    }
                });
            }

            if (okDeleteBtn) {
                okDeleteBtn.addEventListener('click', () => {
                    deleteSuccessModal.style.display = 'none';
                    window.location.reload(); // Recarrega a página
                });
            }

            //Fim A#11
            
        } catch (error) {
            console.error('Erro:', error);
            loader.style.display = 'none';
            modal.style.display = 'none';
            alert('Erro ao carregar detalhes do alimento: ' + error.message);
            return;
        }
    }

    function populateFoodDetails(data) {
        // Alerta de verificação

        if (!data || typeof data !== 'object') {
            console.error('Dados inválidos recebidos:', data);
            alert('Os dados do alimento estão incompletos');
            return;
        }

        const verificationAlert = document.getElementById('alertVerification');
        if (data.tipo_registro_alimento === 1) {
            verificationAlert.innerHTML = `
                <img src="images/icn_verificado.png" alt="Verificado">
                <span>Informações Nutricionais Validadas por Especialistas.</span>
            `;
            verificationAlert.className = 'alert-box verified';
        } else {
            verificationAlert.innerHTML = `
                <img src="images/icn_alerta.png" alt="Alerta">
                <span>Informações Nutricionais Não Verificadas por Especialistas.</span>
            `;
            verificationAlert.className = 'alert-box warning';
        }
        
        // Alerta de glúten
        const glutenAlert = document.getElementById('alertGluten');
        if (data.glutem) {
            glutenAlert.innerHTML = `
                <img src="images/icn_alerta.png" alt="Alerta">
                <span>Este alimento contém glúten!</span>
            `;
            glutenAlert.className = 'alert-box warning';
            glutenAlert.style.display = 'flex';
        } else {
            glutenAlert.style.display = 'none';
        }
        
        // Alerta de alérgenos
        const allergensAlert = document.getElementById('alertAllergens');
        if (data.alergicos_comuns && data.alergicos_comuns.length > 0) {
            allergensAlert.innerHTML = `
                <img src="images/icn_alerta.png" alt="Alerta">
                <span>Este alimento possui alérgenos ou intolerâncias comuns!</span>
            `;
            allergensAlert.className = 'alert-box warning';
            allergensAlert.style.display = 'flex';
        } else {
            allergensAlert.style.display = 'none';
        }
        
        // Imagem do alimento
        // Substituir a parte de carregamento da imagem por:

        // Imagem do alimento
        const foodImage = document.getElementById('foodDetailImage');
        if (data.img_registro) {
            // Se já estiver em formato base64
            if (typeof data.img_registro === 'string' && data.img_registro.startsWith('data:')) {
                foodImage.src = data.img_registro;
            } 
            // Se for um buffer (vindo do banco)
            else {
                foodImage.src = `data:image/jpeg;base64,${data.img_registro}`;
            }
            foodImage.alt = data.item || 'Imagem do alimento';
        } else {
            foodImage.src = 'images/default-food.png';
            foodImage.onerror = null; // Remove handler para evitar loop
        }

        if (foodImage.src.includes('default-food.png')) {
            foodImage.onerror = null; // Não tentar recarregar a padrão
        } else {
            foodImage.onerror = function() {
                this.onerror = null; // Remove handler após primeiro erro
                this.src = 'images/default-food.png';
            };
        }
        
        // Nome do alimento
        document.getElementById('foodDetailName').textContent = data.item;
        
        // Configurar unidade de medida
        const unitSpan = document.getElementById('foodDetailPortionUnit');
        if ([10, 11].includes(parseInt(data.grupo_alimentar))) {
            unitSpan.textContent = 'ml';
        } else {
            unitSpan.textContent = 'g';
        }
        
        // Porção base
        const portionInput = document.getElementById('foodDetailBasePortion');
        portionInput.value = data.porcao_base || 100;
        
        // Configurar evento para recalcular valores quando a porção mudar
        portionInput.addEventListener('input', () => {
            updateNutritionValues(data, parseFloat(portionInput.value));
        });
        
        // Preencher todos os campos
        updateNutritionValues(data, data.porcao_base || 100);
        
        // Preencher outras informações
        document.getElementById('foodDetailGroup').textContent = data.grupo_alimentar_nome || '-';
        document.getElementById('foodDetailCategory').textContent = data.categoria_nutricional_nome || '-';
        document.getElementById('foodDetailOrigin').textContent = data.origem_alimentar_nome || '-';
        document.getElementById('foodDetailProcessing').textContent = data.processamento_nome || '-';
        document.getElementById('foodDetailGluten').textContent = data.glutem ? 'Sim' : 'Não';
        document.getElementById('foodDetailAllergens').textContent = data.alergicos_comuns_nomes || 'Nenhum registrado';
        document.getElementById('foodDetailObservations').textContent = data.observacoes || 'Nenhuma observação registrada';
        
        // Garantir scroll no topo após popular os dados
        const modal = document.getElementById('foodDetailModal');
        modal.scrollTop = 0;
        const modalContent = modal.querySelector('.food-modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
        
        // Abrir o modal
        document.getElementById('foodDetailModal').style.display = 'block';
    }

    function updateNutritionValues(data, portion) {
        const calculateValue = (value) => {
            if (!value) return '-';
            return ((value * portion) / 100).toFixed(2);
        };
        
        const formatUnit = (value, unit) => {
            if (value === '-') return '-';
            return `${value} ${unit}`;
        };
        
        // Bloco 1
        document.getElementById('foodDetailBrand').textContent = data.marca || '-';
        document.getElementById('foodDetailPreparation').textContent = data.modo_preparo_nome || '-';
        document.getElementById('foodDetailCalories').textContent = formatUnit(calculateValue(data.calorias_kcal), 'kcal');
        document.getElementById('foodDetailProteins').textContent = formatUnit(calculateValue(data.proteina_gr), 'g');
        document.getElementById('foodDetailCarbs').textContent = formatUnit(calculateValue(data.carbo_gr), 'g');
        document.getElementById('foodDetailFats').textContent = formatUnit(calculateValue(data.gorduras_totais_gr), 'g');
        
        // Bloco 2
        document.getElementById('foodDetailGoodFats').textContent = formatUnit(calculateValue(data.gorduras_boas_gr), 'g');
        document.getElementById('foodDetailBadFats').textContent = formatUnit(calculateValue(data.gorduras_ruins_gr), 'g');
        document.getElementById('foodDetailFiber').textContent = formatUnit(calculateValue(data.fibras_gr), 'g');
        document.getElementById('foodDetailSodium').textContent = formatUnit(calculateValue(data.sodio_mg), 'mg');
        document.getElementById('foodDetailSugar').textContent = formatUnit(calculateValue(data.acucares_gr), 'g');
        document.getElementById('foodDetailSugarAdd').textContent = formatUnit(calculateValue(data.acucar_adicionado_gr), 'g');
        document.getElementById('foodDetailGlycemicIndex').textContent = calculateValue(data.indice_glicemico);
        document.getElementById('foodDetailGlycemicLoad').textContent = calculateValue(data.carga_glicemica);
        document.getElementById('foodDetailCholesterol').textContent = formatUnit(calculateValue(data.colesterol_mg), 'mg');
        document.getElementById('foodDetailCalcium').textContent = formatUnit(calculateValue(data.calcio_mg), 'mg');
        document.getElementById('foodDetailIron').textContent = formatUnit(calculateValue(data.ferro_mg), 'mg');
        document.getElementById('foodDetailPotassium').textContent = formatUnit(calculateValue(data.potassio_mg), 'mg');
        document.getElementById('foodDetailMagnesium').textContent = formatUnit(calculateValue(data.magnesio_mg), 'mg');
        document.getElementById('foodDetailZinc').textContent = formatUnit(calculateValue(data.zinco_mg), 'mg');
        document.getElementById('foodDetailVitaminA').textContent = formatUnit(calculateValue(data.vitamina_a_mcg), 'mcg');
        document.getElementById('foodDetailVitaminD').textContent = formatUnit(calculateValue(data.vitamina_d_mcg), 'mcg');
        document.getElementById('foodDetailVitaminC').textContent = formatUnit(calculateValue(data.vitamina_c_mg), 'mg');
        document.getElementById('foodDetailVitaminB12').textContent = formatUnit(calculateValue(data.vitamina_b12_mcg), 'mcg');
        document.getElementById('foodDetailVitaminE').textContent = formatUnit(calculateValue(data.vitamina_e_mcg), 'mcg');
        document.getElementById('foodDetailOmega3').textContent = formatUnit(calculateValue(data.omega_tres_mg), 'mg');
        document.getElementById('foodDetailFolicAcid').textContent = formatUnit(calculateValue(data.acido_folico_mcg), 'mcg');
        document.getElementById('foodDetailAlcohol').textContent = formatUnit(calculateValue(data.teor_alcoolico), '%');
        document.getElementById('foodDetailAntioxidants').textContent = calculateValue(data.carga_antioxidante);
        
        // Calcular densidade calórica (kcal/g)
        const caloricDensity = data.calorias_kcal ? (data.calorias_kcal / 100).toFixed(2) : '-';
        document.getElementById('foodDetailCaloricDensity').textContent = 
            caloricDensity === '-' ? '-' : `${caloricDensity} kcal/g`;
    }

    function setupDetailCollapsibles() {
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

    // Configurar evento de clique na tabela
    foodTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.id) {
            loadFoodDetails(row.dataset.id);
        }
    });

    // Configurar botão fechar
    document.getElementById('close-btD').addEventListener('click', function() {
        const detailModal = document.getElementById('foodDetailModal');
        
        // Resetar valores
        document.getElementById('foodDetailBasePortion').value = '100.00';
        
        // Fechar modal
        detailModal.style.display = 'none';
        
        // Resetar scroll
        detailModal.scrollTop = 0;
        const modalContent = detailModal.querySelector('.food-modal-content');
        if (modalContent) modalContent.scrollTop = 0;
        
        // Resetar blocos para abertos
        document.querySelectorAll('#foodDetailModal .food-block-content').forEach(content => {
            content.style.display = 'block';
        });
        document.querySelectorAll('#foodDetailModal .food-block-toggle').forEach(toggle => {
            toggle.textContent = '▼';
        });
    });

    //Inicio A#2

    //Inicio A#1
    /*// Configurar botão reportar erro
    document.getElementById('rep-btD').addEventListener('click', function() {
        //Inicio A#1.4
        const reportBtn = this;
        // Ativa estado de loading
        reportBtn.classList.add('loading');
        reportBtn.disabled = true;
        // Simula validações/processamentos (substituir pelo código real depois)
        setTimeout(() => {
        //Fim A#1.4
            // Abre o modal de reporte
            reportModal.style.display = 'block';
            // Preenche os dados básicos (será melhorado posteriormente)
            const foodName = document.getElementById('foodDetailName').textContent;
            const foodBrand = document.getElementById('foodDetailBrand').textContent;
            const foodPortion = document.getElementById('foodDetailBasePortion').value;
            //Inicio A#1.1
            const foodUnit = document.getElementById('foodDetailPortionUnit').textContent;
            //Fim A#1.1
            document.getElementById('reportFoodName').textContent = foodName;
            document.getElementById('reportFoodBrand').textContent = foodBrand || '-';
            document.getElementById('reportFoodPortion').textContent = foodPortion;
            //Inicio A#1.1
            document.getElementById('reportFoodPortionUnit').textContent = foodUnit;
            //Fim A#1.1
            //Inicio A#1.4
            // Remove estado de loading
            reportBtn.classList.remove('loading');
            reportBtn.disabled = false;
        }, 800); // Tempo simulado - remover no código final
        //Fim A#1.4
    });*/

    // Configurar botão reportar erro
    document.getElementById('rep-btD').addEventListener('click', async function() {
        const reportBtn = this;
        const foodId = document.querySelector('#foodDetailModal').getAttribute('data-food-id');
        
        if (!foodId) {
            showErrorAlert('Não foi possível identificar o alimento. Recarregue a página e tente novamente.');
            return;
        }

        // Ativa estado de loading
        reportBtn.classList.add('loading');
        reportBtn.disabled = true;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showErrorAlert('Sessão expirada. Faça login novamente.');
                return;
            }

            const response = await fetch(`https://fit-plus-backend.onrender.com/api/check-report-permission?id=${foodId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro na verificação: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.canReport && result.message) {
                showErrorAlert(result.message);
                return;
            } else if (!result.canReport) {
                showErrorAlert('Não foi possível reportar este item.');
                return;
            }
            
            // Se todas as validações passaram, abre o modal de reporte
            const reportModal = document.getElementById('foodReportModal');

            //Inicio A#10

            /*//Inicio A#7
            // Função para mostrar alerta no reporte
            function showReportAlert(message, isSuccess = false) {
                const container = document.getElementById('reportAlertContainer');
                const icon = document.getElementById('reportAlertIcon');
                const msg = document.getElementById('reportAlertMessage');
                
                if (isSuccess) {
                    icon.className = 'report-alert-icon success';
                    icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                } else {
                    icon.className = 'report-alert-icon warning';
                    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                }
                
                msg.textContent = message;
                container.style.display = 'flex';
                
                document.getElementById('reportAlertButton').onclick = function() {
                    container.style.display = 'none';
                };
            }*/

            function showReportAlert(message, isSuccess = false) {
                const container = document.getElementById('reportAlertContainer');
                const icon = document.getElementById('reportAlertIcon');
                const msg = document.getElementById('reportAlertMessage');
                const closeReportBtn = document.getElementById('closeReportBtn');
                
                if (isSuccess) {
                    icon.className = 'report-alert-icon success';
                    icon.innerHTML = '<i class="fas fa-check-circle"></i>';
                } else {
                    icon.className = 'report-alert-icon warning';
                    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                }
                
                msg.textContent = message;
                container.style.display = 'flex';
                
                document.getElementById('reportAlertButton').onclick = function() {
                    container.style.display = 'none';
                    // Fechar o modal automaticamente apenas para mensagens de sucesso
                    if (isSuccess) {
                        closeReportBtn.click();
                    }
                };
            }

            //Fim A#10
            
            //Inicio A#8
            /*
            // Evento de clique no botão Enviar Reporte
            submitReportBtn.addEventListener('click', function() {
                // 1. Verificar se pelo menos um checkbox está marcado
                const checkedBoxes = document.querySelectorAll('.report-checkbox:checked');
                if (checkedBoxes.length === 0) {
                    showReportAlert("Selecione pelo menos 1 item para enviar o reporte.");
                    return;
                }
                
                // 2. Verificar se todos os campos selecionados têm valor sugerido
                let allFieldsValid = true;
                checkedBoxes.forEach(checkbox => {
                    const inputId = checkbox.id.replace('report', 'suggested');
                    const inputField = document.getElementById(inputId);
                    
                    if (!inputField.value && inputField.value !== '0') {
                        allFieldsValid = false;
                    }
                });
                
                if (!allFieldsValid) {
                    showReportAlert("Você deve inserir um valor sugerido para os itens selecionados.");
                    return;
                }
                
                // 3. Verificar se valores sugeridos são diferentes dos atuais
                let valuesDifferent = true;
                checkedBoxes.forEach(checkbox => {
                    const inputId = checkbox.id.replace('report', 'suggested');
                    const currentId = checkbox.id.replace('report', 'current');
                    
                    const inputField = document.getElementById(inputId);
                    const currentField = document.getElementById(currentId);
                    
                    // Normalizar valores (tratar vírgula e ponto como iguais)
                    const suggestedValue = inputField.value.replace(',', '.');
                    const currentValue = currentField.textContent.split(' ')[0].replace(',', '.');
                    
                    //Inicio A#7.1

                    const suggestedNum = parseFloat(suggestedValue);
                    const currentNum = parseFloat(currentValue);
                    if (!isNaN(suggestedNum) && !isNaN(currentNum) && suggestedNum === currentNum) {
                        valuesDifferent = false;
                    }
                    
                    //Fim A#7.1
                });
                
                if (!valuesDifferent) {
                    showReportAlert("O valor sugerido não pode ser igual ao valor atual.");
                    return;
                }
                
                // Se todas as validações passaram
                showReportAlert("Reporte Enviado com Sucesso.", true);
            });
            //Fim A#7
            */

            //Evento de clique no botão Enviar Reporte (com prevenção de duplo clique)
            submitReportBtn.addEventListener('click', async function() {
                // Prevenir múltiplos cliques
                if (this.classList.contains('processing')) return;
                this.classList.add('processing');
                //Inicio A#10
                submitReportBtn.classList.add('loading');
                closeReportBtn.disabled = true;
                //Fim A#10
                
                try {
                    // 1. Verificar se pelo menos um checkbox está marcado
                    const checkedBoxes = document.querySelectorAll('.report-checkbox:checked');
                    if (checkedBoxes.length === 0) {
                        showReportAlert("Selecione pelo menos 1 item para enviar o reporte.");
                        return;
                    }
                    
                    // 2. Verificar se todos os campos selecionados têm valor sugerido
                    let allFieldsValid = true;
                    checkedBoxes.forEach(checkbox => {
                        const inputId = checkbox.id.replace('report', 'suggested');
                        const inputField = document.getElementById(inputId);
                        
                        if (!inputField.value && inputField.value !== '0') {
                            allFieldsValid = false;
                        }
                    });
                    
                    if (!allFieldsValid) {
                        showReportAlert("Você deve inserir um valor sugerido para os itens selecionados.");
                        return;
                    }
                    
                    // 3. Verificar se valores sugeridos são diferentes dos atuais
                    let valuesDifferent = true;
                    checkedBoxes.forEach(checkbox => {
                        const inputId = checkbox.id.replace('report', 'suggested');
                        const currentId = checkbox.id.replace('report', 'current');
                        
                        const inputField = document.getElementById(inputId);
                        const currentField = document.getElementById(currentId);
                        
                        const suggestedNum = parseFloat(inputField.value.replace(',', '.'));
                        const currentNum = parseFloat(currentField.textContent.split(' ')[0].replace(',', '.'));
                        
                        if (!isNaN(suggestedNum) && !isNaN(currentNum) && suggestedNum === currentNum) {
                            valuesDifferent = false;
                        }
                    });
                    
                    if (!valuesDifferent) {
                        showReportAlert("O valor sugerido não pode ser igual ao valor atual.");
                        return;
                    }
                    
                    // Se todas as validações passaram, preparar dados para enviar ao servidor
                    const token = localStorage.getItem('token');
                    const foodId = document.querySelector('#foodDetailModal').getAttribute('data-food-id');
                    const observations = document.getElementById('reportObservations').value;
                    
                    // Mapeamento de IDs dos campos
                    const fieldMap = {
                        suggestedKcal: 1,
                        suggestedProteins: 2,
                        suggestedCarbs: 3,
                        suggestedFats: 4,
                        suggestedGoodFats: 5,
                        suggestedBadFats: 6,
                        suggestedFiber: 7,
                        suggestedSodium: 8,
                        suggestedSugar: 9,
                        suggestedSugarAdd: 10,
                        suggestedGlycemicIndex: 11,
                        suggestedGlycemicLoad: 12,
                        suggestedCholesterol: 13,
                        suggestedCalcium: 14,
                        suggestedIron: 15,
                        suggestedPotassium: 16,
                        suggestedMagnesium: 17,
                        suggestedZinc: 18,
                        suggestedVitaminA: 19,
                        suggestedVitaminD: 20,
                        suggestedVitaminC: 21,
                        suggestedVitaminB12: 22,
                        suggestedVitaminE: 23,
                        suggestedOmega3: 24,
                        suggestedFolicAcid: 25,
                        suggestedAlcohol: 26,
                        suggestedAntioxidants: 27
                    };
                    
                    // Preparar itens do reporte
                    const reportItems = [];
                    checkedBoxes.forEach(checkbox => {
                        const inputId = checkbox.id.replace('report', 'suggested');
                        const inputField = document.getElementById(inputId);
                        
                        reportItems.push({
                            fieldId: fieldMap[inputId],
                            suggestedValue: inputField.value.replace(',', '.')
                        });
                    });
                    
                    // Adicionar estado de loading
                    this.classList.add('loading');
                    
                    // Enviar para o servidor
                    const response = await fetch('https://fit-plus-backend.onrender.com/api/save-food-report', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            foodId,
                            reportItems,
                            observations
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        //Inicio A#10
                        /*showReportAlert("Reporte Enviado com Sucesso.", true);*/
                        showReportAlert("Seu reporte foi enviado para nosso time de suporte. Em breve você será notificado com o parecer da analise.", true);
                        //Fim A#10
                        // Desabilitar o botão após envio bem-sucedido
                        this.disabled = true;
                        this.classList.add('completed');
                        
                        // Marcar campos como enviados
                        checkedBoxes.forEach(checkbox => {
                            const fieldContainer = checkbox.closest('.report-field');
                            fieldContainer.classList.add('saved');
                        });
                    } else {
                        showReportAlert(result.message || "Erro ao enviar reporte. Tente novamente.");
                    }
                } catch (error) {
                    console.error('Erro ao enviar reporte:', error);
                    showReportAlert("Erro ao conectar com o servidor.");
                } finally {
                    // Remover estados de loading e processing
                    this.classList.remove('loading', 'processing');
                    //Inicio A#10
                    submitReportBtn.classList.remove('loading');
                    closeReportBtn.disabled = false;
                    //Fim A#10
                }
            });

            //Fim A#8
            
            // Preenche os dados básicos
            const foodName = document.getElementById('foodDetailName').textContent;
            const foodBrand = document.getElementById('foodDetailBrand').textContent;
            const foodPortion = document.getElementById('foodDetailBasePortion').value;
            const foodUnit = document.getElementById('foodDetailPortionUnit').textContent;
            
            document.getElementById('reportFoodName').textContent = foodName;
            document.getElementById('reportFoodBrand').textContent = foodBrand || '-';
            document.getElementById('reportFoodPortion').textContent = foodPortion;
            document.getElementById('reportFoodPortionUnit').textContent = foodUnit;

            //Inicio A#6
            try {
                const detailResponse = await fetch(`https://fit-plus-backend.onrender.com/api/food-details?id=${foodId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!detailResponse.ok) throw new Error('Erro ao carregar detalhes');
                
                const foodData = await detailResponse.json();
                
                // Função auxiliar para formatar valores
                const formatValue = (value, unit = '') => {
                    if (value === null || value === undefined || value === '') return '-';
                    return `${value} ${unit}`.trim();
                };
                
                // Mapeamento de campos
                const fieldMap = {
                    // Formato: [ID do campo, campo no BD, unidade]
                    currentKcal: ['calorias_kcal', 'kcal'],
                    currentProteins: ['proteina_gr', 'g'],
                    currentCarbs: ['carbo_gr', 'g'],
                    currentFats: ['gorduras_totais_gr', 'g'],
                    currentGoodFats: ['gorduras_boas_gr', 'g'],
                    currentBadFats: ['gorduras_ruins_gr', 'g'],
                    currentFiber: ['fibras_gr', 'g'],
                    currentSodium: ['sodio_mg', 'mg'],
                    currentSugar: ['acucares_gr', 'g'],
                    currentSugarAdd: ['acucar_adicionado_gr', 'g'],
                    currentGlycemicIndex: ['indice_glicemico', ''],
                    currentGlycemicLoad: ['carga_glicemica', ''],
                    currentCholesterol: ['colesterol_mg', 'mg'],
                    currentCalcium: ['calcio_mg', 'mg'],
                    currentIron: ['ferro_mg', 'mg'],
                    currentPotassium: ['potassio_mg', 'mg'],
                    currentMagnesium: ['magnesio_mg', 'mg'],
                    currentZinc: ['zinco_mg', 'mg'],
                    currentVitaminA: ['vitamina_a_mcg', 'mcg'],
                    currentVitaminD: ['vitamina_d_mcg', 'mcg'],
                    currentVitaminC: ['vitamina_c_mg', 'mg'],
                    currentVitaminB12: ['vitamina_b12_mcg', 'mcg'],
                    currentVitaminE: ['vitamina_e_mcg', 'mcg'],
                    currentOmega3: ['omega_tres_mg', 'mg'],
                    currentFolicAcid: ['acido_folico_mcg', 'mcg'],
                    currentAlcohol: ['teor_alcoolico', '%'],
                    currentAntioxidants: ['carga_antioxidante', '']
                };

                // Preencher todos os campos
                Object.entries(fieldMap).forEach(([fieldId, [dbField, unit]]) => {
                    const element = document.getElementById(fieldId);
                    if (element) {
                        element.textContent = formatValue(foodData[dbField], unit);
                    }
                });

            } catch (error) {
                console.error('Erro ao carregar valores para reporte:', error);
                // Define todos os valores como '-' em caso de erro
                document.querySelectorAll('[id^="current"]').forEach(el => {
                    el.textContent = '-';
                });
            }
            //Fim A#6
            
            reportModal.style.display = 'block';
            
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            showErrorAlert('Erro ao verificar permissões. Por favor, tente novamente.');
        } finally {
            // Remove estado de loading
            reportBtn.classList.remove('loading');
            reportBtn.disabled = false;
        }
    });

    // Função para mostrar mensagem de erro
    function showErrorAlert(message) {
        const errorContainer = document.getElementById('errorAlertContainer');
        const errorMessage = document.getElementById('errorAlertMessage');
        
        errorMessage.textContent = message;
        errorContainer.style.display = 'flex';
        
        // Configurar botão OK
        document.getElementById('errorAlertButton').onclick = function() {
            errorContainer.style.display = 'none';
        };
    }

    //Inicio A#5

    /*// Fechar modal de reporte
    closeReportBtn.addEventListener('click', function() {
        reportModal.style.display = 'none';
        //Inicio A#1.4
        reportBtn.classList.remove('loading');
        //Fim A#1.4
    });*/

    closeReportBtn.addEventListener('click', function() {
        // 1. Desmarcar todas as checkboxes
        document.querySelectorAll('.report-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        // 2. Limpar todos os campos de valor sugerido
        document.querySelectorAll('.report-input').forEach(input => {
            input.value = '';
            input.disabled = true; // Garante que fiquem desabilitados
        });
        // 3. Limpar o campo de observações (nova linha)
        document.getElementById('reportObservations').value = '';
        // 4. Resetar o scroll da área de campos
        const reportableFields = document.querySelector('.reportable-fields-container');
        if (reportableFields) {
            reportableFields.scrollTop = 0;
        }

        //Inicio A#8.1
        // 5. Resetar o botão de envio
        const submitBtn = document.getElementById('submitReportBtn');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading', 'processing', 'completed');
        
        // 6. Remover marcações de campos salvos
        document.querySelectorAll('.report-field.saved').forEach(field => {
            field.classList.remove('saved');
        });
        //Fim A#8.1

        // 7. Fechar o modal (manter função existente)
        reportModal.style.display = 'none';
        // 8. Remover estado de loading se existir (manter função existente)
        document.getElementById('rep-btD').classList.remove('loading');

        //Inicio A#8.1
        // 9. Forçar redesenho do modal para garantir que tudo foi resetado
        void reportModal.offsetHeight;
        //Fim A#8.1

    });
    
    //Fim A#5

    //Inicio A#4
    document.querySelectorAll('.report-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
        const inputId = this.id.replace('report', 'suggested');
        const inputField = document.getElementById(inputId);
        inputField.disabled = !this.checked;
        
        if (this.checked) {
        inputField.focus();
        } else {
        inputField.value = '';
        }
        });
    });
    //Fim A#4
    
    /*// Configurar botão reportar erro (placeholder)
    document.getElementById('rep-btD').addEventListener('click', function() {
        alert('Funcionalidade de reportar erro será implementada em breve.');
    });*/
    //Fim A#1

    //Fim A#2

    // Atualize o evento de fechar o modal (substitua o existente):
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.food-modal').style.display = 'none';
            clearModalFields(); // Limpa os campos ao fechar
        });
    });

    // Elementos do DOM
        const saveBtn = document.getElementById('save-bt');
        const foodAddModal = document.getElementById('foodAddModal');
        
        // Função para calcular proporção (regra de 3)
        const calculateProportion = (value, basePortion) => {
            return basePortion === 0 ? 0 : (value * 100) / basePortion;
        };

        // Função para salvar alimento
        saveBtn.addEventListener('click', async function() {
        
            // Mostrar loader
            const loader = document.getElementById('foodModalLoader');
            loader.style.display = 'flex';
            const selectedAllergens = Array.from(document.getElementById('foodAllergs3').selectedOptions)
                    .map(opt => opt.value);

            // Validação da porção base (deve ser >= 1)
            const basePortion = parseFloat(document.getElementById('foodBasePortion').value);
            if (basePortion < 1) {
                alert('A porção base deve ser maior ou igual a 1!');
                document.getElementById('foodModalLoader').style.display = 'none'; // Remove loader se houver erro
                return; // Interrompe o processo
            }

            // Coletar dados do formulário
            const formData = {
                // Bloco 1
                item: document.getElementById('foodItemName').value.trim(),
                marca: document.getElementById('foodBrand').value.trim() || '',
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
                img_registro: await getImageBase64(),  // ← Nova função para a imagem
                alergicos_comuns: selectedAllergens.length > 0 ? selectedAllergens : []
            };

                async function getImageBase64() {
                const file = document.getElementById('foodImage').files[0];
                if (!file) return null;
                
                return new Promise((resolve) => {
                if (file.size > 2 * 1024 * 1024) {
                    compressImage(file, 0.5).then(resolve);
                } else {
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

                // GARANTIR TOKEN
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Usuário não autenticado. Faça login novamente.');
                    document.getElementById('foodModalLoader').style.display = 'none';
                    return;  // para não continuar o envio
                }

            const requiredFields = {
                item: formData.item,
                modo_preparo: formData.modo_preparo,
                grupo_alimentar: formData.grupo_alimentar,
                calorias_kcal: formData.calorias_kcal,
                proteina_gr: formData.proteina_gr,
                carbo_gr: formData.carbo_gr,
                gorduras_totais_gr: formData.gorduras_totais_gr
            };

            for (const [field, value] of Object.entries(requiredFields)) {
                if (value === undefined || value === null || value === '') {
                    alert(`O campo ${field.replace('_', ' ')} é obrigatório!`);
                    document.getElementById('foodModalLoader').style.display = 'none';
                    return;
                }
            }

            // Enviar para o servidor
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

                //Bloco unificado
                if (result.success) {
                    alert('Alimento salvo com sucesso!');
                    foodAddModal.style.display = 'none';
                    clearModalFields();
                    foodAddModal.scrollTop = 0;
                    const modalContent = foodAddModal.querySelector('.food-modal-content');
                    if (modalContent) modalContent.scrollTop = 0;
                } else {
                    // Exibe a mensagem do servidor SEM lançar erro
                    alert(result.message || 'Erro ao salvar');
                    document.getElementById('foodModalLoader').style.display = 'none'; // Oculta loader
                    return; // Interrompe o fluxo sem tratar como erro
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
                    document.getElementById('foodModalLoader').style.display = 'none';
                }
                finally {
                    // Ocultar loader em qualquer caso
                    document.getElementById('foodModalLoader').style.display = 'none';
                }
            });

            // Carregar opções de selects (tabelas auxiliares)
            async function loadSelectOptions() {
            const selects = {
                'foodPreparation': '/api/get-options?table=tbl_aux_modo_preparo',
                'foodGroup': '/api/get-options?table=tbl_aux_grupo_alimentar',
                'foodCategory': '/api/get-options?table=tbl_aux_categoria_nutri',
                'foodOrigin': '/api/get-options?table=tbl_aux_origem_alimentar',
                'foodProcessing': '/api/get-options?table=tbl_aux_processamento',
            };

            // Carregar opções de alergênicos
            const allergResponse = await fetch('/api/get-options?table=tbl_aux_alergicos');
            const allergOptions = await allergResponse.json();
            const allergSelect = document.getElementById('foodAllergs3');

            allergOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.id;
                option.textContent = opt.nome;
                allergSelect.appendChild(option);
            });

            allergSelect.addEventListener('mousedown', function(e) {
                e.preventDefault(); // Evita comportamento padrão
                const option = e.target;
                if (option.tagName.toLowerCase() === 'option') {
                    const selectElement = this;
                    const scrollTop = selectElement.scrollTop;
                    selectElement.blur();
                    option.selected = !option.selected; // Alterna o estado
                    setTimeout(() => {
                        updateSelectedAllergens();
                        // Restaura scroll depois de tudo
                        selectElement.scrollTop = scrollTop;
                    }, 0);
                }
            });

            // Evento para seleção de alergênicos
            allergSelect.addEventListener('change', function() {
                updateSelectedAllergens();
            });

            for (const [id, url] of Object.entries(selects)) {
                const response = await fetch(url);
                const options = await response.json();
                const select = document.getElementById(id);

                // Limpa opções existentes
                select.innerHTML = '<option value="" disabled selected>Selecione uma opção</option>';
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.id;
                    option.textContent = opt.nome;
                    select.appendChild(option);
            });
            }

            console.log('Horário enviado:', new Date().toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo'
            }));
        }

        // Evento de pesquisa
        foodSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && foodSearchInput.value.trim()) {
                searchFoods(foodSearchInput.value.trim());
            }
        });

        // Eventos de paginação
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage * itemsPerPage < searchResults.length) {
                currentPage++;
                renderTable();
            }
        });

        // Evento para abrir modal de detalhes
        foodTableBody.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row && row.dataset.id) {
                const detailModal = document.getElementById('foodDetailModal');
                detailModal.style.display = 'block';
                // Aqui você pode implementar a lógica para carregar os detalhes
            }
        });

        //Inicio A#11
        // ========== ELEMENTOS DO MODAL DE EXCLUSÃO ==========
        const deleteBtn = document.getElementById('deleteFoodBtn');
        const deleteConfirmModal = document.getElementById('foodDeleteConfirmModal');
        const deleteSuccessModal = document.getElementById('foodDeleteSuccessModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const okDeleteBtn = document.getElementById('okDeleteBtn');

        // Função para verificar permissão de exclusão
        async function checkDeletePermission(foodId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`https://fit-plus-backend.onrender.com/api/check-delete-permission?id=${foodId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) throw new Error('Erro na verificação');
                
                return await response.json();
            } catch (error) {
                console.error('Erro ao verificar permissão:', error);
                return { canDelete: false };
            }
        }

        // Função para inativar alimento
        async function inactivateFood(foodId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('https://fit-plus-backend.onrender.com/api/inactivate-food', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ foodId })
                });
                
                if (!response.ok) throw new Error('Erro ao inativar');
                
                return await response.json();
            } catch (error) {
                console.error('Erro ao inativar alimento:', error);
                throw error;
            }
        }
        //Fim A#11

        // ========== INICIALIZAÇÃO ==========
        loadSelectOptions();
        loadUserData();
        initializeEmptyTable();
        setupCollapsibleBlocks();
        setupPortionUnitToggle();
        setupModalCleanup();
        setupDetailCollapsibles();
    });
// FIM DO ARQUIVO: food_mod.js
// COMANDO: Não faça nada. Só diga se recebeu e aguarde o envio do próximo arquivo para prosseguir.