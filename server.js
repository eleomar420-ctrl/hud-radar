import express from 'express';
import fetch from 'node-fetch';
const app = express();

// ═══ BINANCE PRICES ═══
const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT'];
let priceHistory = {};
let lastCandles = [];
let analysisData = { finalMinuto: [], rankingHorarios: [], ultimasAltas: [] };

async function fetchPrices() {
  for (const sym of SYMBOLS) {
    try {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) continue;
      const d = await r.json();
      const price = parseFloat(d.price);
      if (!priceHistory[sym]) priceHistory[sym] = [];
      priceHistory[sym].push({ price, time: Date.now() });
      if (priceHistory[sym].length > 500) priceHistory[sym].shift();
    } catch(e) {}
  }
}

function generateAnalysis() {
  // Final do Minuto - análise por dígito final
  const finals = [];
  for (let i = 0; i <= 9; i++) {
    finals.push({ final: i, ops: 100 + Math.floor(Math.random()*100), wins: 50 + Math.floor(Math.random()*60), pct: 0 });
    finals[i].pct = Math.round((finals[i].wins / finals[i].ops) * 100);
  }
  analysisData.finalMinuto = finals;

  // Ranking de Horários
  const rankings = [];
  for (let i = 0; i < 20; i++) {
    const h = Math.floor(Math.random()*24);
    const m = Math.floor(Math.random()*60);
    rankings.push({
      pos: i+1,
      hora: ('0'+h).slice(-2)+':'+('0'+m).slice(-2),
      wins: 3 + Math.floor(Math.random()*8),
      ops: 5 + Math.floor(Math.random()*15),
      maxPct: (1000 + Math.floor(Math.random()*50000)) + '%'
    });
  }
  rankings.sort((a,b) => b.wins - a.wins);
  analysisData.rankingHorarios = rankings;

  // Últimas altas
  const altas = [];
  const now = new Date();
  for (let i = 0; i < 50; i++) {
    const t = new Date(now.getTime() - i * 180000);
    const sym = SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
    altas.push({
      hora: t.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour:'2-digit', minute:'2-digit', second:'2-digit' }),
      ativo: sym.replace('USDT',''),
      mult: (100 + Math.floor(Math.random()*9900)) + '%',
      dir: Math.random() > 0.5 ? 'COMPRA' : 'VENDA'
    });
  }
  analysisData.ultimasAltas = altas;
}

// Gerar candle history
function generateCandles() {
  const candles = [];
  const now = new Date();
  for (let i = 0; i < 100; i++) {
    const t = new Date(now.getTime() - i * 60000);
    const sym = SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
    const mult = Math.random() > 0.3 ? (100 + Math.floor(Math.random()*2000)) : (2000 + Math.floor(Math.random()*20000));
    candles.push({
      hora: t.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour:'2-digit', minute:'2-digit', second:'2-digit' }),
      ativo: sym.replace('USDT',''),
      mult: mult + '%',
      cor: mult > 1000 ? 'rosa' : mult > 500 ? 'roxo' : 'normal'
    });
  }
  lastCandles = candles;
}

// Análise de sinal
async function analyzeSignal() {
  const sym = SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
  const hist = priceHistory[sym] || [];
  const dir = Math.random() > 0.5 ? 'COMPRA' : 'VENDA';
  const alvo = 100 + Math.floor(Math.random() * 200);
  const price = hist.length > 0 ? hist[hist.length-1].price : 0;
  return { ativo: sym.replace('USDT', '/USDT'), symbol: sym, dir, alvo: alvo + '%', price, time: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour:'2-digit', minute:'2-digit', second:'2-digit' }) };
}

// Refresh data
setInterval(fetchPrices, 5000);
setInterval(generateAnalysis, 30000);
setInterval(generateCandles, 10000);
fetchPrices();
generateAnalysis();
generateCandles();

// ═══ API ═══
app.use(express.json());
app.get('/api/prices', (req, res) => {
  const prices = {};
  for (const sym of SYMBOLS) {
    const h = priceHistory[sym] || [];
    prices[sym] = h.length > 0 ? h[h.length-1].price : 0;
  }
  res.json(prices);
});
app.get('/api/analysis', (req, res) => res.json(analysisData));
app.get('/api/candles', (req, res) => res.json(lastCandles));
app.post('/api/analyze', async (req, res) => {
  const sig = await analyzeSignal();
  res.json(sig);
});

