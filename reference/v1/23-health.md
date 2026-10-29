# GET /health

Healthcheck com métricas. Público (sem auth).

## Request

```http
GET /health
```

## Response

```json
{
  "status": "ok",
  "uptime": "0d 2h 15m",
  "uptimeSeconds": 8100,
  "memory": {
    "rss": 86,
    "heap": 42,
    "heapTotal": 68
  },
  "metrics": {
    "totalRequests": 1234,
    "cittamobiRequests": 567,
    "activePollers": 17,
    "activeSSEConnections": 42,
    "cacheHits": 234,
    "cacheMisses": 12
  }
}
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| status | string | "ok" |
| uptime | string | Tempo ligado formatado |
| uptimeSeconds | int | Tempo ligado em segundos |
| memory.rss | int | RAM total em MB |
| memory.heap | int | Heap usado em MB |
| memory.heapTotal | int | Heap total em MB |
| metrics.totalRequests | int | Total de requests recebidos |
| metrics.cittamobiRequests | int | Requests feitos pro Cittamobi |
| metrics.activePollers | int | Pollers SSE ativos |
| metrics.activeSSEConnections | int | Conexões SSE abertas |
| metrics.cacheHits | int | Hits no cache |
| metrics.cacheMisses | int | Misses no cache |
