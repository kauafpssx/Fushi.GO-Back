# Fushi.GO

Proxy inteligente para a API Cittamobi com SSE para tracking de ônibus em tempo real.

## Stack

- Bun
- Fastify 5
- TypeScript
- Vitest (testes)
- SSE (Server-Sent Events)
- Upstash Redis (notificações)
- Web Push API
- JWT (access + refresh tokens)
- Docker

## Setup

```bash
bun install
cp .env.example .env
# editar .env com suas credenciais
bun run dev
```

Docs disponíveis em: `http://localhost:47291/docs`

## Testes

```bash
bun run test
bun run test:watch
```

## Docker

```bash
docker build -t fushigo .
docker run -p 47291:47291 --env-file .env fushigo
```

## Build para Produção

```bash
# Build
bun run build

# Produção
bun run start

# Ou direto
bun src/index.ts
```

### Deploy (Alwaysdata)

```bash
# No painel Alwaysdata:
# - Setar Node.js 22 ou Bun
# - Command: bun src/index.ts
# - Port: 47291
# - Env vars: preencher no painel

# Ou via SSH:
curl -fsSL https://bun.sh/install | bash
bun install
bun src/index.ts
```

#### systemd (VPS)

```ini
[Unit]
Description=FushiGO API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/fushigo
ExecStart=/root/.bun/bin/bun src/index.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable fushigo
sudo systemctl start fushigo
```

### Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name fushigo.kauafpss.com.br;

    location / {
        proxy_pass http://127.0.0.1:47291;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

### Cloudflare

```
Internet → Cloudflare (TLS/WAF/Bot Fight) → Alwaysdata/VPS (47291) → Fastify
```

## Variáveis de Ambiente

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| PORT | | Porta (default: 47291) |
| HOST | | Host (default: 0.0.0.0) |
| LOG_LEVEL | | warn, info, debug (default: warn) |
| CORS_ORIGIN | ✅ | Origem permitida (ex: https://fushigo.kauafpss.com.br) |
| JWT_SECRET | ✅ | Segredo JWT (64+ hex) |
| CITTAMOB_USERNAME | ✅ | Username Cittamobi |
| CITTAMOB_CORE_URL | ✅ | URL Core API |
| CITTAMOB_SESSION_URL | ✅ | URL Session API |
| UPSTASH_REDIS_REST_URL | ✅ | URL Upstash Redis |
| UPSTASH_REDIS_REST_TOKEN | ✅ | Token Upstash Redis |
| VAPID_PUBLIC_KEY | ✅ | Chave publica VAPID |
| VAPID_PRIVATE_KEY | ✅ | Chave privada VAPID |
| VAPID_SUBJECT | ✅ | Subject VAPID (mailto:email) |

---

## Endpoints

### Auth (público)

#### POST /api/auth/register (público)
Criar sessão.

```
Request:  { "deviceId": "uuid-gerado-pelo-frontend" }
Response: { "accessToken": "jwt...", "sessionId": "..." }
Cookie:   refresh_token=... (HttpOnly, Secure, SameSite=Strict, 24h)
```

#### POST /api/auth/refresh
Renovar access token via refresh_token cookie.

```
Headers:  X-Device-Id: uuid
Response: { "accessToken": "jwt..." }
```

#### POST /api/auth/logout
Revogar sessão.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: { "ok": true }
```

#### POST /api/sse/token
Gerar token temporário para SSE (30s).

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: { "token": "jwt-30s..." }
```

---

### Search

#### GET /v1/session?lat=&lng=
Detectar cidade.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: { "cityId": 4926, "name": "RS - Porto Alegre" }
```

#### GET /v1/search?q=&a=&lat=&lng=
Buscar rotas por nome (max 20 resultados).

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: [{
  "routeCode": "398",
  "routeMnemonic": "PINHEIRO",
  "serviceMnemonic": "Pinheiro - Bairro/Centro",
  "id": "0ebdad7f-...",          // ← ESTE É O serviceId
  "activeVehicles": 2,
  "scheduledVehicles": 0,
  "hasRealTime": true,
  "modal": 0
}]
```

**Importante:** O campo `id` da resposta é o `serviceId`.

#### GET /v1/viewport/recommendation?lat=&lng=
Zoom ideal baseado na densidade de pontos.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: {
  "type": "ZOOM",
  "lat": -30.057,
  "lng": -51.192,
  "radiusMeters": 170.47
}
```

Zoom do mapa: `zoom = log2(156543.03392 * cos(lat) / radiusMeters)`

---

### Stops

#### GET /v1/stops/viewport?nelat=&nelng=&swlat=&swlng=
Paradas dentro de um retângulo geográfico.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: [{
  "id": "uuid",
  "mnemonic": "R. Barão do Amazonas 1049, Petrópolis, Porto Alegre...",
  "location": { "lat": -30.052, "lng": -51.188 },
  "bearing": 208,
  "status": "OK",
  "kind": 1,            // 1=parada, 2=terminal, 3=estação
  "routeTypes": 1,      // 1=ônibus, 2=metro, 3=trem, 4=balsa
  "modal": 0            // 0=convencional, 1=expresso, 2=BRT
}]
```

#### GET /v1/stops/service/:serviceId
Todas as paradas de uma linha + polilinha.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: {
  "polyline": "fq|vDzkzvHiAwBdFsDjClFeC|B_B~@...",
  "stops": [{
    "id": "uuid",
    "mnemonic": "R. Derly Ferreira de Paula 5, Lomba do Pinheiro...",
    "location": { "lat": -30.134, "lng": -51.094 },
    "bearing": 63,
    "status": "OK",
    "kind": 1
  }]
}
```

---

### Services

#### GET /v1/services/:serviceId
Detalhes de um serviço/rota.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: {
  "routeCode": "398",
  "routeMnemonic": "PINHEIRO",
  "serviceMnemonic": "Pinheiro - Bairro/Centro",
  "activeVehicles": 2,
  "scheduledVehicles": 0,
  "hasRealTime": true,
  "estimatedInterval": null,
  "totalTravelTimeUntilStopSeconds": null,
  "modal": 0
}
```

#### GET /v1/routes/:routeId/services
Todos os serviços de uma rota (sentidos).

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: [{
  "id": "0ebe2b5b-...",
  "serviceMnemonic": "Rápida Bento - Bairro/Centro"
}]
```

**Importante:** Usa `routeId`, não `serviceId`.

---

### Predictions

#### GET /v1/predictions/stop/:stopId
Todas as rotas de uma parada com previsões.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: {
  "messages": [],
  "alerts": [],
  "services": [{
    "routeCode": "398",
    "routeMnemonic": "PINHEIRO",
    "serviceMnemonic": "Pinheiro - Bairro/Centro",
    "serviceId": "0ebdad7f-...",
    "stopId": "8a5197b2-...",
    "activeVehicles": 2,
    "scheduledVehicles": 0,
    "hasRealTime": true,
    "totalTravelTimeUntilStopSeconds": 2068,
    "vehicles": [{
      "prefix": "3395",
      "lat": -30.06,
      "lng": -51.19,
      "bearing": 301,
      "averageSpeed": 5.8,
      "prediction": 0,
      "type": null,
      "wheelchair": false,
      "climatized": false
    }]
  }]
}
```

#### GET /v1/predictions/:serviceId/:stopId
Previsão detalhada de um serviço em uma parada.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: {
  "routeCode": "398",
  "serviceMnemonic": "Pinheiro - Bairro/Centro",
  "activeVehicles": 2,
  "hasRealTime": true,
  "totalTravelTimeUntilStopSeconds": 2068,
  "vehicles": [{
    "id": "3395",
    "prefix": "3395",
    "plate": "",
    "lat": -30.06,
    "lng": -51.19,
    "bearing": 301,
    "averageSpeed": 5.8,
    "lastUpdate": 1782075681000,
    "type": null,
    "prediction": 0,
    "predictionSeconds": 0,
    "predictionToTripEnd": 0,
    "wheelchair": false,
    "climatized": false,
    "graphEdgePercentage": 0.89,
    "transitServiceStopSequence": 46,
    "distanceToNextStop": 0,
    "distanceFromPreviousStop": 0,
    "distanceMovedLastUpdate": 0,
    "tripNumber": 0,
    "age": 0,
    "cars": null,
    "tags": []
  }]
}
```

#### GET /v1/predictions/departure?serviceId=&date=&time=
Horários de saída por data.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: [{ "departureTimestamp": 1782029700000 }]
```

---

### SSE (Real-time)

#### GET /live/vehicles/:serviceId?sseToken=
Veículos em tempo real. Polling a cada 5s no backend.

```
Headers:  X-Device-Id: uuid
Response:
data: [{"tripNumber":0,"firstSeen":0,"transitStopId":null,"transitServiceStopSequence":46,"stopSequence":0,"oldLatitude":0,"oldLongitude":0,"graphEdgePercentage":0.058,"distanceToNextStop":0,"distanceFromFirstPoint":0,"distanceFromPreviousStop":0,"distanceMovedLastUpdate":0,"transitAgencyId":null,"transitServiceId":null,"transitTimetableEntryId":null,"realtimeServiceId":null,"predictionSeconds":0,"predictionToTripEnd":0,"plate":"","prefix":"3395","ts":0,"lat":-30.061,"lng":-51.189,"bearing":301,"wheelchair":false,"climatized":false,"prediction":0,"age":0,"type":null,"lastUpdate":1782074749000,"averageSpeed":3.17,"cars":null,"tags":[],"id":"3395"}]
```

**Campos do veículo:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID do veículo |
| `prefix` | string | Prefixo visível no mapa |
| `plate` | string | Placa (pode ser vazia) |
| `lat` | float | Latitude atual |
| `lng` | float | Longitude atual |
| `bearing` | int | Direção em graus (0-360) |
| `averageSpeed` | float | Velocidade em km/h |
| `lastUpdate` | int | Timestamp ms da última atualização |
| `age` | int | Idade em minutos |
| `type` | string\|null | `null`=GPS ativo, `"MESSAGE"`=tempo real, `"SCHEDULE"`=agendado |
| `prediction` | int | Previsão de chegada no próximo ponto (segundos) |
| `predictionSeconds` | int | Mesmo que prediction |
| `predictionToTripEnd` | int | Previsão até o final (segundos) |
| `wheelchair` | bool | Acessível para cadeirantes |
| `climatized` | bool | Ar condicionado |
| `graphEdgePercentage` | float | % da rota percorrida (0.0-1.0) |
| `transitServiceStopSequence` | int | Sequência atual na rota |
| `distanceToNextStop` | float | Distância ao próximo ponto (metros) |
| `distanceFromPreviousStop` | float | Distância do ponto anterior (metros) |
| `distanceMovedLastUpdate` | float | Distância percorrida desde última atualização (metros) |
| `tripNumber` | int | Número da viagem |
| `transitStopId` | string\|null | Próximo stop UUID |
| `transitTimetableEntryId` | string\|null | ID do horário agendado |
| `realtimeServiceId` | string\|null | ID GTFS-RT |
| `transitAgencyId` | string\|null | UUID da agência |
| `transitServiceId` | string\|null | UUID do serviço |
| `firstSeen` | int | Timestamp de primeira vez visto |
| `stopSequence` | int | Sequência do ponto atual |
| `oldLatitude` | float | Latitude anterior |
| `oldLongitude` | float | Longitude anterior |
| `cars` | array\|null | Informações de vagões (trem/metrô) |
| `tags` | array | Tags de classificação |

**Status do veículo:**

| type | Status | lat/lng |
|------|--------|---------|
| `null` | 🟢 GPS ativo | Posição real |
| `"MESSAGE"` | 🟢 Tempo real | Posição real |
| `"SCHEDULE"` | 🔴 Agendado | 0.0, 0.0 |

#### GET /live/predictions/:stopId?sseToken=
Previsões em tempo real.

```
Headers:  X-Device-Id: uuid
Response:
data: [{"routeCode":"398","vehicles":[...],"totalTravelTimeUntilStopSeconds":2068}]
```

---

### Notifications

#### POST /v1/notifications/subscribe
Criar notificação push para uma parada.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Request:  {
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": { "p256dh": "...", "auth": "..." }
  },
  "stopId": "uuid",
  "serviceId": "uuid",          // opcional
  "notifyOnApproach": true,     // avisa quando ônibus se aproxima
  "notifyScheduled": false      // avisa quando tem horário agendado
}
Response: { "id": "uuid" }
```

Dados persistidos no Upstash Redis com TTL de 30 dias.

#### DELETE /v1/notifications/:id
Remover notificação.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: { "ok": true }
```

#### GET /v1/notifications/stop/:stopId
Listar notificações de uma parada.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: [{
  "id": "uuid",
  "stopId": "uuid",
  "serviceId": "uuid",
  "notifyOnApproach": true,
  "notifyScheduled": false,
  "createdAt": 1782075000000
}]
```

#### GET /v1/notifications
Listar notificações próprias do dispositivo.

```json
Headers: Authorization: Bearer <token>, X-Device-Id: uuid
Response: [{
  "id": "uuid",
  "stopId": "uuid",
  "serviceId": "uuid",
  "deviceId": "uuid",
  "notifyOnApproach": true,
  "notifyScheduled": false,
  "createdAt": 1782075000000
}]
```

#### GET /v1/vapid-public-key
Chave pública VAPID para Web Push.

```
Headers:  Authorization: Bearer <token>, X-Device-Id: uuid
Response: { "publicKey": "BGlfhfkLIZdQZQ713T0Sjoygu4mpgoukk..." }
```

---

## Autenticação

### Fluxo Completo

```
1. Frontend gera deviceId (crypto.randomUUID())
   Salva no IndexedDB

2. POST /api/auth/register { deviceId }
   → { accessToken, sessionId }
   → Set-Cookie: refresh_token (HttpOnly, 24h)

3. Todo request REST:
   Authorization: Bearer <accessToken>
   X-Device-Id: <deviceId>

4. Renovar (a cada 15min ou no refresh):
   POST /api/auth/refresh
   → novo accessToken + novo refresh_token no cookie

5. SSE:
   POST /api/sse/token → { token: "jwt-30s" }
   GET /live/vehicles/:id?sseToken=<token>
```

### Segurança

- Access Token: JWT HS256, 15min
- Refresh Token: Rotativo, 24h, HttpOnly/Secure/SameSite=Strict
- SSE Token: JWT de 30 segundos (single use)
- Device ID: vinculado à sessão
- Security Headers: HSTS, X-Frame-Options, nosniff, no-referrer
- CORS: origem restrita via env

## Resiliência

- **Circuit Breaker**: 5 falhas consecutivas → abre por 30s
- **Request Dedup**: requests simultâneos aguardam a mesma Promise
- **Stale While Revalidate**: se Cittamobi cair, retorna último dado válido
- **Timeout**: 8s por request (AbortSignal)
- **Backpressure SSE**: descarta eventos se buffer > 1KB
- **Memory Cleanup**: sessões expiram em 24h, cache em 5min
- **Graceful Shutdown**: fecha SSE, pollers, Fastify
- **Error Handlers**: uncaughtException + unhandledRejection logados
- **Metrics**: totalRequests, cittamobiRequests, activePollers, activeSSEConnections

---

## Arquitetura

```
src/
├── index.ts                          # Entry point + graceful shutdown + error handlers
├── app/
│   ├── server.ts                     # Fastify + plugins + routes + metrics + healthcheck
│   └── env.ts                        # Env vars (todas obrigatórias)
├── security/
│   ├── jwt.ts                        # JWT create/verify (HS256)
│   ├── session.store.ts              # Sessions em Map (24h TTL + cleanup)
│   ├── sse-token.ts                  # Tokens 30s para SSE
│   ├── cookies.ts                    # HttpOnly cookies
│   └── fingerprint.ts               # Hash de user-agent
├── middleware/
│   ├── auth.middleware.ts            # Valida JWT + X-Device-Id
│   ├── security-headers.ts          # HSTS, X-Frame-Options
│   └── validate.middleware.ts       # Zod validation
├── infrastructure/
│   ├── cittamobi/
│   │   ├── client.ts                 # HTTP client (timeout, circuit breaker, dedup, stale)
│   │   ├── circuit.ts                # Circuit breaker (5 falhas → 30s open)
│   │   └── endpoints.ts              # URLs da API Cittamobi
│   └── cache/
│       ├── dedup.ts                  # Request deduplication
│       └── stale.ts                  # Stale while revalidate (30s)
├── modules/
│   ├── auth/                         # Register, refresh, logout, SSE token
│   ├── search/                       # Session, search, viewport
│   ├── vehicles/                     # REST + SSE vehicles (backpressure)
│   ├── predictions/                  # REST + SSE predictions (backpressure)
│   ├── services/                     # Service details + stops
│   └── notifications/                # Web Push + Upstash Redis (TTL 30d)
└── shared/
    ├── errors/                       # AppError, NotFoundError
    ├── types/                        # Re-exports
    ├── utils/                        # sleep, formatDate
    ├── logger/                       # Logger
    ├── metrics.ts                    # Métricas em memória
    └── constants/                    # Polling intervals
```

## Consumo Estimado

| Cenário | RAM | CPU | Requests Cittamobi |
|---------|-----|-----|-------------------|
| 10 usuários, 5 rotas | ~50 MB | mínimo | 5 req/5s |
| 100 usuários, 40 rotas | ~60 MB | baixo | 8 req/s |
| 500 usuários, 200 rotas | ~70 MB | moderado | 40 req/s |