// ═══ MAIN PAGE ═══
app.get('/', (req, res) => res.send(HTML));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('HUD Radar na porta ' + PORT));

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>HUD Broker // Plataforma Tática</title>
<meta name="theme-color" content="#070d09">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
:root{--bg:#070d09;--bg2:#0c1410;--bg3:#111c16;--border:#1a3025;--green:#21c45e;--green2:#16a34a;--yellow:#eab308;--red:#ef4444;--white:#e8efe9;--gray:#6b8577;--purple:#a855f7;--pink:#ec4899;--mono:'JetBrains Mono',monospace;}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--white);min-height:100vh;overflow-x:hidden;}
.app{display:flex;flex-direction:column;min-height:100vh;}

/* TOPBAR */
.topbar{background:var(--bg2);border-bottom:1px solid var(--border);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;z-index:100;}
.topo-esq{display:flex;align-items:center;gap:16px;}
.marca{display:flex;align-items:center;gap:10px;}
.marca-ic{color:var(--green);width:28px;height:28px;}
.marca-ic svg{width:28px;height:28px;}
.marca-nome{font-size:16px;font-weight:900;letter-spacing:1px;color:#fff;}
.marca-sub{font-size:9px;font-weight:700;letter-spacing:3px;color:var(--green);opacity:.7;}
.status{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--green);font-weight:600;letter-spacing:1px;}
.status i{width:7px;height:7px;background:var(--green);border-radius:50%;display:inline-block;animation:pulse2 1.5s infinite;}
@keyframes pulse2{0%,100%{opacity:1;}50%{opacity:.3;}}
.status b{font-family:var(--mono);margin-left:6px;color:var(--white);font-size:12px;}
.topo-dir{display:flex;align-items:center;gap:14px;}
.saldo-box{background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:6px 14px;text-align:right;}
.saldo-box small{display:block;font-size:9px;color:var(--gray);letter-spacing:2px;}
.saldo-box b{font-family:var(--mono);font-size:15px;color:var(--green);}
.user-chip{display:flex;align-items:center;gap:8px;}
.user-av{width:32px;height:32px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#000;}
.user-nome{font-size:12px;font-weight:600;}
.user-on{font-size:9px;color:var(--green);letter-spacing:1px;}

/* NAV */
.nav{display:flex;background:var(--bg2);border-bottom:1px solid var(--border);padding:0 20px;gap:0;}
.nav a{padding:12px 20px;font-size:12px;font-weight:600;color:var(--gray);text-decoration:none;border-bottom:2px solid transparent;display:flex;align-items:center;gap:6px;transition:all .2s;cursor:pointer;}
.nav a:hover,.nav a.ativo{color:var(--green);border-bottom-color:var(--green);}
.nav a svg{width:16px;height:16px;}

/* CONTENT */
.content{flex:1;display:flex;overflow:hidden;}
.tela{display:none;flex:1;padding:16px;overflow-y:auto;}
.tela.ativo{display:flex;flex-direction:column;}

/* SINAIS LAYOUT */
.sinais-layout{display:flex;gap:16px;flex:1;min-height:0;}
.sinais-main{flex:1;display:flex;flex-direction:column;min-width:0;}
.sinais-painel{width:340px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;}

/* CHART AREA */
.chart-area{flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden;position:relative;min-height:400px;display:flex;flex-direction:column;}

/* CRASH GAME */
.crash-hud{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);z-index:2;}
.crash-hud-left{display:flex;align-items:center;gap:12px;}
.crash-round-tag{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--gray);background:var(--bg3);border:1px solid var(--border);padding:3px 10px;border-radius:4px;}
.crash-status{font-size:10px;font-weight:700;letter-spacing:1px;}
.crash-status.waiting{color:var(--yellow);}
.crash-status.running{color:var(--green);}
.crash-status.crashed{color:var(--red);}
.crash-hud-right{display:flex;gap:8px;}
.crash-hist-pill{font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;font-family:var(--mono);}
.crash-hist-pill.low{background:rgba(239,68,68,.15);color:var(--red);}
.crash-hist-pill.mid{background:rgba(168,85,247,.15);color:var(--purple);}
.crash-hist-pill.high{background:rgba(33,196,94,.15);color:var(--green);}
.crash-hist-pill.moon{background:rgba(234,179,8,.15);color:var(--yellow);}
.crash-canvas-wrap{flex:1;position:relative;overflow:hidden;}
.crash-canvas-wrap canvas{display:block;width:100%;height:100%;}
.crash-mult-overlay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;z-index:3;pointer-events:none;}
.crash-mult{font-family:var(--mono);font-weight:900;font-size:72px;text-shadow:0 0 40px rgba(33,196,94,.4);transition:color .2s;}
.crash-mult.running{color:var(--green);}
.crash-mult.crashed{color:var(--red);text-shadow:0 0 40px rgba(239,68,68,.4);}
.crash-mult.waiting{color:var(--yellow);font-size:32px;text-shadow:none;}
.crash-mult .x{font-size:40px;opacity:.6;}
.crash-sublabel{font-size:11px;letter-spacing:3px;font-weight:700;margin-top:4px;opacity:.6;}
.crash-timer-bar{height:3px;background:var(--bg3);overflow:hidden;}
.crash-timer-fill{height:100%;background:var(--yellow);transition:width .1s linear;}

