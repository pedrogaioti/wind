// src/routes/airline.routes.js
const express = require("express");
const NodeCache = require("node-cache");

// Para Node 18+: fetch nativo.
// Se estiver no Node 16, instale node-fetch e descomente:
// const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const router = express.Router();
const cache = new NodeCache({ stdTTL: 60 }); // cache de 60 segundos

const NEWSKY_BASE = (process.env.NEWSKY_API_BASE_URL || 'https://beta.newsky.app/api/airline-api').replace(/\/+$/, '');
const TOKEN = process.env.NEWSKY_API_TOKEN || process.env.NEWSKY_TOKEN;

// Função para normalizar o formato dos dados da API da Newsky
function normalizeAirlineData(data) {
  const a = data?.airline || {};

  return {
    airline: {
      id: a._id,
      icao: a.icao,
      name: a.fullname || a.shortname || "Unknown",
      countryCode: a.countryCode || null,
      homeIcao: a.homeIcao || null,
      tier: a.tier || null,
      active: a?.status?.active ?? null,
    },
    totals: {
      flights: a?.stats?.flights ?? 0,
      pilotsActive: a?.stats?.activePilots ?? 0,
      pilotsRecentActive: a?.stats?.recentActivePilots ?? 0,
      flightsRecent: a?.stats?.recentFlights ?? 0,
      rating: a?.stats?.rating ?? null,
      hours: null, // o endpoint /airline não fornece horas totais
      routes: null // idem
    },
    description: a?.documents?.summary || "",
    logo: a?.logo || null,
    banner: a?.banner || null,
    source: "https://beta.newsky.app/api/airline-api/airline"
  };
}

// Rota principal
router.get("/", async (req, res) => {
  try {
    if (!TOKEN) {
      return res.status(500).json({ error: "NEWSKY_API_TOKEN ausente no servidor (.env)" });
    }

    const cached = cache.get("airline_totals");
    if (cached) return res.json(cached);

    const r = await fetch(`${NEWSKY_BASE}/airline`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(r.status).json({ error: "Erro ao consultar a API da Newsky", detail: text });
    }

    const data = await r.json();
    const normalized = normalizeAirlineData(data);

    cache.set("airline_totals", normalized);
    res.json(normalized);
  } catch (e) {
    console.error("Erro /api/newsky/airline:", e);
    res.status(500).json({ error: "Proxy /airline falhou", detail: String(e) });
  }
});

module.exports = router;
