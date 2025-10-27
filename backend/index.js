// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Para Node 16: descomente as 2 linhas abaixo e comente a checagem de fetch nativo
// const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
// const AbortController = global.AbortController || require('abort-controller');

const app = express();

/* =========================
   Configurações via .env
   ========================= */
const PORT = Number(process.env.PORT || 3000);
const AIRLINE_CODE = (process.env.AIRLINE_CODE || 'WIN').toUpperCase();
const NEWSKY_API_TOKEN = process.env.NEWSKY_API_TOKEN || process.env.NEWSKY_TOKEN || '';
const NEWSKY_API_BASE_URL =
  process.env.NEWSKY_API_BASE_URL?.replace(/\/+$/, '') || 'https://beta.newsky.app/api/airline-api';
const API_TIMEOUT = Number(process.env.API_TIMEOUT || 10000);

// CORS seguro (se ALLOWED_ORIGINS vazio → libera localhost e mesma origem em dev)
const RAW_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const DEFAULT_DEV_ORIGINS = [
  `http://localhost:${PORT}`,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const ALLOWED_ORIGINS = RAW_ORIGINS.length ? RAW_ORIGINS : DEFAULT_DEV_ORIGINS;

/* =========================
   Middlewares
   ========================= */
app.use(cors({
  origin: (origin, callback) => {
    // Permite ferramentas como curl/postman (sem origin)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

/* =========================
   Estáticos (frontend)
   ========================= */
const FRONTEND_DIR = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR));

/* =========================
   Helpers
   ========================= */
function withTimeout(ms = API_TIMEOUT) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(t) };
}

function requireToken(res) {
  if (!NEWSKY_API_TOKEN) {
    res.status(500).json({ error: 'NEWSKY_API_TOKEN ausente no servidor (.env)' });
    return false;
  }
  return true;
}

/* =========================
   Health check
   ========================= */
app.get('/api/health', (_req, res) => res.send('OK'));

/* =========================
   URL do mapa (sem expor token no client)
   ========================= */
app.get('/api/map-url', (req, res) => {
  if (!NEWSKY_API_TOKEN) {
    return res.status(500).json({ error: 'NEWSKY_API_TOKEN ausente no servidor (.env)' });
  }
  const style = (req.query.style || 'light').toLowerCase() === 'dark' ? 'dark' : 'light';
  const url = `https://newsky.app/airline/public/map?style=${style}&token=${NEWSKY_API_TOKEN}`;
  res.json({ url });
});

/* =========================
   Voos em andamento
   ========================= */
app.get('/api/flights-ongoing', async (_req, res) => {
  if (!requireToken(res)) return;

  const { signal, clear } = withTimeout();
  try {
    const r = await fetch(`${NEWSKY_API_BASE_URL}/flights/ongoing`, {
      headers: { Authorization: `Bearer ${NEWSKY_API_TOKEN}` },
      signal,
    });
    clear();
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(r.status).json({ error: 'Upstream error', detail: text });
    }
    const data = await r.json();
    res.json({ totalResults: data.totalResults || 0, results: data.results || [] });
  } catch (err) {
    res.status(500).json({ error: 'Não foi possível buscar os voos ativos', detail: String(err) });
  }
});

/* =========================
   Pilotos por múltiplos IDs
   ========================= */
app.get('/api/pilots/multiple', async (req, res) => {
  if (!requireToken(res)) return;

  const idsParam = req.query.ids; // ?ids=abc,def,ghi
  if (!idsParam) {
    return res.status(400).json({ error: 'É necessário informar ao menos um ID de piloto. Use ?ids=ID1,ID2' });
  }

  const pilotIds = idsParam.split(',').map(s => s.trim()).filter(Boolean);
  if (!pilotIds.length) {
    return res.status(400).json({ error: 'Nenhum ID válido informado.' });
  }

  try {
    const results = await Promise.all(pilotIds.map(async (id) => {
      const { signal, clear } = withTimeout();
      try {
        const r = await fetch(`${NEWSKY_API_BASE_URL}/pilot/${id}`, {
          headers: { Authorization: `Bearer ${NEWSKY_API_TOKEN}` },
          signal,
        });
        clear();

        if (!r.ok) {
          const text = await r.text().catch(() => '');
          return { id, error: `Falha (${r.status})`, detail: text };
        }

        const data = await r.json();
        const p = data?.pilot || {};

        return {
          id,
          name: p.fullname || p.name || 'N/D',
          callsign: p.callsign || `${AIRLINE_CODE}000`,
          // Alguns payloads usam minutos, outros horas — aqui só repassamos o que vier:
          hours: p?.statsTotal?.time ?? p?.stats?.time ?? 0,
          flights: p?.statsTotal?.flights ?? p?.stats?.flights ?? 0,
          rating: p?.statsTotal?.rating ?? p?.rating ?? null,
          lastFlight: p?.statsTotal?.lastFlightDate ?? p?.lastFlight ?? null,
        };
      } catch (e) {
        return { id, error: 'Erro na requisição', detail: String(e) };
      }
    }));

    res.json({ pilots: results });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao buscar pilotos', detail: String(err) });
  }
});

/* =========================
   Proxy: /api/newsky/flights/bydate
   (repasse seguro, sem expor token)
   ========================= */
app.post('/api/newsky/flights/bydate', async (req, res) => {
  if (!requireToken(res)) return;

  // Payload esperado pela Newsky:
  // { start, end, skip, count, includeDeleted }
  const body = {
    start: req.body?.start,
    end: req.body?.end,
    skip: Number.isFinite(req.body?.skip) ? req.body.skip : 0,
    count: Number.isFinite(req.body?.count) ? req.body.count : 100,
    includeDeleted: Boolean(req.body?.includeDeleted),
  };

  // Validação simples
  if (!body.start || !body.end) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios: start e end (ISO 8601)' });
  }

  const { signal, clear } = withTimeout();
  try {
    const r = await fetch(`${NEWSKY_API_BASE_URL}/flights/bydate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NEWSKY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });
    clear();

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return res.status(r.status).json({ error: 'Upstream error', detail: text });
    }

    const data = await r.json();
    // Normalização leve para o frontend
    res.json({
      totalResults: data.totalResults ?? data.total ?? undefined,
      results: Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []),
    });
  } catch (err) {
    res.status(500).json({ error: 'Falha ao acessar /flights/bydate', detail: String(err) });
  }
});

/* =========================
   Rota /api/newsky/airline (via arquivo externo)
   ========================= */
   const airlineRoutesPath = path.join(__dirname, "src/routes/airline.routes.js");
try {
  const airlineRoutes = require(airlineRoutesPath);
  app.use("/api/newsky/airline", airlineRoutes);
  console.log("✅ /api/newsky/airline montada via", airlineRoutesPath);
} catch (e) {
  console.error("❌ Falha ao carregar", airlineRoutesPath, "\nDetalhe:", e && e.stack ? e.stack : e);
}

/* =========================
   SPA / Página inicial
   ========================= */
app.get('/', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

/* =========================
   404
   ========================= */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

/* =========================
   Start
   ========================= */
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🛫 Wind Airways - Servidor Iniciado');
  console.log('='.repeat(50));
  console.log(`✅ http://localhost:${PORT}`);
  console.log(`✈️  Companhia: ${AIRLINE_CODE}`);
  console.log(`🔗 Newsky Base: ${NEWSKY_API_BASE_URL}`);
  console.log('='.repeat(50) + '\n');
});

module.exports = app;