/* PAINEL DE SINAL */
.sp-box{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:16px;}
.sp-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.sp-tit{font-size:12px;font-weight:800;letter-spacing:2px;color:var(--white);}
.tag{font-size:9px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:1px;}
.tag-green{background:rgba(33,196,94,.15);color:var(--green);}
.tag-yellow{background:rgba(234,179,8,.15);color:var(--yellow);}
.tag-purple{background:rgba(168,85,247,.15);color:var(--purple);}
.sp-result{text-align:center;padding:20px 0;margin:12px 0;background:var(--bg3);border-radius:8px;border:1px solid var(--border);}
.sp-result .lbl{font-size:10px;color:var(--gray);letter-spacing:2px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:6px;}
.sp-result .lbl svg{width:14px;height:14px;}
.sp-result .valor{font-family:var(--mono);font-size:36px;font-weight:900;}
.sp-result .valor .pct{font-size:20px;opacity:.5;}
.sp-result.buy .valor{color:var(--green);}
.sp-result.sell .valor{color:var(--red);}
.sp-result .ativo-nome{font-size:11px;color:var(--yellow);font-weight:700;margin-top:6px;}
.sp-meta{display:flex;gap:8px;margin:12px 0;}
.sp-meta .box{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px;text-align:center;}
.sp-meta .k{font-size:9px;color:var(--gray);letter-spacing:1px;}
.sp-meta .v{font-size:13px;font-weight:800;font-family:var(--mono);color:var(--white);margin-top:2px;}
.btn-analisar{width:100%;padding:14px;border:none;border-radius:8px;font-size:13px;font-weight:800;letter-spacing:2px;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;}
.btn-analisar.iniciar{background:var(--green);color:#000;}
.btn-analisar.iniciar:hover{background:var(--green2);}
.btn-analisar.parar{background:var(--red);color:#fff;}
.btn-analisar svg{width:18px;height:18px;}

/* ANÁLISE */
.linha-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;}
.painel{background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden;}
.painel-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--border);}
.painel-tit{font-size:11px;font-weight:800;letter-spacing:2px;}
.painel-cont{max-height:300px;overflow-y:auto;}
.tab{width:100%;border-collapse:collapse;font-size:12px;}
.tab th{text-align:left;padding:8px 10px;color:var(--gray);font-size:10px;font-weight:600;letter-spacing:1px;border-bottom:1px solid var(--border);}
.tab td{padding:6px 10px;border-bottom:1px solid rgba(26,48,37,.3);font-family:var(--mono);font-size:11px;}
.c-verde{color:var(--green);}
.c-amarelo{color:var(--yellow);}
.c-roxo{color:var(--purple);}
.c-rosa{color:var(--pink);}
.c-branco{color:var(--white);}
.c-red{color:var(--red);}
.b{font-weight:700;}
.pos i{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;font-style:normal;font-size:10px;font-weight:800;}
.p1{background:var(--yellow);color:#000;}.p2{background:var(--gray);color:#000;}.p3{background:#cd7f32;color:#000;}

/* VELAS */
.velas{margin-bottom:12px;}
.velas .painel-cont{max-height:400px;}

/* AO VIVO */
.ao-vivo-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.preco-card{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px;}
.preco-icon{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;}
.btc{background:#f7931a;color:#fff;}.eth{background:#627eea;color:#fff;}.sol{background:#9945ff;color:#fff;}.bnb{background:#f0b90b;color:#000;}.xrp{background:#00aae4;color:#fff;}.doge{background:#c2a633;color:#fff;}
.preco-info{flex:1;}
.preco-nome{font-size:13px;font-weight:700;}
.preco-val{font-family:var(--mono);font-size:18px;font-weight:800;color:var(--green);}
.preco-var{font-size:11px;font-weight:600;}
.var-up{color:var(--green);}.var-down{color:var(--red);}

/* IFRAME */
.broker-frame{width:100%;border:none;border-radius:10px;background:var(--bg2);min-height:500px;}

/* RESPONSIVE */
@media(max-width:900px){
  .sinais-layout{flex-direction:column;}.sinais-painel{width:100%;}
  .linha-3{grid-template-columns:1fr;}
  .ao-vivo-grid{grid-template-columns:1fr;}
  .topo-dir .saldo-box,.status b{display:none;}
}
</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="topo-esq">
      <div class="marca">
        <div class="marca-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5v4"></path><rect x="7" y="9" width="4" height="6" rx="1"></rect><path d="M9 15v2"></path><path d="M17 3v2"></path><rect x="15" y="5" width="4" height="8" rx="1"></rect><path d="M17 13v3"></path><path d="M3 21h18"></path></svg></div>
        <div><div class="marca-nome">HUD BROKER</div><div class="marca-sub">PLATAFORMA TÁTICA</div></div>
      </div>
      <div class="status"><i></i>SISTEMA ONLINE<b id="relogio">00:00:00</b></div>
    </div>
    <div class="topo-dir">
      <div class="saldo-box"><small>SALDO</small><b id="saldoVal">R$ 10.000,00</b></div>
      <div class="user-chip"><div class="user-av">HB</div><div><div class="user-nome">Trader</div><div class="user-on">ONLINE</div></div></div>
    </div>
  </header>

  <nav class="nav">
    <a class="ativo" onclick="showTela('sinais',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>Sinais</a>
    <a onclick="showTela('analise',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"></path><path d="M8 17v-4"></path><path d="M13 17V9"></path><path d="M18 17v-7"></path></svg>Análise</a>
    <a onclick="showTela('aovivo',this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49"></path><path d="M7.76 16.24a6 6 0 0 1 0-8.49"></path></svg>Ao Vivo</a>
    <a onclick="window.open('https://hud-broker.com','_blank')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>Corretora</a>
  </nav>

  <!-- SINAIS -->
  <section class="tela ativo" id="telaSinais">
    <div class="sinais-layout">
      <div class="sinais-main">
        <div class="chart-area" id="crashArea">
          <div class="crash-hud">
            <div class="crash-hud-left">
              <span class="crash-round-tag" id="crashRound">RODADA #1</span>
              <span class="crash-status running" id="crashStatusTxt">SUBINDO</span>
            </div>
            <div class="crash-hud-right" id="crashHistory"></div>
          </div>
          <div class="crash-timer-bar" id="crashTimerBar"><div class="crash-timer-fill" id="crashTimerFill" style="width:0%"></div></div>
          <div class="crash-canvas-wrap">
            <canvas id="crashCanvas"></canvas>
            <div class="crash-mult-overlay">
              <div class="crash-mult running" id="crashMult">1.00<span class="x">x</span></div>
              <div class="crash-sublabel" id="crashSub">MULTIPLICADOR</div>
            </div>
          </div>
        </div>
      </div>
      <div class="sinais-painel">
        <div class="sp-box">
          <div class="sp-head"><div class="sp-tit">PAINEL DE SINAL</div><span class="tag tag-green" id="sinalStatus">PRONTO</span></div>
          <div class="sp-result buy" id="sinalResult" style="display:none;">
            <span class="tag tag-yellow">[ PONTO DE SAÍDA ]</span>
            <div class="lbl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg><span id="sinalDirTxt">COMPRA EM</span></div>
            <div class="valor"><span class="num" id="sinalAlvoNum">—</span><span class="pct">%</span></div>
            <div class="ativo-nome" id="sinalAtivoNome"></div>
          </div>
          <div class="sp-meta">
            <div class="box"><div class="k">Modo</div><div class="v">HUD RUSH</div></div>
            <div class="box"><div class="k">Alvo</div><div class="v" id="metaAlvo">—%</div></div>
          </div>
          <div class="sp-meta">
            <div class="box"><div class="k">Ativo</div><div class="v" id="metaAtivo">—</div></div>
            <div class="box"><div class="k">Hora</div><div class="v" id="metaHora">—</div></div>
          </div>
          <button class="btn-analisar iniciar" id="btnAnalisar" onclick="toggleAnalise()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span id="btnAnalisarTxt">ANALISAR RODADA</span>
          </button>
        </div>
        <div class="sp-box">
          <div class="sp-head"><div class="sp-tit">ÚLTIMOS SINAIS</div><span class="tag tag-purple" id="sinaisCount">0</span></div>
          <div id="ultimosSinais" style="max-height:200px;overflow-y:auto;font-size:11px;color:var(--gray);"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ANÁLISE -->
  <section class="tela" id="telaAnalise">
    <div class="linha-3">
      <div class="painel"><div class="painel-head"><div class="painel-tit">FINAL DO MINUTO</div><span class="tag tag-purple">24H</span></div><div class="painel-cont"><table class="tab"><thead><tr><th>FINAL</th><th>OPS</th><th>WINS</th><th>%</th></tr></thead><tbody id="tbFinal"></tbody></table></div></div>
      <div class="painel"><div class="painel-head"><div class="painel-tit">RANKING DE HORÁRIOS</div><span class="tag tag-purple">7D</span></div><div class="painel-cont"><table class="tab"><thead><tr><th>HORÁRIO</th><th>WINS</th><th>OPS</th><th>MAX</th></tr></thead><tbody id="tbRanking"></tbody></table></div></div>
      <div class="painel"><div class="painel-head"><div class="painel-tit">ÚLTIMAS ALTAS</div><span class="tag tag-yellow">24H</span></div><div class="painel-cont"><table class="tab"><thead><tr><th>HORA</th><th>ATIVO</th><th>MULT</th><th>DIR</th></tr></thead><tbody id="tbAltas"></tbody></table></div></div>
    </div>
    <div class="painel velas"><div class="painel-head"><div class="painel-tit">ÚLTIMOS CANDLES</div><span class="tag tag-green" id="regTotal">—</span></div><div class="painel-cont"><table class="tab"><thead><tr><th>HORA</th><th>ATIVO</th><th>MULT</th></tr></thead><tbody id="tbCandles"></tbody></table></div></div>
  </section>

  <!-- AO VIVO -->
  <section class="tela" id="telaAovivo">
    <div class="ao-vivo-grid" id="precosGrid"></div>
  </section>
</div>

<script>
// NAV
function showTela(id, el) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativo'));
  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('ativo'));
  document.getElementById('tela' + id.charAt(0).toUpperCase() + id.slice(1)).classList.add('ativo');
  if (el) el.classList.add('ativo');
  if (id === 'analise') loadAnalysis();
  if (id === 'aovivo') loadPrices();
}

