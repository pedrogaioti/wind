/* ===============================================
   Wind Airways - Backend Server
   Servidor Node.js com integração à API Newsky
   =============================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

// Inicialização
const app = express();
const cache = new NodeCache({ 
    stdTTL: parseInt(process.env.CACHE_TTL),
    checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD)
});

// Configurações
const PORT = process.env.PORT || 3000;
const NEWSKY_API_BASE = process.env.NEWSKY_API_BASE_URL;
const AIRLINE_CODE = process.env.AIRLINE_CODE || 'win';

// Middlewares
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/index.html')));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Muitas requisições. Tente novamente mais tarde.' }
});

app.use('/api/', limiter);

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

/* ===============================================
   FUNÇÕES AUXILIARES
   =============================================== */

// Fazer requisição à API Newsky
async function fetchFromNewsky(endpoint) {
    const url = `${NEWSKY_API_BASE}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'WindAirways/1.0'
            },
            timeout: parseInt(process.env.API_TIMEOUT) || 10000
        });

        if (!response.ok) {
            throw new Error(`API retornou status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar ${url}:`, error.message);
        throw error;
    }
}

// Middleware de cache
function cacheMiddleware(duration) {
    return (req, res, next) => {
        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            console.log(`Cache HIT: ${key}`);
            return res.json(cachedResponse);
        }

        console.log(`Cache MISS: ${key}`);
        res.originalJson = res.json;
        res.json = (data) => {
            cache.set(key, data, duration);
            res.originalJson(data);
        };
        next();
    };
}

/* ===============================================
   ROTAS DA API
   =============================================== */

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        airline: AIRLINE_CODE,
        cache_stats: cache.getStats()
    });
});

// Buscar voo específico por ID
app.get('/api/flight/:id', cacheMiddleware(300), async (req, res) => {
    try {
        const { id } = req.params;
        const data = await fetchFromNewsky(`/flight/${id}`);
        
        res.json({
            success: true,
            data: data,
            cached: false
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar voo',
            message: error.message
        });
    }
});

// Buscar voos em andamento
app.get('/api/flights/ongoing', cacheMiddleware(60), async (req, res) => {
    try {
        const data = await fetchFromNewsky('/flights/ongoing');
        
        res.json({
            success: true,
            data: data,
            count: data?.length || 0,
            cached: false
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar voos em andamento',
            message: error.message
        });
    }
});

// Buscar todos os voos da companhia
app.get('/api/flights', cacheMiddleware(300), async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const data = await fetchFromNewsky(`/flights?limit=${limit}&offset=${offset}`);
        
        res.json({
            success: true,
            data: data,
            count: data?.length || 0,
            cached: false
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar voos',
            message: error.message
        });
    }
});

// Buscar estatísticas da companhia
app.get('/api/statistics', cacheMiddleware(600), async (req, res) => {
    try {
        const data = await fetchFromNewsky('/statistics');
        
        res.json({
            success: true,
            data: data,
            cached: false
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas',
            message: error.message
        });
    }
});

// Buscar pilotos
app.get('/api/pilots', cacheMiddleware(300), async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const data = await fetchFromNewsky(`/pilots?limit=${limit}`);
        
        res.json({
            success: true,
            data: data,
            count: data?.length || 0,
            cached: false
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar pilotos',
            message: error.message
        });
    }
});

// Buscar frota
app.get('/api/fleet', cacheMiddleware(600), async (req, res) => {
    try {
        const data = await fetchFromNewsky('/fleet');
        
        res.json({
            success: true,
            data: data,
            count: data?.length || 0,
            cached: false
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar frota',
            message: error.message
        });
    }
});

// Limpar cache (rota administrativa)
app.post('/api/cache/clear', (req, res) => {
    const { key } = req.body;
    
    if (key) {
        cache.del(key);
        res.json({ success: true, message: `Cache limpo para: ${key}` });
    } else {
        cache.flushAll();
        res.json({ success: true, message: 'Todo o cache foi limpo' });
    }
});

// Obter estatísticas de cache
app.get('/api/cache/stats', (req, res) => {
    res.json({
        success: true,
        stats: cache.getStats(),
        keys: cache.keys()
    });
});

/* ===============================================
   ROTAS DO FRONTEND
   =============================================== */

// Servir página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Catch-all para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada'
    });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

/* ===============================================
   INICIALIZAÇÃO DO SERVIDOR
   =============================================== */

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🛫 Wind Airways Backend Server');
    console.log('='.repeat(50));
    console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
    console.log(`🔗 API Newsky: ${NEWSKY_API_BASE}`);
    console.log(`✈️  Companhia: ${AIRLINE_CODE.toUpperCase()}`);
    console.log(`⚡ Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Cache TTL: ${process.env.CACHE_TTL || 300}s`);
    console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor...');
    cache.flushAll();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT recebido. Encerrando servidor...');
    cache.flushAll();
    process.exit(0);
});

module.exports = app;