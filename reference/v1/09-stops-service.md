# GET /v1/stops/service/:serviceId

Todas as paradas de uma linha + polilinha (ida + volta, sem paginação).

## Request

```http
GET /v1/stops/service/0ebdad7f-d280-11f0-a0e6-02001705c31d
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Path Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| serviceId | string | ✅ | UUID do serviço |

## Response

```json
{
  "polyline": "fq|vDzkzvHiAwBdFsDjClFeC|B_B~@...",
  "stops": [
    {
      "id": "3a6f945b-9aaa-45db-90a6-875d4733928a",
      "remoteId": null,
      "mnemonic": "R. Derly Ferreira de Paula 5, Lomba do Pinheiro...",
      "location": {
        "lat": -30.134123,
        "lng": -51.094543
      },
      "bearing": 63,
      "status": "OK",
      "kind": 1,
      "routeTypes": 1,
      "modal": 0
    }
  ]
}
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| polyline | string | Polilinha codificada (Google Polyline Encoding) |
| stops | array | Array de paradas em ordem cronológica |
| stops[].id | string | UUID da parada |
| stops[].mnemonic | string | Endereço da parada |
| stops[].location.lat | float | Latitude |
| stops[].location.lng | float | Longitude |

## Decodificar Polilinha

Usar lib como `@mapbox/polyline`:
```js
import { decode } from '@mapbox/polyline';
const coordinates = decode(polyline);
```