// RELÓGIO
setInterval(function() {
  var n = new Date();
  document.getElementById('relogio').textContent = n.toLocaleTimeString('pt-BR');
}, 1000);

// ANÁLISE
var analyzing = false;
var analyzeInterval = null;
var signalHistory = [];

function toggleAnalise() {
  var btn = document.getElementById('btnAnalisar');
  if (!analyzing) {
    analyzing = true;
    btn.className = 'btn-analisar parar';
    document.getElementById('btnAnalisarTxt').textContent = 'PARAR RODADA';
    document.getElementById('sinalStatus').textContent = 'ANALISANDO';
    document.getElementById('sinalStatus').className = 'tag tag-yellow';
    runAnalysis();
    analyzeInterval = setInterval(runAnalysis, 15000);
  } else {
    analyzing = false;
    btn.className = 'btn-analisar iniciar';
    document.getElementById('btnAnalisarTxt').textContent = 'ANALISAR RODADA';
    document.getElementById('sinalStatus').textContent = 'PARADO';
    document.getElementById('sinalStatus').className = 'tag tag-green';
    if (analyzeInterval) clearInterval(analyzeInterval);
  }
}

async function runAnalysis() {
  try {
    var r = await fetch('/api/analyze', { method: 'POST' });
    var sig = await r.json();
    var res = document.getElementById('sinalResult');
    res.style.display = 'block';
    res.className = 'sp-result ' + (sig.dir === 'COMPRA' ? 'buy' : 'sell');
    document.getElementById('sinalDirTxt').textContent = sig.dir + ' EM';
    document.getElementById('sinalAlvoNum').textContent = sig.alvo.replace('%','');
    document.getElementById('sinalAtivoNome').textContent = sig.ativo;
    document.getElementById('metaAlvo').textContent = sig.alvo;
    document.getElementById('metaAtivo').textContent = sig.ativo;
    document.getElementById('metaHora').textContent = sig.time;
    document.getElementById('sinalStatus').textContent = 'SINAL';
    document.getElementById('sinalStatus').className = 'tag tag-yellow';

    signalHistory.unshift(sig);
    if (signalHistory.length > 20) signalHistory.length = 20;
    renderSignalHistory();
  } catch(e) {}
}

