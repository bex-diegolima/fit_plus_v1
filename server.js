//Inicio Ajustes GPT
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { pool } = require('./db');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const multer = require('multer');
const upload = multer();
const jwt = require('jsonwebtoken');  // Já pode declarar aquii
const SECRET_KEY = 'Cruciatu$145'; // apenas para testes

const app = express();  // DECLARE APP ANTES de usar app.use()

// AJUSTES DEEPSEEK

const corsOptions = {
  origin: 'https://fit-plus-backend.onrender.com', // Substitua pelo domínio do seu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Adicione também para lidar com requisições OPTIONS
app.options('*', cors(corsOptions));

// FIM AJUSTES DEEPSEEK

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

if (!apiKey.apiKey || apiKey.apiKey.length < 50) {
    console.error('ERRO CRÍTICO: Chave API do Brevo inválida ou não configurada!');
    process.exit(1);
}

// Middleware para verificar token JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Token inválido' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido ou expirado' });

    req.user = user;
    next();
  });
}

const PORT = 3002;

//Inicio DeepSeek #3.1
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
//Fim DeepSeek #3.1
app.use(express.static(__dirname));
//Fim Ajustes GPT

function generateRandomCode() {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendValidationEmail(email, code) {
    try {
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        sendSmtpEmail.subject = "🔑 Seu Código de Validação Fit+";
        sendSmtpEmail.htmlContent = `<div><strong>${code}</strong></div>`;
        sendSmtpEmail.sender = { email: "bex.diegolima@gmail.com", name: "Fit+ - Confirmação de Cadastro" };
        sendSmtpEmail.to = [{ email }];
        sendSmtpEmail.replyTo = { email: "bex.diegolima@gmail.com", name: "Suporte Fit+" };

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        return true;
    } catch (error) {
        console.error('Erro no envio:', error);
        return false;
    }
}

app.post('/api/register', async (req, res) => {
    try {
        const { email, firstName, lastName, birthDate, gender, phone, password } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'E-mail inválido' });
        }
        const validationCode = generateRandomCode();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(`
                INSERT INTO tbl01_users 
                (email_user, name_user, last_name_user, birth_date_user, gender_user, phone_user, password_user, creator, reg_code, account_status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'system', $8, 'pendente') RETURNING user_id`,
                [email, firstName, lastName, birthDate, gender, phone, password, validationCode]
            );
            const userId = result.rows[0].user_id;
            const emailSent = await sendValidationEmail(email, validationCode);
            if (!emailSent) throw new Error('Falha no envio do e-mail');
            await client.query('COMMIT');
            return res.status(201).json({ success: true, message: 'Registro realizado com sucesso.', userId, email });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro durante o registro', error: error.message });
    }
});

app.post('/api/validate', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code || code.length !== 6) {
            return res.status(400).json({ success: false, message: 'Dados de validação inválidos' });
        }
        const result = await pool.query(`
            SELECT user_id, reg_code FROM tbl01_users
            WHERE email_user = $1 AND account_status = 'pendente'`, [email]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado ou código já validado' });
        }
        const user = result.rows[0];
        if (code === user.reg_code.toString()) {
            await pool.query(`UPDATE tbl01_users SET account_status = 'active' WHERE user_id = $1`, [user.user_id]);
            return res.json({ success: true, message: 'Cadastro validado com sucesso!' });
        } else {
            return res.status(400).json({ success: false, message: 'Código de validação incorreto' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro durante a validação' });
    }
});

