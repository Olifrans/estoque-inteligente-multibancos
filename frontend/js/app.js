/**
 * ============================================================
 *  SISTEMA INTELIGENTE DE GESTÃO DE ESTOQUE - Frontend
 * ============================================================
 */

const API = '/api';
let dbAtivo = 'mongodb';
let produtosCache = [];

// ============================================================
//  INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Sistema inicializado');
  inicializarNavegacao();
  inicializarEventos();
  verificarHealth();
  atualizarDateTime();
  setInterval(atualizarDateTime, 60000);
  carregarDashboard();
});

function inicializarNavegacao() {
  console.log('📋 Inicializando navegação...');
  
  const botoes = document.querySelectorAll('.nav-item[data-tab]');
  console.log(`🔘 Encontrados ${botoes.length} botões de navegação`);
  
  botoes.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const tabName = this.getAttribute('data-tab');
      console.log(`🖱️ Clique detectado: ${tabName}`);
      switchTab(tabName);
    });
  });

  const dbSelect = document.getElementById('dbSelect');
  if (dbSelect) {
    dbSelect.addEventListener('change', e => {
      dbAtivo = e.target.value;
      console.log(`🔄 Banco alterado para: ${dbAtivo}`);
      verificarHealth();
      const tabAtiva = document.querySelector('.tab-content.active');
      if (tabAtiva) {
        const tabId = tabAtiva.id.replace('tab-', '');
        if (tabId === 'produtos') carregarProdutos();
        if (tabId === 'dashboard') carregarDashboard();
        if (tabId === 'movimentacoes') {
          carregarProdutosSelect();
          carregarMovimentacoes();
        }
      }
    });
  }
}

function switchTab(tabName) {
  console.log(`📂 Trocando para aba: ${tabName}`);
  
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

  const btn = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
  if (btn) {
    btn.classList.add('active');
    console.log(`✅ Botão ativado: ${tabName}`);
  }

  const tab = document.getElementById(`tab-${tabName}`);
  if (tab) {
    tab.classList.add('active');
    console.log(`✅ Seção ativada: tab-${tabName}`);
  }

  const titulos = {
    dashboard: ['Dashboard', 'Visão geral do sistema'],
    produtos: ['Produtos', 'Gerenciamento de produtos'],
    movimentacoes: ['Movimentações', 'Entradas e saídas de estoque'],
    kv: ['Key-Value Store', 'Aula 12 - Modelo chave-valor'],
    graph: ['Grafo', 'Aula 11 - Modelo orientado a grafos'],
    content: ['Content Store', 'Aula 13 - Modelo orientado a conteúdo'],
    backup: ['Backup & Restore', 'Aula 14 - Segurança de dados'],
    previsao: ['Previsão IA', 'Análise preditiva de estoque'],
    migracao: ['Migração', 'Aula 16 - Migração entre bancos']
  };

  const [titulo, subtitulo] = titulos[tabName] || ['Sistema', ''];
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  if (pageTitle) pageTitle.textContent = titulo;
  if (pageSubtitle) pageSubtitle.textContent = subtitulo;

  if (tabName === 'produtos') carregarProdutos();
  if (tabName === 'dashboard') carregarDashboard();
  if (tabName === 'movimentacoes') {
    carregarProdutosSelect();
    carregarMovimentacoes();
  }
}

function inicializarEventos() {
  const formProduto = document.getElementById('formProduto');
  if (formProduto) {
    formProduto.addEventListener('submit', async (e) => {
      e.preventDefault();
      await salvarProduto();
    });
  }
  
  const formEntrada = document.getElementById('formEntrada');
  if (formEntrada) {
    formEntrada.addEventListener('submit', registrarEntrada);
  }
  
  const formSaida = document.getElementById('formSaida');
  if (formSaida) {
    formSaida.addEventListener('submit', registrarSaida);
  }
  
  const saidaProduto = document.getElementById('saidaProduto');
  if (saidaProduto) {
    saidaProduto.addEventListener('change', (e) => {
      const option = e.target.options[e.target.selectedIndex];
      const qtd = option.getAttribute('data-qtd');
      const info = document.getElementById('saidaEstoqueAtual');
      if (info && qtd) {
        info.textContent = `Estoque atual: ${qtd} unidades`;
      }
    });
  }
}

// ============================================================
//  API CALLS
// ============================================================

async function api(path, opts = {}) {
  const sep = path.includes('?') ? '&' : '?';
  const url = API + path + sep + 'db=' + dbAtivo;
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.erro || 'Erro na requisição');
  }
  return r.json();
}