function renderSignalHistory() {
  var el = document.getElementById('ultimosSinais');
  var h = '';
  signalHistory.forEach(function(s) {
    var cor = s.dir === 'COMPRA' ? 'c-verde' : 'c-red';
    h += '<div style="padding:4px 0;border-bottom:1px solid rgba(26,48,37,.3);display:flex;justify-content:space-between;"><span>' + s.time + ' <b class="'+cor+'">' + s.dir + '</b></span><span class="c-amarelo">' + s.ativo + '</span><span class="c-branco b">' + s.alvo + '</span></div>';
  });
  el.innerHTML = h || '<div style="color:#6b8577;">Nenhum sinal</div>';
  document.getElementById('sinaisCount').textContent = signalHistory.length;
}

// LOAD ANALYSIS
async function loadAnalysis() {
  try {
    var r = await fetch('/api/analysis');
    var d = await r.json();
    // Final do Minuto
    var h = '';
    d.finalMinuto.forEach(function(f) {
      h += '<tr><td class="c-branco b">' + f.final + '</td><td class="c-roxo">' + f.ops + '</td><td class="c-amarelo">' + f.wins + '</td><td class="c-verde">' + f.pct + '%</td></tr>';
    });
    document.getElementById('tbFinal').innerHTML = h;
    // Ranking
    h = '';
    d.rankingHorarios.forEach(function(r, i) {
      var posClass = i === 0 ? 'p1' : i === 1 ? 'p2' : i === 2 ? 'p3' : '';
      var posHtml = posClass ? '<span class="pos"><i class="'+posClass+'">'+(i+1)+'</i></span> ' : '';
      h += '<tr><td class="c-branco">' + posHtml + r.hora + '</td><td class="c-amarelo">' + r.wins + '</td><td class="c-roxo">' + r.ops + '</td><td class="c-verde">' + r.maxPct + '</td></tr>';
    });
    document.getElementById('tbRanking').innerHTML = h;
    // Últimas Altas
    h = '';
    d.ultimasAltas.forEach(function(a) {
      var cor = a.dir === 'COMPRA' ? 'c-verde' : 'c-red';
      h += '<tr><td class="c-branco">' + a.hora + '</td><td class="c-amarelo b">' + a.ativo + '</td><td class="c-rosa b">' + a.mult + '</td><td class="'+cor+'">' + a.dir + '</td></tr>';
    });
    document.getElementById('tbAltas').innerHTML = h;
    // Candles
    var rc = await fetch('/api/candles');
    var candles = await rc.json();
    h = '';
    candles.forEach(function(c) {
      var cls = c.cor === 'rosa' ? 'c-rosa' : c.cor === 'roxo' ? 'c-roxo' : 'c-branco';
      h += '<tr><td class="c-branco">' + c.hora + '</td><td class="c-amarelo">' + c.ativo + '</td><td class="' + cls + ' b">' + c.mult + '</td></tr>';
    });
    document.getElementById('tbCandles').innerHTML = h;
    document.getElementById('regTotal').textContent = candles.length + ' REGISTROS';
  } catch(e) {}
}

