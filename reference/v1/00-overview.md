# FushiGO API v1

Base URL: `https://fushigo.kauafpss.com.br`

## Endpoints Públicos (sem auth)

| Metodo | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar sessão |
| POST | `/api/auth/refresh` | Renovar token |
| POST | `/api/auth/logout` | Revogar sessão |
| POST | `/api/sse/token` | Token temporário SSE |
| GET | `/health` | Healthcheck |

## Endpoints Protegidos (requer auth)

Todos os endpoints `/v1/*` requerem:
```
Authorization: Bearer <accessToken>
X-Device-Id: <deviceId>
```

| Metodo | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/v1/session` | Detectar cidade |
| GET | `/v1/search` | Buscar rotas |
| GET | `/v1/viewport/recommendation` | Zoom ideal |
| GET | `/v1/stops/viewport` | Paradas no mapa |
| GET | `/v1/stops/service/:serviceId` | Paradas da rota |
| GET | `/v1/services/:serviceId` | Detalhes do serviço |
| GET | `/v1/routes/:routeId/services` | Sentidos da rota |
| GET | `/v1/predictions/stop/:stopId` | Previsões da parada |
| GET | `/v1/predictions/:serviceId/:stopId` | Previsão detalhada |
| GET | `/v1/predictions/departure` | Horários por data |
| GET | `/v1/predictions/departure/schedule` | Horários agrupados por dia |
| GET | `/v1/vehicles/service/:serviceId` | Veículos REST |
| POST | `/v1/notifications/subscribe` | Criar notificação |
| DELETE | `/v1/notifications/:id` | Remover notificação |
| GET | `/v1/notifications` | Listar notificações próprias do dispositivo |
| GET | `/v1/notifications/stop/:stopId` | Notificações da parada |
| GET | `/v1/vapid-public-key` | Chave VAPID |

## Endpoints SSE (requer sseToken)

| Metodo | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/live/vehicles/:serviceId` | Veículos tempo real |
| GET | `/live/predictions/:stopId` | Previsões tempo real |

## Fluxo de Autenticação

```
1. Gerar deviceId (crypto.randomUUID())
2. POST /api/auth/register { deviceId }
   → { accessToken, sessionId }
   → Set-Cookie: refresh_token

3. Todo request:
   Authorization: Bearer <accessToken>
   X-Device-Id: <deviceId>

4. Renovar:
   POST /api/auth/refresh

5. SSE:
   POST /api/sse/token → { token }
   GET /live/vehicles/:id?sseToken=<token>
```