async function verificarHealth() {
  try {
    const r = await fetch(API + '/health');
    const data = await r.json();
    const badge = document.getElementById('healthStatus');
    if (badge) {
      const statusDb = data.databases[dbAtivo];
      const isOk = statusDb === 'ok';
      badge.className = `health-badge ${isOk ? 'ok' : 'error'}`;
      const healthText = badge.querySelector('.health-text');
      if (healthText) healthText.textContent = `${dbAtivo}: ${isOk ? 'Online' : 'Offline'}`;
    }
  } catch (e) {
    console.error('Erro health check:', e);
  }
}

function atualizarDateTime() {
  const now = new Date();
  const options = { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' };
  const datetimeEl = document.getElementById('datetime');
  if (datetimeEl) datetimeEl.textContent = now.toLocaleString('pt-BR', options);
}

// ============================================================
//  DASHBOARD
// ============================================================

async function carregarDashboard() {
  try {
    const produtos = await api('/produtos');
    produtosCache = produtos;

    const total = produtos.length;
    const valorTotal = produtos.reduce((s, p) => s + (p.preco * p.quantidade), 0);
    const estoqueBaixo = produtos.filter(p => p.quantidade > 0 && p.quantidade <= (p.estoque_minimo || 10)).length;
    const estoqueZerado = produtos.filter(p => p.quantidade === 0).length;

    const el1 = document.getElementById('statTotalProdutos');
    const el2 = document.getElementById('statValorEstoque');
    const el3 = document.getElementById('statEstoqueBaixo');
    const el4 = document.getElementById('statEstoqueZerado');

    if (el1) el1.textContent = total;
    if (el2) el2.textContent = `R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (el3) el3.textContent = estoqueBaixo;
    if (el4) el4.textContent = estoqueZerado;

    const categorias = {};
    produtos.forEach(p => {
      const cat = p.categoria || 'Sem categoria';
      categorias[cat] = (categorias[cat] || 0) + 1;
    });

    const catHtml = Object.entries(categorias).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
      const pct = (count / total * 100).toFixed(0);
      return `
        <div class="categoria-item">
          <div class="categoria-info">
            <span class="categoria-nome">${cat}</span>
            <span class="categoria-count">${count} produtos</span>
          </div>
          <div class="categoria-bar">
            <div class="categoria-fill" style="width: ${pct}%"></div>
          </div>
        </div>`;
    }).join('');

    const catChart = document.getElementById('categoriasChart');
    if (catChart) catChart.innerHTML = catHtml || '<p class="empty-state">Nenhum produto cadastrado</p>';

    try {
      const alertas = await api('/estoque/alertas?resolvidos=false');
      const alertasDiv = document.getElementById('alertasDashboard');
      if (alertasDiv && alertas.length) {
        alertasDiv.innerHTML = alertas.slice(0, 5).map(a => `
          <div class="alerta-item">
            <span class="alerta-icon">⚠️</span>
            <div class="alerta-info">
              <strong>${a.produtoNome || 'Produto'}</strong>
              <span>Estoque: ${a.quantidadeAtual} (mín: ${a.estoqueMinimo})</span>
            </div>
          </div>`).join('');
      }
    } catch (e) { console.log('Alertas não carregados:', e.message); }

  } catch (e) { console.error('Erro ao carregar dashboard:', e); }
}

// ============================================================
//  PRODUTOS
// ============================================================

async function carregarProdutos() {
  try {
    produtosCache = await api('/produtos');
    renderizarProdutos(produtosCache);
  } catch (e) { showToast('Erro ao carregar produtos: ' + e.message, 'error'); }
}

function renderizarProdutos(produtos) {
  const tbody = document.querySelector('#tabelaProdutos tbody');
  if (!tbody) return;
  if (!produtos.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhum produto cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = produtos.map(p => {
    const qtd = p.quantidade || 0;
    const min = p.estoque_minimo || 10;
    let statusClass = 'status-ok', statusText = 'OK';
    if (qtd === 0) { statusClass = 'status-zero'; statusText = 'Zerado'; }
    else if (qtd <= min / 2) { statusClass = 'status-critical'; statusText = 'Crítico'; }
    else if (qtd <= min) { statusClass = 'status-low'; statusText = 'Baixo'; }

    return `
      <tr>
        <td><strong>${p.codigo}</strong></td>
        <td>${p.nome}</td>
        <td>${p.categoria || '-'}</td>
        <td>R$ ${Number(p.preco).toFixed(2)}</td>
        <td>${qtd}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${p.fornecedor || '-'}</td>
        <td><button class="btn-icon" onclick="excluirProduto('${p._id || p.id}')" title="Excluir">🗑️</button></td>
      </tr>`;
  }).join('');
}

async function salvarProduto() {
  const form = document.getElementById('formProduto');
  if (!form) return;
  const fd = new FormData(form);
  const dados = Object.fromEntries(fd);
  dados.preco = parseFloat(dados.preco);
  dados.quantidade = parseInt(dados.quantidade);

  try {
    await api('/produtos', { method: 'POST', body: JSON.stringify(dados) });
    showToast('✅ Produto salvo com sucesso!', 'success');
    form.reset();
    carregarProdutos();
  } catch (e) { showToast('❌ Erro: ' + e.message, 'error'); }
}

async function excluirProduto(id) {
  if (!confirm('Confirma a exclusão deste produto?')) return;
  try {
    await api('/produtos/' + id, { method: 'DELETE' });
    showToast('🗑️ Produto excluído', 'success');
    carregarProdutos();
  } catch (e) { showToast('❌ Erro: ' + e.message, 'error'); }
}

function filtrarProdutos() {
  const input = document.getElementById('searchProdutos');
  if (!input) return;
  const termo = input.value.toLowerCase();
  const filtrados = produtosCache.filter(p =>
    p.nome.toLowerCase().includes(termo) || p.codigo.toLowerCase().includes(termo) || (p.categoria || '').toLowerCase().includes(termo)
  );
  renderizarProdutos(filtrados);
}

function toggleForm(formId) {
  const form = document.getElementById(formId);
  const btn = document.getElementById('formToggleText');
  if (form && btn) {
    form.classList.toggle('hidden');
    btn.textContent = form.classList.contains('hidden') ? 'Expandir' : 'Recolher';
  }
}

// ============================================================
//  MOVIMENTAÇÕES
// ============================================================

async function carregarProdutosSelect() {
  try {
    const produtos = await api('/produtos');
    const entradaSelect = document.getElementById('entradaProduto');
    const saidaSelect = document.getElementById('saidaProduto');

    if (entradaSelect) {
      entradaSelect.innerHTML = '<option value="">Selecione...</option>' +
        produtos.map(p => `<option value="${p._id || p.id}" data-qtd="${p.quantidade}">${p.codigo} - ${p.nome} (Estoque: ${p.quantidade})</option>`).join('');
    }
    if (saidaSelect) {
      saidaSelect.innerHTML = '<option value="">Selecione...</option>' +
        produtos.map(p => `<option value="${p._id || p.id}" data-qtd="${p.quantidade}">${p.codigo} - ${p.nome} (Estoque: ${p.quantidade})</option>`).join('');
    }
  } catch (e) { console.error('Erro ao carregar produtos:', e); }
}

async function registrarEntrada(e) {
  e.preventDefault();
  const produtoId = document.getElementById('entradaProduto').value;
  const quantidade = parseInt(document.getElementById('entradaQtd').value);
  const motivo = document.getElementById('entradaMotivo').value;

  try {
    await api('/estoque/entrada', { method: 'POST', body: JSON.stringify({ produtoId, quantidade, motivo, usuario: 'operador' }) });
    showToast('✅ Entrada registrada com sucesso!', 'success');
    document.getElementById('formEntrada').reset();
    carregarProdutosSelect();
  } catch (e) { showToast('❌ Erro: ' + e.message, 'error'); }
}

async function registrarSaida(e) {
  e.preventDefault();
  const produtoId = document.getElementById('saidaProduto').value;
  const quantidade = parseInt(document.getElementById('saidaQtd').value);
  const motivo = document.getElementById('saidaMotivo').value;

  try {
    await api('/estoque/saida', { method: 'POST', body: JSON.stringify({ produtoId, quantidade, motivo, usuario: 'operador' }) });
    showToast('✅ Saída registrada com sucesso!', 'success');
    document.getElementById('formSaida').reset();
    carregarProdutosSelect();
  } catch (e) { showToast('❌ Erro: ' + e.message, 'error'); }
}

async function carregarMovimentacoes() {
  try {
    const movimentacoes = await api('/estoque/movimentacoes');
    const tbody = document.querySelector('#tabelaMovimentacoes tbody');
    if (!movimentacoes.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma movimentação</td></tr>';
      return;
    }
    tbody.innerHTML = movimentacoes.map(m => {
      const data = new Date(m.dataMovimento || m.data_movimento).toLocaleString('pt-BR');
      const tipoClass = m.tipo === 'entrada' ? 'status-ok' : 'status-low';
      return `
        <tr>
          <td>${data}</td>
          <td><span class="status-badge ${tipoClass}">${m.tipo}</span></td>
          <td>${m.produtoNome || 'Produto'}</td>
          <td>${m.quantidade}</td>
          <td>${m.motivo || '-'}</td>
          <td>${m.usuario || '-'}</td>
        </tr>`;
    }).join('');
  } catch (e) { console.error('Erro ao carregar movimentações:', e); }
}

// ============================================================
//  NO-SQL EMULATORS & UTILS
// ============================================================

async function kvSet() {
  try {
    const chave = document.getElementById('kvChave').value;
    const valor = document.getElementById('kvValor').value;
    await fetch(API + '/nosql/kv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave, valor }) });
    document.getElementById('kvResult').textContent = `✅ Chave "${chave}" salva com sucesso!`;
    showToast('✅ Valor salvo no Key-Value Store', 'success');
  } catch (e) { document.getElementById('kvResult').textContent = '❌ Erro: ' + e.message; }
}

async function kvGet() {
  try {
    const chave = document.getElementById('kvChave').value;
    const r = await fetch(API + '/nosql/kv/' + chave);
    const data = await r.json();
    document.getElementById('kvResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) { document.getElementById('kvResult').textContent = '❌ Erro: ' + e.message; }
}

async function addEdge() {
  try {
    const origem = document.getElementById('gOrigem').value;
    const destino = document.getElementById('gDestino').value;
    const rotulo = document.getElementById('gRotulo').value;
    await fetch(API + '/nosql/graph/edge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origem, destino, rotulo }) });
    document.getElementById('gResult').textContent = `✅ Aresta criada: ${origem} → ${destino} (${rotulo})`;
    showToast('✅ Aresta criada no grafo', 'success');
  } catch (e) { document.getElementById('gResult').textContent = '❌ Erro: ' + e.message; }
}

async function neighbors() {
  try {
    const origem = document.getElementById('gOrigem').value;
    const r = await fetch(API + '/nosql/graph/neighbors/' + origem);
    const data = await r.json();
    document.getElementById('gResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) { document.getElementById('gResult').textContent = '❌ Erro: ' + e.message; }
}

async function path() {
  try {
    const origem = document.getElementById('gOrigem').value;
    const destino = document.getElementById('gDestino').value;
    const r = await fetch(API + `/nosql/graph/path/${origem}/${destino}`);
    const data = await r.json();
    document.getElementById('gResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) { document.getElementById('gResult').textContent = '❌ Erro: ' + e.message; }
}

async function contentSave() {
  try {
    const titulo = document.getElementById('cTitulo').value;
    const corpo = document.getElementById('cCorpo').value;
    const tags = document.getElementById('cTags').value.split(',').map(t => t.trim()).filter(t => t);
    const r = await fetch(API + '/nosql/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo, corpo, tags }) });
    const data = await r.json();
    document.getElementById('cResult').textContent = `✅ Conteúdo salvo! ID: ${JSON.stringify(data)}`;
    showToast('✅ Conteúdo salvo', 'success');
  } catch (e) { document.getElementById('cResult').textContent = '❌ Erro: ' + e.message; }
}

async function contentSearch() {
  try {
    const tag = document.getElementById('cBusca').value;
    const r = await fetch(API + '/nosql/content/tag/' + tag);
    const data = await r.json();
    document.getElementById('cResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) { document.getElementById('cResult').textContent = '❌ Erro: ' + e.message; }
}

async function backupMongo() {
  try {
    const r = await fetch(API + '/nosql/backup/mongo', { method: 'POST' });
    const data = await r.json();
    document.getElementById('bkResult').textContent = JSON.stringify(data, null, 2);
    showToast('✅ Backup MongoDB gerado!', 'success');
  } catch (e) { document.getElementById('bkResult').textContent = '❌ Erro: ' + e.message; }
}

async function backupSS() {
  try {
    const r = await fetch(API + '/nosql/backup/sqlserver', { method: 'POST' });
    const data = await r.json();
    document.getElementById('bkResult').textContent = JSON.stringify(data, null, 2);
    showToast('✅ Backup SQL Server gerado!', 'success');
  } catch (e) { document.getElementById('bkResult').textContent = '❌ Erro: ' + e.message; }
}

async function backupViews() {
  try {
    const r = await fetch(API + '/nosql/backup/views');
    const data = await r.json();
    document.getElementById('bkResult').textContent = JSON.stringify(data, null, 2);
    showToast('✅ Snapshot de views capturado!', 'success');
  } catch (e) { document.getElementById('bkResult').textContent = '❌ Erro: ' + e.message; }
}

async function migrar(tipo) {
  try {
    const r = await fetch(API + '/nosql/migrar/' + tipo, { method: 'POST' });
    const data = await r.json();
    document.getElementById('mgResult').textContent = JSON.stringify(data, null, 2);
    showToast(`✅ Migração ${tipo} concluída!`, 'success');
  } catch (e) { document.getElementById('mgResult').textContent = '❌ Erro: ' + e.message; }
}

async function gerarPrevisao() {
  try {
    showToast('🧠 Analisando histórico...', 'success');
    const r = await fetch(API + '/previsao/relatorio?db=' + dbAtivo);
    const data = await r.json();
    
    const resumo = document.getElementById('previsaoResumo');
    if (resumo) resumo.style.display = 'grid';
    
    const el1 = document.getElementById('prevCriticos');
    const el2 = document.getElementById('prevAltos');
    const el3 = document.getElementById('prevTotal');
    const el4 = document.getElementById('prevInvestimento');
    
    if (el1) el1.textContent = data.resumo.criticos;
    if (el2) el2.textContent = data.resumo.altos;
    if (el3) el3.textContent = data.resumo.totalProdutos;
    if (el4) el4.textContent = 'R$ ' + data.resumo.valorTotalSugestaoCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    
    const previsoesFormatadas = data.previsoes.map(p => ({
      produto: p.produtoNome, codigo: p.produtoCodigo, estoque_atual: p.estoqueAtual,
      consumo_diario: p.consumoMedioDiario + ' un/dia',
      dias_para_zerar: p.diasParaZerar === 999 ? '∞ (sem consumo)' : p.diasParaZerar + ' dias',
      sugestao_compra: p.sugestaoCompra + ' unidades', urgencia: p.urgencia.toUpperCase()
    }));
    
    const result = document.getElementById('previsaoResult');
    if (result) result.textContent = JSON.stringify(previsoesFormatadas, null, 2);
    showToast(`✅ Previsão concluída! ${data.resumo.criticos} críticos`, 'success');
  } catch (e) {
    const result = document.getElementById('previsaoResult');
    if (result) result.textContent = '❌ Erro: ' + e.message;
    showToast('Erro ao gerar previsão', 'error');
  }
}

async function gerarAlertasPreditivos() {
  try {
    const r = await fetch(API + '/previsao/alertas?db=' + dbAtivo, { method: 'POST' });
    const data = await r.json();
    showToast(`⚠️ ${data.totalAlertas} alertas gerados!`, 'warning');
    const result = document.getElementById('previsaoResult');
    if (result) result.textContent = 'Alertas Preditivos:\n' + JSON.stringify(data, null, 2);
  } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

function showToast(mensagem, tipo = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  const icon = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : '⚠️';
  toast.innerHTML = `<span style="font-size:1.2rem">${icon}</span><span>${mensagem}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// CSS adicional injetado
const styleExtra = document.createElement('style');
styleExtra.textContent = `
  .categoria-item { margin-bottom: 1rem; }
  .categoria-info { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
  .categoria-nome { font-weight: 600; color: var(--gray-700); }
  .categoria-count { color: var(--gray-500); font-size: 0.85rem; }
  .categoria-bar { height: 8px; background: var(--gray-100); border-radius: var(--radius-full); overflow: hidden; }
  .categoria-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius: var(--radius-full); transition: width 0.5s ease; }
  .alerta-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--warning-bg); border-radius: var(--radius); margin-bottom: 0.5rem; }
  .alerta-icon { font-size: 1.25rem; }
  .alerta-info { display: flex; flex-direction: column; }
  .alerta-info strong { font-size: 0.9rem; color: var(--gray-800); }
  .alerta-info span { font-size: 0.8rem; color: var(--gray-600); }
  .previsao-actions { display: flex; gap: 1rem; margin-bottom: 1rem; }
  .previsao-actions button { flex: 1; padding: 1rem; font-size: 1rem; }
`;
document.head.appendChild(styleExtra);