app.post('/api/resend-code', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'E-mail inválido' });
        }
        const newCode = generateRandomCode();
        const result = await pool.query(`
            UPDATE tbl01_users SET reg_code = $1
            WHERE email_user = $2 AND account_status = 'pendente'`, [newCode, email]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'E-mail não encontrado ou conta já ativada' });
        }

        const emailSent = await sendValidationEmail(email, newCode);
        if (!emailSent) throw new Error('Falha no envio do e-mail');

        return res.json({ success: true, message: 'Novo código enviado com sucesso' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro durante o reenvio do código' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query(`
            SELECT user_id, password_user, account_status FROM tbl01_users WHERE email_user = $1`, [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
        }

        const user = result.rows[0];
        if (password !== user.password_user) {
            return res.status(401).json({ success: false, message: 'Senha incorreta' });
        }

        if (user.account_status !== 'active') {
            return res.status(403).json({ success: false, message: 'Conta inativa. Por favor, contate o suporte.' });
        }

        // 🔐 Geração do token JWT
        const token = jwt.sign({ userId: user.user_id, email }, SECRET_KEY, { expiresIn: '1h' });

        return res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token: token // ⬅️ agora o token será enviado para o frontend
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro durante o login' });
    }
});

app.post('/api/send-recovery-code', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await pool.query(`SELECT user_id FROM tbl01_users WHERE email_user = $1`, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'E-mail não encontrado' });
        }

        const code = generateRandomCode();
        await pool.query(`UPDATE tbl01_users SET pass_code = $1 WHERE email_user = $2`, [code, email]);

        const emailSent = await sendValidationEmail(email, `Seu código de recuperação: ${code}`);
        if (!emailSent) throw new Error('Falha no envio do e-mail');

        res.json({ success: true, message: 'Código enviado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

app.post('/api/validate-recovery-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await pool.query(
            'SELECT user_id FROM tbl01_users WHERE email_user = $1 AND pass_code = $2',
            [email, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Código inválido' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro na validação' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const result = await pool.query(
            'SELECT password_user FROM tbl01_users WHERE email_user = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        if (result.rows[0].password_user === newPassword) {
            return res.status(400).json({ success: false, message: 'A nova senha não pode ser igual à anterior' });
        }

        await pool.query(
            'UPDATE tbl01_users SET password_user = $1, pass_code = NULL WHERE email_user = $2',
            [newPassword, email]
        );

        res.json({ success: true, message: 'Senha atualizada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao redefinir senha' });
    }
});

app.post('/api/resend-recovery-code', async (req, res) => {
    try {
        const { email } = req.body;
        const code = generateRandomCode();
        await pool.query('UPDATE tbl01_users SET pass_code = $1 WHERE email_user = $2', [code, email]);

        const emailSent = await sendValidationEmail(email, `Seu novo código: ${code}`);
        if (!emailSent) throw new Error('Falha no envio');

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao reenviar código' });
    }
});

app.get('/api/get-user-data', async (req, res) => {
    try {
        const userEmail = req.query.email;
        if (!userEmail) {
            return res.status(400).json({ success: false, message: 'E-mail não fornecido' });
        }

        const result = await pool.query(
            'SELECT name_user FROM tbl01_users WHERE email_user = $1',
            [userEmail]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        res.json({ success: true, userName: result.rows[0].name_user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

app.post('/api/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
    try {
        const userEmail = req.body.email;
        if (!userEmail) {
            return res.status(400).json({ success: false, message: 'E-mail do usuário é obrigatório' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Arquivo de imagem não enviado' });
        }

        const imgBuffer = req.file.buffer;

        const result = await pool.query(
            'UPDATE tbl01_users SET profile_pic = $1 WHERE email_user = $2',
            [imgBuffer, userEmail]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        res.json({ success: true, message: 'Foto de perfil atualizada com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

app.get('/api/profile-pic', async (req, res) => {
    try {
        const userEmail = req.query.email;
        if (!userEmail) {
            return res.status(400).json({ success: false, message: 'E-mail do usuário não fornecido' });
        }

        const result = await pool.query(
            'SELECT profile_pic FROM tbl01_users WHERE email_user = $1',
            [userEmail]
        );

        if (result.rows.length === 0 || !result.rows[0].profile_pic) {
            return res.status(404).json({ success: false, message: 'Foto de perfil não encontrada' });
        }

        const imgBuffer = result.rows[0].profile_pic;

        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': imgBuffer.length
        });
        res.end(imgBuffer);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

//ALTERAÇÕES DEEPSEEK

// Middleware de autenticação (adicione no início do arquivo, antes das rotas)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido' });
        req.user = user;
        next();
    });
};

//Ajuste #21
// Função para verificar duplicatas
async function checkDuplicateFood(item, marca, modo_preparo, calorias_kcal, userId) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id FROM tbl_foods 
            WHERE item = $1 
            AND marca = $2 
            AND modo_preparo = $3 
            AND calorias_kcal = $4 
            AND user_registro = $5
        `;
        const values = [item, marca, modo_preparo, calorias_kcal, userId];
        const result = await client.query(query, values);
        return result.rows.length > 0;
    } finally {
        client.release();
    }
}
//Fim Ajuste #21

