// server.js adaptado para PostgreSQL (Neon)

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

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

if (!apiKey.apiKey || apiKey.apiKey.length < 50) {
    console.error('ERRO CRÍTICO: Chave API do Brevo inválida ou não configurada!');
    process.exit(1);
}

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

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

        return res.json({ success: true, message: 'Login realizado com sucesso' });
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

app.listen(PORT, async () => {
    console.log(`🚀 Servidor Fit+ rodando na porta ${PORT}`);
    console.log(`🔑 Chave Brevo: ${apiKey.apiKey.substring(0, 6)}...${apiKey.apiKey.substring(apiKey.apiKey.length - 4)}`);
    try {
        const result = await pool.query('SELECT 1+1 AS result');
        console.log('✅ Conexão com o banco de dados OK:', result.rows[0].result === 2 ? 'Sucesso' : 'Erro');
    } catch (error) {
        console.error('❌ Falha na conexão com o banco:', error);
    }
});