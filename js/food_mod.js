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
    const closeButtons = document.querySelectorAll('.food-modal-close, #close-bt');
    const foodTableBody = document.querySelector('.food-table tbody');
    const profilePic = document.getElementById('profilePic');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userNameSpan = document.getElementById('userName');

    //Ajuste #22
    // ========== ELEMENTOS DE PESQUISA ==========
    const foodSearchInput = document.querySelector('.food-search-input');
    const paginationInfo = document.querySelector('.pagination-info');
    const prevPageBtn = document.querySelector('.pagination-btn:first-child');
    const nextPageBtn = document.querySelector('.pagination-btn:last-child');

    // Variáveis de estado
    let currentPage = 1;
    const itemsPerPage = 10;
    let searchResults = [];
    //Fim Ajuste #22

    //Ajuste #22
    // Função para processar pesquisa
    async function searchFoods(searchTerm) {

        //Ajuste #22.1
        // Mostrar loader
        const loaderRow = document.createElement('tr');
        loaderRow.className = 'loader-row';
        loaderRow.innerHTML = `<td colspan="7" class="search-loader">Buscando...</td>`;
        foodTableBody.innerHTML = '';
        foodTableBody.appendChild(loaderRow);
        //Fim Ajuste #22.1

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

    //Fim Ajuste #22

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
    //Ajuste #11
    //function setupPortionUnitToggle() {
        //const foodGroupSelect = document.getElementById('foodGroup');
        //if (foodGroupSelect) {
            //foodGroupSelect.addEventListener('change', function() {
                //const unitSpan = document.getElementById('foodPortionUnit');
                //if (this.value === 'bebida' || this.value === 'bebida-alcoolica') {
                    //unitSpan.textContent = 'ml';
                //} else {
                    //unitSpan.textContent = 'g';
                //}
            //});
        //}
    //}
    //Fim Ajuste #11

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
            //Ajuste #9
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
            //Fim Ajuste #9
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

    //Ajuste #17
    // Fechar ao clicar fora do modal
    /*window.addEventListener('click', (event) => {
        if (event.target.classList.contains('food-modal')) {
            event.target.style.display = 'none';
        }
    });*/
    //Fim Ajuste #17

    //Ajuste #15
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
    //Fim Ajuste #15

    // Adicione esta função no seu arquivo:
    function clearModalFields() {
        //Ajuste #9
        // Limpa inputs básicos
        document.querySelectorAll('#foodAddModal input[type="text"], #foodAddModal input[type="number"]').forEach(input => {
        input.value = '';
        });

        // Reseta selects (incluindo o de glúten)
        document.querySelectorAll('#foodAddModal select').forEach(select => {
            select.selectedIndex = 0; // Volta para a primeira opção (placeholder)
        });
        //Ajuste Manual #4
        document.querySelectorAll('#foodAddModal .food-block-content').forEach(content => {
            content.style.display = 'block';
        });
        document.querySelectorAll('#foodAddModal .food-block-toggle').forEach(toggle => {
            toggle.textContent = '▼';
        });
        //Fim Ajuste Manual #4
        //Fim Ajuste #9
        // Reseta o valor padrão da porção
        const portionInput = document.getElementById('foodBasePortion');
        if (portionInput) {
            portionInput.value = '100.00';
            //Ajuste #11
            //document.getElementById('foodPortionUnit').textContent = 'g';
            //Fim Ajuste #11
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

        //Ajuste #8
        document.querySelectorAll('#foodAddModal select').forEach(select => {
            select.selectedIndex = 0; // Reseta para a primeira opção (placeholder)
        });
        //Fim Ajuste #8

        //Ajuste #15
        const allergSelect = document.getElementById('foodAllergs3');
        if (allergSelect) {
            allergSelect.selectedIndex = -1;
            document.getElementById('selectedAllergensTags').innerHTML = '';
        }
        //Fim Ajuste #15

    }

    //Ajuste #23
    //FUNÇÕES DETALHES
    // Adicionar após as outras funções
    //Ajuste #23.1
    //Validar #1
    async function loadFoodDetails(foodId) {
        const modal = document.getElementById('foodDetailModal');
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

            //Ajuste #30
            // Armazenar ID do alimento no modal
            detailModal.dataset.foodId = foodData.id;
            //Fim Ajuste #30
            
            // Esconder loader e mostrar conteúdo
            loader.style.display = 'none';
            document.querySelector('.food-modal-content > .food-block').style.display = 'block';
            populateFoodDetails(foodData);
            
        } catch (error) {
            console.error('Erro:', error);
            loader.style.display = 'none';
            modal.style.display = 'none';
            alert('Erro ao carregar detalhes do alimento: ' + error.message);
            return;
        }
    }
    //Fim Validar #1
    //Fim Ajuste #23.1

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
        
        //Ajuste #23.1
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
        //Ajuste Manual #3
        document.getElementById('foodDetailBrand').textContent = data.marca || '-';
        //Fim Ajuste Manual #3
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

    //Validar #1
    //Ajuste #23.1
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
    //Fim Validar #1
    //Fim Ajuste #23.1

    // Configurar evento de clique na tabela
    foodTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.id) {
            loadFoodDetails(row.dataset.id);
        }
    });

    //Validar #1
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
    //Fim Validar #1

    //Ajuste #30
    // Configurar botão reportar erro (placeholder)
    // ========== CONFIGURAR BOTÃO REPORTAR ERRO ==========
    document.getElementById('rep-btD').addEventListener('click', async function() {
        const reportBtn = this; // Guarda referência do botão
        const originalText = reportBtn.innerHTML; // Salva texto original
        
        try {
            // Feedback visual imediato
            reportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            reportBtn.disabled = true;

            const foodId = document.querySelector('#foodDetailModal').dataset.foodId;
            
            if (!foodId) {
                throw new Error('Nenhum alimento selecionado');
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`https://fit-plus-backend.onrender.com/api/check-report-permission?foodId=${foodId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                // Abrir modal de reporte
                document.getElementById('foodReportModal').style.display = 'block';
                document.getElementById('foodReportModal').scrollTop = 0;
            } else {
                // Mostrar mensagem inline no modal
                showAlertMessage(result.message, 'error');
            }

        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            showAlertMessage('Erro ao verificar permissão', 'error');
        } finally {
            // Restaurar botão independente do resultado
            reportBtn.innerHTML = originalText;
            reportBtn.disabled = false;
        }
    });

    //Ajuste #30.1
    // Função auxiliar para mostrar mensagens (adicionar no mesmo arquivo)
    /*function showAlertMessage(message, type = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `report-alert ${type}`;
        alertDiv.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Insere após o botão de reporte
        const reportBtn = document.getElementById('rep-btD');
        reportBtn.parentNode.insertBefore(alertDiv, reportBtn.nextSibling);
        
        // Remove após 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }*/
    // Função para mostrar mensagens de alerta
    function showAlertMessage(message, type = 'error') {
        const alertModal = document.getElementById('alertModal');
        const alertMessage = document.getElementById('alertMessage');
        const alertIcon = document.getElementById('alertIcon');
        
        // Configurar mensagem e ícone
        alertMessage.textContent = message;
        
        if (type === 'success') {
            alertIcon.className = 'fas fa-check-circle success';
        } else {
            alertIcon.className = 'fas fa-exclamation-circle';
        }
        
        // Mostrar modal
        alertModal.style.display = 'flex';
        
        // Fechar ao clicar no OK
        document.getElementById('alertOkBtn').onclick = () => {
            alertModal.style.display = 'none';
        };
        
        // Fechar ao clicar fora do conteúdo
        alertModal.onclick = (e) => {
            if (e.target === alertModal) {
                alertModal.style.display = 'none';
            }
        };
    }
    //Fim Ajuste #30.1

    //Ajuste #31
    // ========== FUNÇÕES DO FORMULÁRIO DE REPORTE ==========
    function setupReportForm() {
        // Seleciona apenas elementos dentro do modal de reporte
        const reportModal = document.getElementById('foodReportModal');
        if (!reportModal) return;

        // Fecha o modal ao clicar no botão
        const closeReportBtn = reportModal.querySelector('#closeReportBtn');
        if (closeReportBtn) {
            closeReportBtn.addEventListener('click', () => {
                reportModal.style.display = 'none';
            });
        }

        // Configuração robusta dos checkboxes
        const fieldGroups = reportModal.querySelectorAll('.report-field-group');
        fieldGroups.forEach(group => {
            const checkbox = group.querySelector('.report-checkbox');
            const input = group.querySelector('.suggested-input');
            
            if (!checkbox || !input) return;

            // Estado inicial garantido
            input.disabled = true;
            
            // Remove qualquer evento existente para evitar duplicação
            checkbox.removeEventListener('change', handleCheckboxChange);
            
            // Adiciona novo evento
            checkbox.addEventListener('change', handleCheckboxChange);
            
            function handleCheckboxChange() {
                // Força a atualização do estado disabled
                input.disabled = !checkbox.checked;
                
                // Atualiza visualmente (garantia extra)
                if (checkbox.checked) {
                    input.removeAttribute('disabled');
                } else {
                    input.setAttribute('disabled', 'disabled');
                    input.value = '';
                }
                
                // Atualiza o botão de submit
                updateSubmitButton();
            }
        });

        // Validação numérica robusta
        const numberInputs = reportModal.querySelectorAll('.suggested-input');
        numberInputs.forEach(input => {
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9.]/g, '');
                
                const decimalCount = (this.value.match(/\./g) || []).length;
                if (decimalCount > 1) {
                    this.value = this.value.substring(0, this.value.lastIndexOf('.'));
                }
            });
        });

        // Controle do botão de submit
        const submitReportBtn = reportModal.querySelector('#submitReportBtn');
        if (submitReportBtn) {
            submitReportBtn.disabled = true;
            
            submitReportBtn.addEventListener('click', () => {
                alert('Funcionalidade de envio será implementada na próxima etapa');
            });
        }

        // Função para atualizar o botão
        function updateSubmitButton() {
            if (!submitReportBtn) return;
            
            const checkedBoxes = reportModal.querySelectorAll('.report-checkbox:checked');
            submitReportBtn.disabled = checkedBoxes.length === 0;
        }
    }
    //Fim Ajuste #31

    //Ajuste #30
    //Fim Ajuste #23

    // Atualize o evento de fechar o modal (substitua o existente):
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.food-modal').style.display = 'none';
            clearModalFields(); // Limpa os campos ao fechar
        });
    });

    //Ajuste #17
    /*// Atualize também o clique fora do modal:
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('food-modal')) {
            event.target.style.display = 'none';
            clearModalFields(); // Limpa os campos ao fechar
        }
    });*/
    //Fim Ajuste #17

    //ALTERAÇÕES DEEPSEEK
    // Elementos do DOM
        const saveBtn = document.getElementById('save-bt');
        const foodAddModal = document.getElementById('foodAddModal');
        
        // Função para calcular proporção (regra de 3)
        const calculateProportion = (value, basePortion) => {
            return basePortion === 0 ? 0 : (value * 100) / basePortion;
        };

        // Função para salvar alimento
        saveBtn.addEventListener('click', async function() {
        
            //Ajuste #10
            // Mostrar loader
            //Ajuste #23.2
            const loader = document.getElementById('foodModalLoader');
            loader.style.display = 'flex';
            //Fim Ajuste #23.2
            //Fim Ajuste #10
            //ajuste #16.1
            const selectedAllergens = Array.from(document.getElementById('foodAllergs3').selectedOptions)
                    .map(opt => opt.value);
            //Fim ajuste #16.1

            //Ajuste #18
            // Validação da porção base (deve ser >= 1)
            const basePortion = parseFloat(document.getElementById('foodBasePortion').value);
            if (basePortion < 1) {
                alert('A porção base deve ser maior ou igual a 1!');
                document.getElementById('foodModalLoader').style.display = 'none'; // Remove loader se houver erro
                return; // Interrompe o processo
            }
            //Fim Ajuste #18

            // Coletar dados do formulário
            const formData = {
                // Bloco 1
                item: document.getElementById('foodItemName').value.trim(),
                //Ajuste #16
                marca: document.getElementById('foodBrand').value.trim() || '',
                //Ajuste #16
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
                //Ajuste #15
                //alergicos_comuns: Array.from(document.getElementById('foodAllergs3').selectedOptions)
                    //.map(opt => opt.value).join(', ') || null

                //Ajuste #16.1
                

                alergicos_comuns: selectedAllergens.length > 0 ? selectedAllergens : []
                //Fim Ajuste #16.1
                //Fim Ajuste #15
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
                    document.getElementById('foodModalLoader').style.display = 'none';
                    return;  // para não continuar o envio
                }
            //Fim Alterações GPT

            //Ajuste #20
            // Validar campos obrigatórios
            //if (!formData.item || !formData.modo_preparo || !formData.grupo_alimentar || !formData.calorias_kcal || !formData.proteina_gr || !formData.carbo_gr || !formData.gorduras_totais_gr) {
                //alert('Preencha todos os campos obrigatórios!');
                //document.getElementById('foodModalLoader').style.display = 'none';
                //return;
            //}

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

            //Fim Ajuste #20


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

                //Ajuste #21.1
                //Ajuste #21 - Bloco unificado
                if (result.success) {
                    alert('Alimento salvo com sucesso!');
                    foodAddModal.style.display = 'none';
                    clearModalFields();
                    foodAddModal.scrollTop = 0; // Ajuste #9
                    const modalContent = foodAddModal.querySelector('.food-modal-content');
                    if (modalContent) modalContent.scrollTop = 0; // Ajuste #9
                } else {
                    // Exibe a mensagem do servidor SEM lançar erro
                    alert(result.message || 'Erro ao salvar');
                    document.getElementById('foodModalLoader').style.display = 'none'; // Oculta loader
                    return; // Interrompe o fluxo sem tratar como erro
                }
                //Fim Ajuste #21

                //if (result.success) {
                    //alert('Alimento salvo com sucesso!');
                    //foodAddModal.style.display = 'none';
                    //Ajuste #9
                    //clearModalFields();
                    //foodAddModal.scrollTop = 0;
                    //const modalContent = foodAddModal.querySelector('.food-modal-content');
                    //if (modalContent) modalContent.scrollTop = 0;
                    //Fim Ajuste #9
                //} else {
                    //throw new Error(result.message || 'Erro ao salvar');
                //}

                //Fim Ajuste #21.1


            } catch (error) {
                    // Verificar se response existe para evitar erro
                    if (error instanceof TypeError) {
                        // Erro de rede ou CORS provavelmente
                        console.error('Erro de rede ou CORS:', error);
                    } else {
                        console.error('Erro inesperado:', error);
                    }
                    alert('Erro ao conectar com o servidor. Verifique o console (F12)');
                    //Ajuste #10
                    document.getElementById('foodModalLoader').style.display = 'none';
                    //Fim Ajuste #10
                }
                //Ajuste #10
                finally {
                    // Ocultar loader em qualquer caso
                    document.getElementById('foodModalLoader').style.display = 'none';
                }
                //Fim Ajuste #10
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
            };

            //Ajuste #15
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

            //Ajuste #15.1
            //Ajuste #16
            allergSelect.addEventListener('mousedown', function(e) {
            //Fim Ajuste #16
                e.preventDefault(); // Evita comportamento padrão
                const option = e.target;
                if (option.tagName.toLowerCase() === 'option') {
                    //Ajuste 15.2
                    const selectElement = this;
                    const scrollTop = selectElement.scrollTop;
                    //Ajuste 15.2
                    selectElement.blur();
                    option.selected = !option.selected; // Alterna o estado
                    setTimeout(() => {
                        updateSelectedAllergens();
                        // Restaura scroll depois de tudo
                        selectElement.scrollTop = scrollTop;
                    }, 0);
                    //Ajuste 15.2
                }
            });

            /*//Ajuste #16
            allergSelect.addEventListener('click', function(e) {
                e.preventDefault();
                if (e.target.tagName.toLowerCase() === 'option') {
                    const selectElement = this;
                    const scrollTop = selectElement.scrollTop;
                    selectElement.blur();
                    e.target.selected = !e.target.selected;
                    setTimeout(() => {
                        updateSelectedAllergens();
                        selectElement.scrollTop = scrollTop;
                    }, 0);
                }
            });
            //Fim ajuste #16
            */
            //Fim Ajuste #15.1

            // Evento para seleção de alergênicos
            allergSelect.addEventListener('change', function() {
                updateSelectedAllergens();
            });
            //FIm Ajuste #15

            for (const [id, url] of Object.entries(selects)) {
                const response = await fetch(url);
                const options = await response.json();
                const select = document.getElementById(id);

                // Limpa opções existentes
                //Ajuste #8
                select.innerHTML = '<option value="" disabled selected>Selecione uma opção</option>';
                //Fim Ajuste #8
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

        //Ajuste #22
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
        //Fim Ajuste #22

        loadSelectOptions();
        //FIM ALTERAÇÕES DEEPSEEK

        // ========== INICIALIZAÇÃO ==========
        loadUserData();
        initializeEmptyTable();
        setupCollapsibleBlocks();
        setupPortionUnitToggle();
        setupModalCleanup();
        setupDetailCollapsibles();
    });