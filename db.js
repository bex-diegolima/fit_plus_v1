// Configuração do banco de dados PostgreSQL
const { Pool } = require('pg');

// Configurações de conexão
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_d1meWpC4sLvR@ep-divine-wave-achmpwge-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: {
        rejectUnauthorized: false // Necessário para conectar ao Neon
    }
});

// Função para testar a conexão
async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('Conexão com o banco de dados estabelecida com sucesso! Hora atual:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        return false;
    }
}

// Exporta o pool de conexões e a função de teste
module.exports = {
    pool,
    testConnection
};
