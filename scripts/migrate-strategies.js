const { Pool } = require('pg');
const STRATEGIES = [
  { name: "Padrão (4)(1)(9) - Gêmeos", nums: [1, 4, 9, 11, 13, 14, 16, 18, 19, 20, 21, 22, 27, 31, 33, 36], color: "#3b82f6" },
  { name: "Padrão (8)(3)(0) - Espelhos", nums: [0, 3, 8, 10, 12, 13, 17, 18, 21, 22, 23, 25, 26, 28, 30, 31, 32], color: "#9333ea" },
  { name: "Padrão de Juntos", nums: [0, 1, 3, 7, 8, 10, 11, 13, 14, 17, 18, 20, 23, 25, 26, 29, 30, 34, 36], color: "#ec4899" },
  { name: "Padrão de Saída Órfã", nums: [0, 1, 2, 6, 9, 13, 14, 16, 17, 18, 20, 22, 25, 27, 31, 33, 34], color: "#06b6d4" },
  { name: "Padrão Exato/Disfarçados Juntos", nums: [0, 11, 14, 15, 16, 17, 18, 24, 25, 29, 30, 31, 32, 33, 34], color: "#22c55e" },
  { name: "Padrão Desenho", nums: [0, 1, 5, 9, 11, 12, 13, 14, 16, 19, 22, 23, 26, 27, 30, 32, 34], color: "#f97316" },
  { name: "Disfarçado 1", nums: [1, 2, 4, 5, 8, 10, 11, 12, 15, 19, 20, 21, 23, 28, 30, 33], color: "#facc15" },
  { name: "Disfarçado 2", nums: [0, 4, 7, 9, 11, 14, 13, 18, 19, 20, 21, 22, 25, 27, 29], color: "#f472b6" },
  { name: "Disfarçado 3", nums: [0, 6, 8, 11, 14, 10, 13, 15, 18, 20, 23, 22, 27, 29], color: "#fb7185" },
];

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("Iniciando migração de estratégias...");
    
    // Criar tabela se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS strategies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        nums INTEGER[] NOT NULL,
        color TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Verificar se já existem estratégias
    const { rows } = await client.query('SELECT COUNT(*) FROM strategies');
    if (parseInt(rows[0].count) === 0) {
      for (const s of STRATEGIES) {
        await client.query(
          'INSERT INTO strategies (name, nums, color) VALUES ($1, $2, $3)',
          [s.name, s.nums, s.color]
        );
        console.log(`Estratégia inserida: ${s.name}`);
      }
      console.log("Migração concluída com sucesso!");
    } else {
      console.log("A tabela de estratégias já contém dados. Ignorando seed.");
    }
  } catch (err) {
    console.error("Erro na migração:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
