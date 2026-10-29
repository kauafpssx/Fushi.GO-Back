# GET /v1/viewport/recommendation

Zoom ideal baseado na densidade de pontos.

## Request

```http
GET /v1/viewport/recommendation?lat=-30.057&lng=-51.192
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| lat | float | ✅ | Latitude |
| lng | float | ✅ | Longitude |

## Response

```json
{
  "type": "ZOOM",
  "lat": -30.057,
  "lng": -51.192,
  "radiusMeters": 170.47
}
```

## Uso no Mapa

Converter para zoom do mapa:
```
zoom = log2(156543.03392 * cos(lat) / radiusMeters)
```

- radius pequeno = área densa (centro) → zoom alto
- radius grande = área sparsa (subúrbio) → zoom baixo
