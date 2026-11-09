const express = require('express');
const router = express.Router();
const previsaoService = require('../services/previsao.service');

// GET /api/previsao/ruptura - Prevê quando produtos vão zerar
router.get('/ruptura', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    const previsoes = await previsaoService.preverRuptura(dias);
    res.json(previsoes);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/previsao/alertas - Gera alertas preditivos
router.post('/alertas', async (req, res) => {
  try {
    const resultado = await previsaoService.gerarAlertasPreditivos();
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/previsao/relatorio - Relatório completo
router.get('/relatorio', async (req, res) => {
  try {
    const relatorio = await previsaoService.relatorioPrevisao();
    res.json(relatorio);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;