// Rota para salvar alimento (atualizada)
app.post('/api/save-food', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar se o usuário está autenticado
        if (!req.user || !req.user.userId) {
            throw new Error('Usuário não autenticado');
        }

        const userId = req.user.userId;

        //Ajuste #21
        // Verificar duplicata
        const isDuplicate = await checkDuplicateFood(
            req.body.item,
            req.body.marca || '', // Garante que marca vazia seja tratada como NULL no banco
            req.body.modo_preparo,
            req.body.calorias_kcal,
            req.user.userId
        );

        if (isDuplicate) {
            await client.query('ROLLBACK');
            return res.status(200).json({  // ✅ Status 200 para evitar trigger de erro no front
                success: false,
                message: 'Este alimento já está cadastrado com os mesmos dados básicos.'
            });
        }
        //Fim Ajuste #21

        //Ajuste #18
        // Validação no backend (garante que porcao_base >= 1 mesmo se o frontend falhar)
        if (parseFloat(req.body.base_portion_original) < 1) {
            throw new Error('Porção base inválida (deve ser >= 1)');
        }
        //Fim Ajuste #18

        //Inicio DeepSeek #3
        // 2. Converta a imagem de base64 para Buffer (se existir)
        const imageBuffer = req.body.img_registro 
            ? Buffer.from(req.body.img_registro, 'base64')
            : null;
        //Fim DeepSeek #3

        // 2. Preparar valores
        const tipo_medida = [10, 11].includes(parseInt(req.body.grupo_alimentar)) ? 2 : 1;
        
        //Alteração DeepSeek 23-07
        console.log('Usuário autenticado:', req.user); // Verifique se userId existe
        //Fim DeepSeek 23-07

        // 3. Query SQL
        //Ajuste #16.1
        const alergicosArray = req.body.alergicos_comuns 
            ? typeof req.body.alergicos_comuns === 'string'
                ? req.body.alergicos_comuns
                    .split(',')
                    .map(item => item.trim())
                    .filter(item => item !== '')
                : Array.isArray(req.body.alergicos_comuns)
                    ? req.body.alergicos_comuns.filter(item => item !== '')
                    : null
            : null;

        console.log('alergicosArray processado:', alergicosArray); // Para depuração
        //Fim Ajuste #16.1
        //Ajuste #19 - Antigo NOW()
        const query = `
            INSERT INTO tbl_foods (
                item, marca, modo_preparo, grupo_alimentar, porcao_base,
                calorias_kcal, proteina_gr, carbo_gr, gorduras_totais_gr,
                gorduras_boas_gr, gorduras_ruins_gr, fibras_gr, sodio_mg,
                acucares_gr, acucar_adicionado_gr, indice_glicemico, carga_glicemica,
                colesterol_mg, calcio_mg, ferro_mg, potassio_mg, magnesio_mg,
                zinco_mg, vitamina_a_mcg, vitamina_d_mcg, vitamina_c_mg,
                vitamina_b12_mcg, vitamina_e_mcg, omega_tres_mg, acido_folico_mcg,
                teor_alcoolico, observacoes, glutem, categoria_nutricional, origem, nivel_processamento,
                user_registro, tipo_medida_alimento, dt_registro, dt_atualizacao,
                status_registro, tipo_registro_alimento,  carga_antioxidante, img_registro, alergicos_comuns
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, (timezone('America/Sao_Paulo', now())),
                (timezone('America/Sao_Paulo', now())), $39, $40, $41, $42, $43
            )
            RETURNING id
        `;
        //Fim Ajuste #19 - Antigo NOW()
        // 4. Valores para a query
        const values = [
            // Dados básicoss
            req.body.item || null,
            //Ajuste #16.1
            //req.body.marca === '' ? null : req.body.marca || null,
            (req.body.marca && req.body.marca.trim() !== '') ? req.body.marca.trim() : null,
            //Ajuste #16.1
            req.body.modo_preparo || null,
            req.body.grupo_alimentar || null,
            100, // porcao_base fixo
            // Valores nutricionais (com tratamento)
            parseFloat(req.body.calorias_kcal) || 0,
            parseFloat(req.body.proteina_gr) || 0,
            parseFloat(req.body.carbo_gr) || 0,
            parseFloat(req.body.gorduras_totais_gr) || 0,
            parseFloat(req.body.gorduras_boas_gr) || 0,
            parseFloat(req.body.gorduras_ruins_gr) || 0,
            parseFloat(req.body.fibras_gr) || 0,
            parseFloat(req.body.sodio_mg) || 0,
            parseFloat(req.body.acucares_gr) || 0,
            parseFloat(req.body.acucar_adicionado_gr) || 0,
            parseFloat(req.body.indice_glicemico) || 0,
            parseFloat(req.body.carga_glicemica) || 0,
            parseFloat(req.body.colesterol_mg) || 0,
            parseFloat(req.body.calcio_mg) || 0,
            parseFloat(req.body.ferro_mg) || 0,
            parseFloat(req.body.potassio_mg) || 0,
            parseFloat(req.body.magnesio_mg) || 0,
            parseFloat(req.body.zinco_mg) || 0,
            parseFloat(req.body.vitamina_a_mcg) || 0,
            parseFloat(req.body.vitamina_d_mcg) || 0,
            parseFloat(req.body.vitamina_c_mg) || 0,
            parseFloat(req.body.vitamina_b12_mcg) || 0,
            parseFloat(req.body.vitamina_e_mcg) || 0,
            parseFloat(req.body.omega_tres_mg) || 0,
            parseFloat(req.body.acido_folico_mcg) || 0,
            parseFloat(req.body.teor_alcoolico) || 0,
            // Outros campos
            req.body.observacoes || null,
            req.body.glutem || false,
            req.body.categoria_nutricional || null,
            req.body.origem || null,
            req.body.nivel_processamento || null,
            //Alteração DeepSeek 23-07
            req.user.userId, // ID do usuário autenticado
            //Fim DeepSeek 23-07
            tipo_medida,
            //new Date(), // dt_registro
            //new Date(), // dt_atualizacao
            parseInt(req.body.status_registro) || 1,
            parseInt(req.body.tipo_registro_alimento) || 2,
            parseInt(req.body.carga_antioxidante) || 0,
            imageBuffer,
            //Ajuste #15
            //Ajuste #16.1
            //(req.body.alergicos_comuns || null),
            alergicosArray && alergicosArray.length > 0 ? alergicosArray.join(',') : null,
            //Fim Ajuste #16.1
            //Fim Ajuste #15
        ];

        // 5. Executar query
        const result = await client.query(query, values);
        await client.query('COMMIT');
        
        res.json({ 
            success: true,
            id: result.rows[0].id,
            message: 'Alimento cadastrado com sucesso!'
        });

    } catch (error) {
        //Ajuste #22.2
        await client.query('ROLLBACK'); // Reverte em caso de erro
        //Fim Ajuste #22.2
        console.error('Erro interno:', error);
        res.status(500).json({  // Garanta que retorna JSON mesmo em erros
            success: false,
            message: 'Erro interno: ' + error.message
        });
    } finally {
        client.release();
    }
});

