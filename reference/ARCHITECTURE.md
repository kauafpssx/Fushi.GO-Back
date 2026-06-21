# 🏗️ Arquitetura do Backend — REST vs WebSocket

## 📋 Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (PWA)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │   REST Client    │    │  WebSocket Client │              │
│  │   (fetch/axios)  │    │  (socket.io/ws)   │              │
│  └────────┬─────────┘    └────────┬─────────┘              │
│           │                       │                         │
└───────────┼───────────────────────┼─────────────────────────┘
            │                       │
            ▼                       ▼
┌───────────────────┐   ┌───────────────────┐
│   REST API        │   │   WebSocket       │
│   (Express/Fastify)│   │   (Socket.io)     │
│                   │   │                   │
│  • Busca inicial  │   │  • Tempo real     │
│  • Dados estáticos│   │  • Push updates   │
│  • CRUD           │   │  • Live tracking  │
└─────────┬─────────┘   └─────────┬─────────┘
          │                       │
          └───────────┬───────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    CITTAMOBI API                            │
│              (core.cittamobi.com.br)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔵 ROTAS REST

### Quando usar REST
- Dados que **não mudam** frequentemente
- Busca inicial / carregamento de página
- Operações CRUD
- Cache eficiente

### Rotas públicas (sem auth)

| Método | Rota | Descrição | Cache |
|--------|------|-----------|-------|
| `GET` | `/api/session?lat={lat}&lng={lng}` | Detectar cidade | 24h |

### Rotas de busca

| Método | Rota | Descrição | Cache |
|--------|------|-----------|-------|
| `GET` | `/api/search?q={query}&cityId={id}` | Buscar rotas | 1h |
| `GET` | `/api/stops?viewport={nelat},{nelng},{swlat},{swlng}` | Paradas no mapa | 5min |
| `GET` | `/api/stops/recommendation?lat={lat}&lng={lng}` | Zoom recomendado | 24h |

### Rotas de rotas/serviço

| Método | Rota | Descrição | Cache |
|--------|------|-----------|-------|
| `GET` | `/api/routes/{routeId}/services` | Serviços de uma rota | 24h |
| `GET` | `/api/services/{serviceId}` | Detalhes do serviço | 1h |
| `GET` | `/api/services/{serviceId}/itinerary` | Polilinha + paradas | 24h |

### Rotas de previsão (snapshot)

| Método | Rota | Descrição | Cache |
|--------|------|-----------|-------|
| `GET` | `/api/predictions/stop/{stopId}` | Todas as rotas no ponto | 30s |
| `GET` | `/api/predictions/service/{serviceId}/{stopId}` | Previsão específica | 30s |
| `GET` | `/api/predictions/schedule/{serviceId}?date={date}` | Horários do dia | 1h |

### Rotas de notificações

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/notifications/subscribe` | Criar inscrição push |
| `DELETE` | `/api/notifications/subscribe/{id}` | Remover inscrição |
| `GET` | `/api/notifications/subscriptions` | Listar inscrições do usuário |
| `PATCH` | `/api/notifications/subscribe/{id}` | Atualizar alertas |

### Rotas de favoritos

⚠️ **Favoritos ficam no IndexedDB (local do navegador)**, não no backend.

Razões:
- Funciona offline
- Sem necessidade de autenticação
- Mais rápido
- Dados do usuário ficam no dispositivo

| Método | Rota | Descrição |
|--------|------|-----------|
| - | `indexedDB:favorites` | CRUD local via IndexedDB |

---

## 🟢 WEBSOCKET

### Quando usar WebSocket
- Dados que **mudam** a cada 60 segundos
- Tracking em tempo real
- Atualizações push do servidor

### Canais (rooms)

| Canal | Eventos | Frequência | Quem assina |
|-------|---------|------------|-------------|
| `vehicles:{serviceId}` | positions, speeds | 60s | Usuário na página de tracking |
| `predictions:{stopId}` | arrival updates | 30s | Usuário vendo previsão |
| `alerts:{cityId}` | system alerts | Sob demanda | Todos conectados |

### Eventos WebSocket

#### Veículos (canal `vehicles:{serviceId}`)

| Evento | Direção | Payload | Frequência |
|--------|---------|---------|------------|
| `vehicles:update` | Server → Client | `[{ id, lat, lng, bearing, speed, prefix, type }]` | 60s |
| `vehicle:enter` | Server → Client | `{ id, prefix, lat, lng }` | Quando entra na rota |
| `vehicle:leave` | Server → Client | `{ id, prefix }` | Quando sai da rota |

#### Previsões (canal `predictions:{stopId}`)

| Evento | Direção | Payload | Frequência |
|--------|---------|---------|------------|
| `prediction:update` | Server → Client | `{ serviceId, vehicles: [{ prefix, prediction, type }] }` | 30s |
| `prediction:alert` | Server → Client | `{ type: "arriving", minutes: 3, vehicle: {...} }` | Sob demanda |

#### Alertas do sistema (canal `alerts:{cityId}`)

| Evento | Direção | Payload | Frequência |
|--------|---------|---------|------------|
| `alert:cancelled` | Server → Client | `{ routeCode, reason }` | Sob demanda |
| `alert:delay` | Server → Client | `{ routeCode, delayMinutes }` | Sob demanda |
| `alert:diversion` | Server → Client | `{ routeCode, description }` | Sob demanda |

---

## 🔄 FLUXO COMPLETO

### Exemplo: Usuário quer rastrear ônibus

```
1. ABRE O SITE
   │
   ├── REST: GET /api/session?lat=...&lng=...        → Detecta cidade
   ├── REST: GET /api/stops?viewport=...              → Carrega paradas
   └── REST: GET /api/search?q=terminal               → Busca rotas