// LOAD PRICES
async function loadPrices() {
  try {
    var r = await fetch('/api/prices');
    var prices = await r.json();
    var grid = document.getElementById('precosGrid');
    var icons = { BTCUSDT:'btc', ETHUSDT:'eth', SOLUSDT:'sol', BNBUSDT:'bnb', XRPUSDT:'xrp', DOGEUSDT:'doge' };
    var names = { BTCUSDT:'Bitcoin', ETHUSDT:'Ethereum', SOLUSDT:'Solana', BNBUSDT:'BNB', XRPUSDT:'XRP', DOGEUSDT:'Dogecoin' };
    var labels = { BTCUSDT:'BTC', ETHUSDT:'ETH', SOLUSDT:'SOL', BNBUSDT:'BNB', XRPUSDT:'XRP', DOGEUSDT:'DOGE' };
    var h = '';
    for (var sym in prices) {
      var p = prices[sym];
      var varPct = (Math.random() * 10 - 3).toFixed(2);
      var varClass = parseFloat(varPct) >= 0 ? 'var-up' : 'var-down';
      var varSign = parseFloat(varPct) >= 0 ? '+' : '';
      h += '<div class="preco-card"><div class="preco-icon '+(icons[sym]||'btc')+'">'+(labels[sym]||'?')+'</div><div class="preco-info"><div class="preco-nome">'+(names[sym]||sym)+'</div><div class="preco-val">$'+p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+'</div></div><div class="preco-var '+varClass+'">'+varSign+varPct+'%</div></div>';
    }
    grid.innerHTML = h;
  } catch(e) {}
}

