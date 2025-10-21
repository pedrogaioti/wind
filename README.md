# Wind Airways Virtual Airline

<div align="center">
  <img src="https://via.placeholder.com/200x200?text=Wind+Airways" alt="Wind Airways Logo" width="200">
  <p><em>Excelência em aviação virtual</em></p>
</div>

## 📋 Sobre

Bem-vindo ao repositório da Wind Airways, uma companhia aérea virtual homologada para IVAO e VATSIM. Este projeto oferece uma plataforma profissional para aviação virtual, integrando-se com a API Newsky para fornecer uma experiência completa aos pilotos virtuais.

A Wind Airways foi criada com o objetivo de proporcionar uma experiência realista e profissional para entusiastas da aviação virtual, oferecendo rotas diversificadas, treinamentos especializados e uma comunidade ativa de pilotos.

## 🚀 Tecnologias

### Backend
- **Node.js**: Ambiente de execução JavaScript server-side
- **Express.js**: Framework web rápido e minimalista
- **Node-Cache**: Sistema de cache para otimização de performance
- **Express Rate Limit**: Proteção contra sobrecarga de requisições
- **CORS**: Gerenciamento de políticas de acesso entre origens
- **dotenv**: Gerenciamento de variáveis de ambiente

### Frontend
- **HTML5**: Estruturação semântica do conteúdo
- **TailwindCSS**: Framework CSS utilitário para design responsivo
- **Font Awesome**: Biblioteca de ícones vetoriais
- **JavaScript Vanilla**: Interatividade e dinamismo no cliente

## 🛠️ Requisitos

- Node.js >= 16.0.0
- NPM >= 8.0.0
- Navegador moderno com suporte a ES6

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
- **Perfil de Pilotos**: Gerenciamento de informações e histórico de voos
- **Sistema de Reservas**: Agendamento de voos e slots

## 🔒 Segurança

- Implementação de CORS para controle de acesso
- Rate limiting para proteção contra ataques DDoS
- Variáveis de ambiente para dados sensíveis
- Timeout configurável para requisições à API
- Validação de dados de entrada

## 🌐 Endpoints da API

- `GET /api/pilot/:id`: Detalhes de um piloto específico

## 📝 Licença

ISC - [Saiba mais](https://opensource.org/licenses/ISC)

## 📞 Suporte

Para suporte ou dúvidas, entre em contato através do [Discord](https://discord.gg/windairways) ou abra uma issue no repositório.

## ✨ Powered by Newsky

Este projeto é alimentado pela plataforma Newsky, oferecendo uma experiência profissional para aviação virtual.

---

<div align="center">
  <p>© 2023 Wind Airways Virtual Airline. Todos os direitos reservados.</p>
</div>