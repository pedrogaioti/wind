# Wind Airways Virtual Airline

Bem-vindo ao repositório da Wind Airways, uma companhia aérea virtual homologada para IVAO e VATSIM. Este projeto oferece uma plataforma profissional para aviação virtual, integrando-se com a API Newsky para fornecer uma experiência completa aos pilotos virtuais.

## 🚀 Tecnologias

### Backend
- Node.js
- Express.js
- Node-Cache (para otimização de performance)
- Express Rate Limit (para proteção contra sobrecarga)
- CORS
- dotenv (para gerenciamento de variáveis de ambiente)

### Frontend
- HTML5
- TailwindCSS
- Font Awesome
- JavaScript Vanilla

## 🛠️ Requisitos

- Node.js >= 16.0.0
- NPM >= 8.0.0

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/pedrogaioti/wind.git
cd wind
```

2. Instale as dependências do backend:
```bash
cd backend
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` no diretório `backend` com as seguintes variáveis:
```env
PORT=3000
NEWSKY_API_BASE_URL=https://api.newsky.app
AIRLINE_CODE=win
CACHE_TTL=300
CACHE_CHECK_PERIOD=120
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:3000
API_TIMEOUT=10000
```

## 🚀 Executando o Projeto

### Backend
```bash
cd backend
npm run dev  # para desenvolvimento
# ou
npm start    # para produção
```

### Frontend
Abra o arquivo `frontend/index.html` em seu navegador ou utilize um servidor local de sua preferência.

## 🌟 Funcionalidades

- **Integração com API Newsky**: Acesso em tempo real a dados de voos e pilotos
- **Sistema de Cache**: Otimização de performance com cache inteligente
- **Rate Limiting**: Proteção contra sobrecarga de requisições
- **Interface Responsiva**: Design adaptável para diferentes dispositivos
- **Mapa ao Vivo**: Visualização em tempo real dos voos ativos
- **Estatísticas**: Acompanhamento de métricas importantes da companhia

## 🔒 Segurança

- Implementação de CORS para controle de acesso
- Rate limiting para proteção contra ataques DDoS
- Variáveis de ambiente para dados sensíveis
- Timeout configurável para requisições à API

## 🌐 Endpoints da API

- `GET /api/health`: Verificação de status do servidor
- `GET /api/flight/:id`: Detalhes de um voo específico
- `GET /api/flights/ongoing`: Lista de voos em andamento
- `GET /api/flights`: Lista de todos os voos
- `GET /api/statistics`: Estatísticas da companhia
- `GET /api/pilots`: Lista de pilotos

## 📝 Licença

ISC - [Saiba mais](https://opensource.org/licenses/ISC)

## ✨ Powered by Newsky

Este projeto é alimentado pela plataforma Newsky, oferecendo uma experiência profissional para aviação virtual.