// Rota para carregar opções de selects (mantida)
app.get('/api/get-options', async (req, res) => {
    try {
        const { table } = req.query;
        if (!table) {
            return res.status(400).json({ error: 'Parâmetro "table" é obrigatório' });
        }
        
        const result = await pool.query(`SELECT id, nome FROM ${table} WHERE status = 'Ativo'`);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            suggestion: 'Verifique se o nome da tabela está correto'
        });
    }
});

//Ajuste #22
// Rota de pesquisa
app.get('/api/search-foods', authenticateToken, async (req, res) => {
    try {
        const { term } = req.query;
        if (!term) return res.status(400).json([]);

        // Processa termos de pesquisa
        const searchTerms = term.toLowerCase().split(/\s+/)
            .filter(word => word.length > 2 && !['de', 'da', 'do'].includes(word));

        if (searchTerms.length === 0) return res.json([]);

        // Consulta SQL
    //Inicio Ajuste #21
        const query = `
            SELECT 
                f.id,
                f.item,
                f.marca,
                f.modo_preparo,
                f.porcao_base,
                f.calorias_kcal,
                f.tipo_medida_alimento,
                f.tipo_registro_alimento,
                mp.nome as modo_preparo_nome,
                ga.nome as grupo_alimentar_nome,
                tm.nome as tipo_medida_nome
            FROM tbl_foods f
            LEFT JOIN tbl_aux_modo_preparo mp ON f.modo_preparo = mp.id
            LEFT JOIN tbl_aux_grupo_alimentar ga ON f.grupo_alimentar = ga.id
            LEFT JOIN tbl_aux_tipo_medida tm ON f.tipo_medida_alimento = tm.id
            WHERE ${searchTerms.map((_, i) => `f.key_words LIKE $${i + 1}`).join(' OR ')}
            ORDER BY 
                ${searchTerms.map((_, i) => `CASE WHEN f.key_words LIKE $${i + 1} THEN 1 ELSE 0 END`).join(' + ')} DESC,
                f.item ASC
        `;

        const values = searchTerms.map(term => `%${term}%`);
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro na pesquisa:', error);
        res.status(500).json({ error: 'Erro interno' });
    }
    //Fim Ajuste #22.1
});
//Fim Ajuste #22

