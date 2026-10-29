# FushiGO API v1 — Reference Index

Backend 100% completo. 21 endpoints, 23 testes, 54 arquivos src.

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `00-overview.md` | Visão geral da API, todos os endpoints, fluxo de auth |
| `01-auth-register.md` | POST /api/auth/register |
| `02-auth-refresh.md` | POST /api/auth/refresh |
| `03-auth-logout.md` | POST /api/auth/logout |
| `04-sse-token.md` | POST /api/sse/token |
| `05-session.md` | GET /v1/session |
| `06-search.md` | GET /v1/search |
| `07-viewport-recommendation.md` | GET /v1/viewport/recommendation |
| `08-stops-viewport.md` | GET /v1/stops/viewport |
| `09-stops-service.md` | GET /v1/stops/service/:serviceId |
| `10-services-details.md` | GET /v1/services/:serviceId |
| `11-routes-services.md` | GET /v1/routes/:routeId/services |
| `12-predictions-stop.md` | GET /v1/predictions/stop/:stopId |
| `13-predictions-service-stop.md` | GET /v1/predictions/:serviceId/:stopId |
| `14-predictions-departure.md` | GET /v1/predictions/departure |
| `15-vehicles.md` | GET /v1/vehicles/service/:serviceId |
| `16-sse-vehicles.md` | GET /live/vehicles/:serviceId (SSE) |
| `17-sse-predictions.md` | GET /live/predictions/:stopId (SSE) |
| `18-notifications-subscribe.md` | POST /v1/notifications/subscribe |
| `19-notifications-delete.md` | DELETE /v1/notifications/:id |
| `20-notifications-list.md` | GET /v1/notifications/stop/:stopId |
| `21-vapid-key.md` | GET /v1/vapid-public-key |
| `22-health.md` | GET /health |
| `23-notifications-device.md` | GET /v1/notifications (listar próprias) |
