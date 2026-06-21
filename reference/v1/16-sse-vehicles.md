# GET /live/vehicles/:serviceId

Veículos em tempo real via SSE. Polling a cada 5s no backend.

## Request

```http
GET /live/vehicles/0ebdad7f-d280-11f0-a0e6-02001705c31d?sseToken=<token>
X-Device-Id: <deviceId>
```

## Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| sseToken | string | ✅ | Token de 30s obtido em /api/sse/token |

## Response (SSE)

```
data: [{"prefix":"3395","lat":-30.06,"lng":-51.19,"averageSpeed":5.8,"bearing":301,"type":null,"wheelchair":false,"climatized":false}]

data: [{"prefix":"3395","lat":-30.062,"lng":-51.188,"averageSpeed":5.9,"bearing":301,"type":null,"wheelchair":false,"climatized":false}]
```

## Uso no Frontend

```js
// 1. Obter token
const { token } = await fetch('/api/sse/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Device-Id': deviceId,
    'Content-Type': 'application/json',
  },
  body: '{}',
}).then(r => r.json());

// 2. Conectar SSE
const events = new EventSource(
  `/live/vehicles/${serviceId}?sseToken=${token}`
);

events.onmessage = (e) => {
  const vehicles = JSON.parse(e.data);
  updateMapMarkers(vehicles);
};

events.onerror = () => {
  // EventSource reconecta automaticamente
  // Mas o sseToken expira em 30s
  // Precisa obter novo token e reconectar
};
```

## Campos

Mesmos do endpoint REST (ver 15-vehicles.md).

## Comportamento

- Backend faz polling a cada 5s no Cittamobi
- Só envia dados se mudaram (dedup)
- Backend compartilha poller entre múltiplos clientes
- Quando todos saem, poller continua 120s e depois é destruído
- Heartbeat a cada 30s para manter conexão viva