//Ajuste #23
// Adicionar após as outras rotas
app.get('/api/food-details', authenticateToken, async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'ID do alimento não fornecido' });

        console.log('Buscando detalhes para alimento ID:', id); // Log para debug

        const query = `
            SELECT 
                f.*,
                mp.nome as modo_preparo_nome,
                ga.nome as grupo_alimentar_nome,
                cn.nome as categoria_nutricional_nome,
                oa.nome as origem_alimentar_nome,
                pr.nome as processamento_nome,
                tm.nome as tipo_medida_nome
            FROM tbl_foods f
            LEFT JOIN tbl_aux_modo_preparo mp ON f.modo_preparo = mp.id
            LEFT JOIN tbl_aux_grupo_alimentar ga ON f.grupo_alimentar = ga.id
            LEFT JOIN tbl_aux_categoria_nutri cn ON f.categoria_nutricional = cn.id
            LEFT JOIN tbl_aux_origem_alimentar oa ON f.origem = oa.id
            LEFT JOIN tbl_aux_processamento pr ON f.nivel_processamento = pr.id
            LEFT JOIN tbl_aux_tipo_medida tm ON f.tipo_medida_alimento = tm.id
            WHERE f.id = $1
        `;

        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alimento não encontrado' });
        }

        let foodData = result.rows[0];

        // Converter Buffer para base64 se necessário (NOVO CÓDIGO)
        if (foodData.img_registro instanceof Buffer) {
            foodData.img_registro = `data:image/jpeg;base64,${foodData.img_registro.toString('base64')}`;
        }
        
        // Processar alérgenos se existirem
        if (foodData.alergicos_comuns) {
            const allergenicIds = foodData.alergicos_comuns.split(',').filter(id => id.trim() !== '');
            if (allergenicIds.length > 0) {
                const allergenicQuery = `
                    SELECT nome FROM tbl_aux_alergicos 
                    WHERE id = ANY($1::int[])
                    ORDER BY nome
                `;
                const allergenicResult = await pool.query(allergenicQuery, [allergenicIds]);
                foodData.alergicos_comuns_nomes = allergenicResult.rows.map(r => r.nome).join(', ');
            } else {
                foodData.alergicos_comuns_nomes = null;
            }
        }

        console.log('Dados retornados:', JSON.stringify(foodData, null, 2)); // Log para debug
        res.json(foodData);
    } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        res.status(500).json({ 
            error: 'Erro interno no servidor',
            details: error.message 
        });
    }
});
//Fim Ajuste #23