2. USUÁRIO SELECIONA ROTA
   │
   ├── REST: GET /api/services/{serviceId}            → Detalhes
   ├── REST: GET /api/services/{serviceId}/itinerary  → Polilinha + paradas
   └── REST: GET /api/predictions/service/{id}/{stopId} → Previsão inicial

3. USUÁRIO ATIVA TRACKING
   │
   ├── WS: connect()
   ├── WS: join("vehicles:{serviceId}")
   └── WS: join("predictions:{stopId}")

4. ATUALIZAÇÕES EM TEMPO REAL
   │
   ├── WS: vehicles:update (a cada 60s)  → Move markers no mapa
   └── WS: prediction:update (a cada 30s) → Atualiza "chega em X min"

5. USUÁRIO SALVA FAVORITO
   │
   └── IndexedDB: save({ serviceId, stopId, routeCode, stopName })

6. USUÁRIO ATIVA NOTIFICAÇÃO
   │
   └── REST: POST /api/notifications/subscribe → Registra push

7. USUÁRIO FECHA O SITE
   │
   ├── WS: disconnect()
   └── Backend continua monitorando → Push quando chegar
```

---

```
frontend/
├── src/
│   ├── components/                # Componentes React
│   │   ├── Map/
│   │   ├── Search/
│   │   ├── Tracking/
│   │   └── Notifications/
│   │
│   ├── hooks/                     # Hooks customizados
│   │   ├── useWebSocket.js       # Conexão WebSocket
│   │   ├── useFavorites.js       # CRUD IndexedDB
│   │   └── useTracking.js        # Lógica de tracking
│   │
│   ├── services/                  # Serviços
│   │   ├── api.js                # Cliente REST
│   │   ├── websocket.js          # Cliente WebSocket
│   │   └── db.js                 # IndexedDB helper
│   │
│   └── store/                     # Estado global
│       └── trackingStore.js
```

### IndexedDB (Favoritos e Histórico)

### Estrutura de dados

```javascript
// Database: busTracker
// Store: favorites
{
  id: "uuid",
  serviceId: "0ec23b44-d280-11f0-a0e6-02001705c31d",
  stopId: "35f189cd-7340-4600-b265-6bf526c6345d",
  routeCode: "M681",
  stopName: "R. XV de Novembro",
  createdAt: 1782019067000
}

// Store: history
{
  id: "uuid",
  serviceId: "...",
  routeCode: "M681",
  date: "2026-06-21",
  duration: 1800  // segundos
}
```

### Usar no frontend

```javascript
// Salvar favorito
async function saveFavorite(data) {
  const db = await openDB('busTracker', 1);
  await db.put('favorites', {
    id: crypto.randomUUID(),
    ...data,
    createdAt: Date.now()
  });
}

// Listar favoritos
async function getFavorites() {
  const db = await openDB('busTracker', 1);
  return await db.getAll('favorites');
}

