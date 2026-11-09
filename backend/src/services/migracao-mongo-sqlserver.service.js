/**
 * Serviço de Migração: MongoDB → SQL Server
 * Aula 16 - Migração de bases NoSQL para relacionais
 */

const { db } = require('../config/mongodb');
const { connect, sql } = require('../config/sqlserver');

class MigracaoMongoSQLServerService {
  async migrar() {
    try {
      const database = await db();
      const pool = await connect();

      // Busca todos os produtos do MongoDB
      const produtosMongo = await database.collection('produtos').find({}).toArray();

      let migrados = 0;

      for (const produto of produtosMongo) {
        // Prepara os dados para o SQL Server
        const dados = {
          codigo: produto.codigo,
          nome: produto.nome,
          descricao: produto.descricao || null,
          categoria: produto.categoria || null,
          preco: parseFloat(produto.preco) || 0,
          custo: parseFloat(produto.custo) || 0,
          quantidade: parseInt(produto.quantidade) || 0,
          estoque_minimo: parseInt(produto.estoque_minimo) || 10,
          unidade: produto.unidade || 'UN',
          fornecedor: produto.fornecedor || null,
          ativo: 1,
          created_at: new Date()
        };

        // Verifica se já existe
        const existente = await pool.request()
          .input('codigo', sql.VarChar(50), dados.codigo)
          .query('SELECT id FROM Produtos WHERE codigo = @codigo');

        if (existente.recordset.length === 0) {
          // Insert no SQL Server
          await pool.request()
            .input('codigo', sql.VarChar(50), dados.codigo)
            .input('nome', sql.VarChar(200), dados.nome)
            .input('descricao', sql.VarChar(500), dados.descricao)
            .input('categoria', sql.VarChar(100), dados.categoria)
            .input('preco', sql.Decimal(10, 2), dados.preco)
            .input('custo', sql.Decimal(10, 2), dados.custo)
            .input('quantidade', sql.Int, dados.quantidade)
            .input('estoque_minimo', sql.Int, dados.estoque_minimo)
            .input('unidade', sql.VarChar(20), dados.unidade)
            .input('fornecedor', sql.VarChar(200), dados.fornecedor)
            .input('ativo', sql.Bit, dados.ativo)
            .query(`INSERT INTO Produtos 
                    (codigo, nome, descricao, categoria, preco, custo, quantidade, 
                     estoque_minimo, unidade, fornecedor, ativo, created_at)
                    VALUES 
                    (@codigo, @nome, @descricao, @categoria, @preco, @custo, @quantidade,
                     @estoque_minimo, @unidade, @fornecedor, @ativo, @created_at)`);
          
          migrados++;
        }
      }

      return { migrados, total: produtosMongo.length };
    } catch (err) {
      console.error('Erro na migração MongoDB → SQL Server:', err.message);
      throw err;
    }
  }
}

module.exports = new MigracaoMongoSQLServerService();