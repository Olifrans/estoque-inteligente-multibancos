/**
 * ============================================================
 *  SERVIÇO DE PREVISÃO INTELIGENTE DE ESTOQUE
 *  Usa análise de dados históricos para prever ruptura
 * ============================================================
 */

const { db } = require('../config/mongodb');
const produtoRepo = require('../repositories/produto.repository');

class PrevisaoService {
  /**
   * Analisa todos os produtos e prevê quando vão zerar
   */
  async preverRuptura(diasAnalise = 30) {
    try {
      const database = await db();
      const produtos = await produtoRepo.getRepo('mongodb').listar();
      const previsoes = [];

      for (const produto of produtos) {
        const produtoId = produto._id || produto.id;
        
        // Busca movimentações de saída dos últimos N dias
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasAnalise);
        
        const saidas = await database.collection('movimentacoes')
          .find({
            produtoId: produtoId,
            tipo: 'saida',
            dataMovimento: { $gte: dataLimite }
          })
          .toArray();

        // Calcula velocidade de consumo
        const totalSaidas = saidas.reduce((sum, m) => sum + m.quantidade, 0);
        const consumoMedioDiario = totalSaidas / diasAnalise;
        
        // Prevê dias até zerar
        const estoqueAtual = produto.quantidade || 0;
        const diasParaZerar = consumoMedioDiario > 0 
          ? Math.floor(estoqueAtual / consumoMedioDiario) 
          : 999; // Se não tem consumo, não vai zerar

        // Sugere quantidade de reposição (cobrir 60 dias)
        const sugestaoCompra = consumoMedioDiario > 0 
          ? Math.ceil(consumoMedioDiario * 60) 
          : 0;

        // Classifica urgência
        let urgencia = 'baixa';
        if (diasParaZerar <= 7) urgencia = 'critica';
        else if (diasParaZerar <= 15) urgencia = 'alta';
        else if (diasParaZerar <= 30) urgencia = 'media';

        previsoes.push({
          produtoId,
          produtoCodigo: produto.codigo,
          produtoNome: produto.nome,
          estoqueAtual,
          consumoMedioDiario: parseFloat(consumoMedioDiario.toFixed(2)),
          diasParaZerar,
          sugestaoCompra,
          urgencia,
          dataPrevisao: new Date()
        });
      }

      // Ordena por urgência (mais crítico primeiro)
      const ordemUrgencia = { critica: 0, alta: 1, media: 2, baixa: 3 };
      previsoes.sort((a, b) => ordemUrgencia[a.urgencia] - ordemUrgencia[b.urgencia]);

      return previsoes;
    } catch (err) {
      console.error('Erro ao gerar previsões:', err.message);
      throw err;
    }
  }

  /**
   * Gera alertas preditivos automáticos
   */
  async gerarAlertasPreditivos() {
    try {
      const previsoes = await this.preverRuptura(30);
      const database = await db();
      
      // Filtra apenas produtos com urgência alta ou crítica
      const alertas = previsoes.filter(p => 
        p.urgencia === 'critica' || p.urgencia === 'alta'
      );

      // Salva alertas preditivos
      for (const alerta of alertas) {
        await database.collection('alertas_preditivos').updateOne(
          { produtoId: alerta.produtoId },
          {
            $set: {
              ...alerta,
              tipo: 'preditivo',
              mensagem: `Produto "${alerta.produtoNome}" deve zerar em ${alerta.diasParaZerar} dias. Sugestão: comprar ${alerta.sugestaoCompra} unidades.`,
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
      }

      return {
        totalAlertas: alertas.length,
        criticos: alertas.filter(a => a.urgencia === 'critica').length,
        altos: alertas.filter(a => a.urgencia === 'alta').length
      };
    } catch (err) {
      console.error('Erro ao gerar alertas preditivos:', err.message);
      throw err;
    }
  }

  /**
   * Relatório completo de previsão
   */
  async relatorioPrevisao() {
    const previsoes = await this.preverRuptura(60);
    
    const resumo = {
      totalProdutos: previsoes.length,
      criticos: previsoes.filter(p => p.urgencia === 'critica').length,
      altos: previsoes.filter(p => p.urgencia === 'alta').length,
      medios: previsoes.filter(p => p.urgencia === 'media').length,
      baixos: previsoes.filter(p => p.urgencia === 'baixa').length,
      valorTotalSugestaoCompra: previsoes.reduce((sum, p) => {
        const produto = previsoes.find(x => x.produtoId === p.produtoId);
        return sum + (p.sugestaoCompra * (produto?.preco || 0));
      }, 0)
    };

    return { resumo, previsoes: previsoes.slice(0, 20) };
  }
}

module.exports = new PrevisaoService();