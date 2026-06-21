# GET /v1/predictions/departure

Horários de saída por data.

## Request

```http
GET /v1/predictions/departure?serviceId=0ebdad7f-d280-11f0-a0e6-02001705c31d&date=2026-06-21&time=08:00
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| serviceId | string | ✅ | UUID do serviço |
| date | string | ✅ | Data (YYYY-MM-DD) |
| time | string | ❌ | Hora (HH:MM) |

## Response

```json
[
  { "departureTimestamp": 1782029700000 },
  { "departureTimestamp": 1782031500000 },
  { "departureTimestamp": 1782033300000 }
]
```

## Uso

Mostrar horários programados quando não há veículos com GPS ativo.
