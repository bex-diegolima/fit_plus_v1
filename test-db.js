// test-db.js
const { pool } = require('./db');

async function testTables() {
  const tables = [
    'tbl_foods',
    'tbl_aux_modo_preparo',
    'tbl_aux_grupo_alimentar',
    'tbl_aux_categoria_nutri',
    'tbl_aux_origem_alimentar',
    'tbl_aux_processamento',
    'tbl_aux_status_register',
    'tbl_aux_verification',
    'tbl_aux_tipo_medida',
    'tbl_aux_alergicos'
  ];

  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
      console.log(`✅ Tabela ${table} acessível.`);
    } catch (error) {
      console.error(`❌ Erro ao acessar ${table}:`, error.message);
    }
  }
  pool.end(); // Encerra a conexão
}

testTables();