//Ajuste #30
// ========== ROTA PARA VERIFICAR PERMISSÃO DE REPORTE ==========
app.get('/api/check-report-permission', authenticateToken, async (req, res) => {
    try {
        const { foodId } = req.query;
        
        if (!foodId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID do alimento não fornecido' 
            });
        }

        // 1. Buscar dados do alimento
        const foodQuery = await pool.query(
            'SELECT user_registro::text, tipo_registro_alimento, error_report FROM tbl_foods WHERE id = $1',
            [foodId]
        );

        if (foodQuery.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Alimento não encontrado' 
            });
        }

        const foodData = foodQuery.rows[0];
        const currentUserId = req.user.userId.toString(); // Convertendo para string para comparação

        // 2. Aplicar validações CORRIGIDAS
        const validations = {
            isNotOwner: foodData.user_registro !== currentUserId, // Agora ambas são strings
            isVerified: foodData.tipo_registro_alimento === 1,
            hasNoReport: foodData.error_report !== true // Verificação explícita
        };

        const isValid = Object.values(validations).every(Boolean);

        if (!isValid) {
            let message = 'Você não tem permissão para reportar este alimento';
            
            if (!validations.isNotOwner) {
                message = 'Você não pode reportar um alimento cadastrado por você mesmo.';
            } else if (!validations.isVerified) {
                message = 'Só é possivel registrar alimentos verificados.';
            } else if (!validations.hasNoReport) {
                message = 'Já existe um reporte aberto para este alimento.';
            }

            return res.json({ 
                success: false, 
                message 
            });
        }

        // 3. Se todas as validações passarem
        res.json({ 
            success: true 
        });

    } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao verificar permissão' 
        });
    }
});
//Fim Ajuste #30

//FIM ALTERAÇÕES DEEPSEEK

app.listen(PORT, async () => {
    console.log(`🚀 Servidor Fit+ rodando na porta ${PORT}`);
    console.log(`🔑 Chave Brevo: ${apiKey.apiKey.substring(0, 6)}...${apiKey.apiKey.substring(apiKey.apiKey.length - 4)}`);
    try {
        const result = await pool.query('SELECT 1+1 AS result');
        console.log('✅ Conexão com o banco de dados OK:', result.rows[0].result === 2 ? 'Sucesso' : 'Erro');
    //Ajuste #22.2
    try{
        const maxIdResult = await pool.query('SELECT MAX(id) FROM tbl_foods');
        const maxId = maxIdResult.rows[0].max || 0;
        await pool.query(`SELECT setval('tbl_foods_id_seq', ${maxId + 1}, true)`);
        console.log(`✅ Sequence ajustada para: ${maxId + 1}`);
    } catch (seqError) {
        console.error('⚠️ Aviso: Não foi possível ajustar a sequence:', seqError.message);
            // Não encerra o servidor pois pode ser apenas um aviso
    }
    //Fim Ajuste #22.2
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        process.exit(1); // Encerra o servidor se não conseguir conectar ao banco
    }
});