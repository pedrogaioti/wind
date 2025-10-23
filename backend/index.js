require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Configurações
const PORT = process.env.PORT || 3000;
const AIRLINE_CODE = process.env.AIRLINE_CODE;
const NEWSKY_API_TOKEN = process.env.NEWSKY_API_TOKEN;
const NEWSKY_API_BASE_URL = process.env.NEWSKY_API_BASE_URL;  // ex.: https://newsky.app/api/airline-api
const API_TIMEOUT = Number(process.env.API_TIMEOUT || 10000);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS.split(',');

// Middlewares
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/api/health', (req, res) => {
    res.send('OK');
});

// Rota para retornar URL do iframe sem expor o token
app.get('/api/map-url', (req, res) => {
  const url = `https://newsky.app/airline/public/map?style=light&token=${NEWSKY_API_TOKEN}`;
  res.json({ url });
});

// Rota para retornar Voos Ativos sem expor token
app.get('/api/flights-ongoing', async (req, res) => {
    try {
        const response = await fetch('https://newsky.app/api/airline-api/flights/ongoing', {
            headers: {
                'Authorization': `Bearer ${NEWSKY_API_TOKEN}`
            }
        });
        const data = await response.json();
        res.json({ totalResults: data.totalResults || 0, results: data.results || [] });
    } catch (err) {
        console.error('Erro ao buscar voos ativos:', err);
        res.status(500).json({ error: 'Não foi possível buscar os voos ativos' });
    }
});

// Rota para buscar pilotos com detalhes (nome, horas de voo, código...)
// Rota para buscar vários pilotos pelo ID
app.get('/api/pilots/multiple', async (req, res) => {
    const idsParam = req.query.ids; // exemplo: ?ids=123,456,789

    if (!idsParam) {
        return res.status(400).json({ error: 'É necessário informar ao menos um ID de piloto' });
    }

    const pilotIds = idsParam.split(',').map(id => id.trim());

    try {
        const pilotsDetailed = await Promise.all(
            pilotIds.map(async (id) => {
                const response = await fetch(`https://beta.newsky.app/api/airline-api/pilot/${id}`, {
                    headers: { 'Authorization': `Bearer ${NEWSKY_API_TOKEN}` }
                });

                if (!response.ok) {
                    const text = await response.text();
                    console.error(`Erro ao buscar piloto ${id}:`, text);
                    return { id, error: 'Não foi possível buscar esse piloto' };
                }

                const data = await response.json();
                return {
                    id,
                    name: data.pilot.fullname,
                    callsign: data.pilot.callsign || "WIN000",
                    hours: data.pilot.statsTotal.time,
                    flights: data.pilot.statsTotal.flights,
                    rating: data.pilot.statsTotal.rating,
                    lastFlight: data.pilot.statsTotal.lastFlightDate
                };
            })
        );

        res.json({ pilots: pilotsDetailed });

    } catch (err) {
        console.error('Erro ao buscar pilotos:', err);
        res.status(500).json({ error: 'Erro interno ao buscar pilotos' });
    }
});


// Serve a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/index.html'));
});

// 🚀 Proxy para /api/newsky/flights/bydate
app.post('/api/newsky/flights/bydate', async (req, res) => {
  // (código do proxy que repassa para https://newsky.app/api/airline-api/flights/bydate)
});

// Rota fallback (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});


app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🛫 Wind Airways - Servidor Iniciado');
    console.log('='.repeat(50));
    console.log(`✅ http://localhost:${PORT}`);
    console.log(`✈️  Companhia: ${AIRLINE_CODE.toUpperCase()}`);
    console.log('='.repeat(50) + '\n');
});

module.exports = app;