// Remover favorito
async function removeFavorite(id) {
  const db = await openDB('busTracker', 1);
  await db.delete('favorites', id);
}
```

---

## 📊 Comparação REST vs WebSocket

| Aspecto | REST | WebSocket |
|---------|------|-----------|
| Conexão | Nova a cada request | Única, persistente |
| Direção | Client → Server | Bidirecional |
| Latência | ~100-300ms | ~10-50ms |
| Cache | Simples (HTTP cache) | Manual |
| Escalabilidade | Horizontal fácil | Mais complexo |
| Dados estáticos | ✅ Ideal | ❌ Não precisa |
| Dados dinâmicos | ⚠️ Polling | ✅ Ideal |
| Complexidade | Baixa | Média |

---

## 🧠 Cache Strategy

### REST (HTTP Cache)

| Rota | TTL | Estratégia |
|------|-----|------------|
| `/api/session` | 24h | Cache no browser |
| `/api/search` | 1h | Cache + stale-while-revalidate |
| `/api/stops` | 5min | Cache curto |
| `/api/services/*` | 1h | Cache médio |
| `/api/predictions/*` | 30s | Cache mínimo ou nenhum |
| `/api/itinerary` | 24h | Cache longo |

### WebSocket (Server-side Cache)

| Dados | TTL | Armazenamento |
|-------|-----|---------------|
| Posições veículos | 60s | Redis/Memcached |
| Previsões | 30s | Redis/Memcached |
| Dados rota | 24h | Redis/Memcached |
| Dados parada | 5min | Redis/Memcached |

---

## 📁 Estrutura do Backend

```
backend/
├── src/
│   ├── routes/                    # Rotas REST
│   │   ├── session.js
│   │   ├── search.js
│   │   ├── stops.js
│   │   ├── services.js
│   │   ├── predictions.js
│   │   └── notifications.js
│   │
│   ├── websocket/                 # WebSocket
│   │   ├── index.js              # Setup socket.io
│   │   ├── handlers/
│   │   │   ├── vehicles.js       # Canal vehicles
│   │   │   ├── predictions.js    # Canal predictions
│   │   │   └── alerts.js         # Canal alerts
│   │   └── workers/
│   │       ├── vehicleTracker.js  # Busca veículos a cada 60s
│   │       └── predictionChecker.js # Verifica previsões
│   │
│   ├── services/                  # Lógica de negócio
│   │   ├── cittamobi.js          # Wrapper da API Cittamobi
│   │   ├── cache.js              # Gerenciamento de cache
│   │   ├── notifications.js      # Envio de push
│   │   └── scheduler.js          # Tarefas agendadas
│   │
│   ├── middleware/
│   │   ├── auth.js               # Autenticação (futuro)
│   │   ├── rateLimit.js          # Limite de requests
│   │   └── cache.js              # Middleware de cache
│   │
│   └── workers/                   # Workers em background
│       ├── pushNotifier.js       # Verifica e envia push
│       └── cacheWarmer.js        # Pré-carrega cache
│
├── prisma/                        # Banco de dados
│   └── schema.prisma
│
└── package.json
```

---

## ⚡ Performance Esperada

| Métrica | REST | WebSocket |
|---------|------|-----------|
| Tempo resposta | 100-300ms | 10-50ms |
| Throughput | ~1000 req/s | ~10000 msg/s |
| Memória | ~50MB | ~100MB |
| Conexões simultâneas | Ilimitado | ~10000 |

---

## 🔒 Segurança

### REST
- Rate limiting por IP (100 req/min)
- Validação de parâmetros
- Cache seguro (não expor dados sensíveis)

### WebSocket
- Autenticação na conexão (token)
- Validação de sala (só assinar o que tem direito)
- Rate limit de mensagens
- Heartbeat para detectar desconexão

---

## 📋 Resumo

| Necessidade | Solução |
|-------------|---------|
| Busca de rotas | REST |
| Carregar paradas | REST |
| Detalhes da rota | REST |
| Previsão snapshot | REST |
| Tracking tempo real | WebSocket |
| Atualizações push | WebSocket |
| Alertas do sistema | WebSocket |
| Notificações | Push API |
| Favoritos | IndexedDB | Local, offline |
| Histórico | IndexedDB | Local, offline |