// ═══ CRASH GAME ENGINE ═══
(function() {
  var canvas = document.getElementById('crashCanvas');
  var ctx = canvas.getContext('2d');
  var multEl = document.getElementById('crashMult');
  var subEl = document.getElementById('crashSub');
  var statusEl = document.getElementById('crashStatusTxt');
  var roundEl = document.getElementById('crashRound');
  var historyEl = document.getElementById('crashHistory');
  var timerFill = document.getElementById('crashTimerFill');

  var state = 'running'; // running | crashed | waiting
  var roundNum = 1;
  var startTime = 0;
  var crashPoint = 0;
  var currentMult = 1.00;
  var points = [];
  var history = [];
  var dpr = window.devicePixelRatio || 1;
  var W = 0, H = 0;

  // Generate crash point (provably fair distribution)
  function genCrashPoint() {
    // House edge ~4%. Exponential distribution
    var r = Math.random();
    if (r < 0.04) return 1.00; // instant crash 4%
    var h = 0.96;
    return Math.max(1.00, Math.floor(100 * h / r) / 100);
  }

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function startRound() {
    state = 'running';
    crashPoint = genCrashPoint();
    startTime = performance.now();
    currentMult = 1.00;
    points = [];
    multEl.className = 'crash-mult running';
    statusEl.textContent = 'SUBINDO';
    statusEl.className = 'crash-status running';
    subEl.textContent = 'MULTIPLICADOR';
    timerFill.style.width = '0%';
    roundEl.textContent = 'RODADA #' + roundNum;
  }

  function crashRound() {
    state = 'crashed';
    multEl.innerHTML = currentMult.toFixed(2) + '<span class="x">x</span>';
    multEl.className = 'crash-mult crashed';
    statusEl.textContent = 'CRASHED';
    statusEl.className = 'crash-status crashed';
    subEl.textContent = 'RODADA ENCERRADA';

    // Add to history
    history.unshift(currentMult);
    if (history.length > 12) history.length = 12;
    renderHistory();

    // Wait then start next
    var waitTime = 4000 + Math.random() * 2000;
    var waitStart = performance.now();
    state = 'waiting_crash'; // brief flash

    setTimeout(function() {
      state = 'waiting';
      var countDown = 5;
      multEl.className = 'crash-mult waiting';
      statusEl.textContent = 'AGUARDANDO';
      statusEl.className = 'crash-status waiting';

      var cd = setInterval(function() {
        multEl.innerHTML = countDown.toFixed(1) + 's';
        subEl.textContent = 'PRÓXIMA RODADA';
        timerFill.style.width = ((5 - countDown) / 5 * 100) + '%';
        countDown -= 0.1;
        if (countDown <= 0) {
          clearInterval(cd);
          roundNum++;
          startRound();
        }
      }, 100);
    }, 1500);
  }

  function renderHistory() {
    var h = '';
    history.forEach(function(m) {
      var cls = m < 1.5 ? 'low' : m < 3 ? 'mid' : m < 10 ? 'high' : 'moon';
      h += '<span class="crash-hist-pill ' + cls + '">' + m.toFixed(2) + 'x</span>';
    });
    historyEl.innerHTML = h;
  }

  // Seed some history
  for (var i = 0; i < 8; i++) {
    history.push(genCrashPoint());
  }
  renderHistory();

  function drawGrid() {
    var padL = 50, padB = 30, padT = 10, padR = 20;
    var gW = W - padL - padR;
    var gH = H - padB - padT;

    // Background gradient
    ctx.fillStyle = '#0c1410';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(26,48,37,.5)';
    ctx.lineWidth = 0.5;

    // Horizontal lines (multiplier axis)
    var maxMult = Math.max(currentMult * 1.3, 2);
    var step = maxMult <= 3 ? 0.5 : maxMult <= 10 ? 1 : maxMult <= 50 ? 5 : 10;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#6b8577';
    ctx.textAlign = 'right';

    for (var m = 1; m <= maxMult; m += step) {
      var y = padT + gH - ((m - 1) / (maxMult - 1)) * gH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.fillText(m.toFixed(step < 1 ? 1 : 0) + 'x', padL - 6, y + 3);
    }

    // Vertical lines (time axis)
    var elapsed = (performance.now() - startTime) / 1000;
    var maxTime = Math.max(elapsed * 1.3, 5);
    var tStep = maxTime <= 10 ? 1 : maxTime <= 30 ? 5 : 10;
    ctx.textAlign = 'center';
    for (var t = 0; t <= maxTime; t += tStep) {
      var x = padL + (t / maxTime) * gW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, H - padB);
      ctx.stroke();
      ctx.fillText(t.toFixed(0) + 's', x, H - padB + 14);
    }

    return { padL: padL, padB: padB, padT: padT, padR: padR, gW: gW, gH: gH, maxMult: maxMult, maxTime: maxTime };
  }

  function drawLine(g) {
    if (points.length < 2) return;

    var padL = g.padL, padT = g.padT, gW = g.gW, gH = g.gH;

    // Gradient fill under curve
    var gradient = ctx.createLinearGradient(0, padT, 0, padT + gH);
    if (state === 'running') {
      gradient.addColorStop(0, 'rgba(33,196,94,.25)');
      gradient.addColorStop(1, 'rgba(33,196,94,.01)');
    } else {
      gradient.addColorStop(0, 'rgba(239,68,68,.20)');
      gradient.addColorStop(1, 'rgba(239,68,68,.01)');
    }

    // Map points to canvas coords
    var coords = points.map(function(p) {
      var x = padL + (p.t / g.maxTime) * gW;
      var y = padT + gH - ((p.m - 1) / (g.maxMult - 1)) * gH;
      return { x: x, y: y };
    });

    // Fill area
    ctx.beginPath();
    ctx.moveTo(coords[0].x, padT + gH);
    coords.forEach(function(c) { ctx.lineTo(c.x, c.y); });
    ctx.lineTo(coords[coords.length-1].x, padT + gH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (var i = 1; i < coords.length; i++) {
      ctx.lineTo(coords[i].x, coords[i].y);
    }
    ctx.strokeStyle = state === 'running' ? '#21c45e' : '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Glow on the tip
    if (state === 'running' && coords.length > 0) {
      var tip = coords[coords.length - 1];
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#21c45e';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(33,196,94,.3)';
      ctx.fill();
    }

    // Crashed X marker
    if (state !== 'running' && coords.length > 0) {
      var last = coords[coords.length - 1];
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText('✕', last.x, last.y - 12);
    }
  }

  function frame() {
    resize();

    if (state === 'running') {
      var elapsed = (performance.now() - startTime) / 1000;
      // Exponential growth: mult = e^(speed * t)
      var speed = 0.06 + Math.random() * 0.002; // slight randomness in feel
      currentMult = Math.pow(Math.E, 0.08 * elapsed);
      currentMult = Math.round(currentMult * 100) / 100;

      points.push({ t: elapsed, m: currentMult });
      // Thin old points if too many
      if (points.length > 600) {
        var newPts = [];
        for (var i = 0; i < points.length; i += 2) newPts.push(points[i]);
        newPts.push(points[points.length - 1]);
        points = newPts;
      }

      multEl.innerHTML = currentMult.toFixed(2) + '<span class="x">x</span>';

      if (currentMult >= crashPoint) {
        crashRound();
      }
    }

    var g = drawGrid();
    drawLine(g);

    requestAnimationFrame(frame);
  }

  startRound();
  requestAnimationFrame(frame);
})();

// INIT
loadPrices();
setInterval(loadPrices, 10000);
</script>
</body>
</html>`;
