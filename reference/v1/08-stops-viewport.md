# GET /v1/stops/viewport

Paradas dentro de um retângulo geográfico (bounding box).

## Request

```http
GET /v1/stops/viewport?nelat=-30.050&nelng=-51.185&swlat=-30.065&swlng=-51.200
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| nelat | float | ✅ | Latitude nordeste |
| nelng | float | ✅ | Longitude nordeste |
| swlat | float | ✅ | Latitude sudoeste |
| swlng | float | ✅ | Longitude sudoeste |

## Response

```json
[
  {
    "id": "275507c3-7aba-41bc-a157-8c2311b838e6",
    "remoteId": null,
    "mnemonic": "R. Barão do Amazonas 1049, Petrópolis, Porto Alegre...",
    "location": {
      "lat": -30.052923,
      "lng": -51.18821
    },
    "bearing": 208,
    "status": "OK",
    "kind": 1,
    "services": [],
    "remoteBusStops": null,
    "officialBusStop": null,
    "origin": null,
    "routeTypes": 1,
    "modal": 0
  }
]
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | UUID da parada |
| mnemonic | string | Endereço/nome da parada |
| location.lat | float | Latitude |
| location.lng | float | Longitude |
| bearing | int | Direção em graus (0-360) |
| status | string | "OK" = ativa |
| kind | int | 1=parada, 2=terminal, 3=estação |
| routeTypes | int | 1=ônibus, 2=metro, 3=trem, 4=balsa |
| modal | int | 0=convencional, 1=expresso, 2=BRT |

## Uso no Frontend

Chamar a cada movimento do mapa (debounce 300ms):
```js
map.on('moveend', debounce(() => {
  const bounds = map.getBounds();
  fetchStops(bounds.getNorthEast(), bounds.getSouthWest());
}, 300));
```
