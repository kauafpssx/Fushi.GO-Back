# GET /v1/vehicles/service/:serviceId

Veículos em tempo real (REST). Retorna array de veículos.

## Request

```http
GET /v1/vehicles/service/0ebdad7f-d280-11f0-a0e6-02001705c31d
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
[
  {
    "tripNumber": 0,
    "firstSeen": 0,
    "transitStopId": null,
    "transitServiceStopSequence": 46,
    "stopSequence": 0,
    "oldLatitude": 0,
    "oldLongitude": 0,
    "graphEdgePercentage": 0.058,
    "distanceToNextStop": 0,
    "distanceFromFirstPoint": 0,
    "distanceFromPreviousStop": 0,
    "distanceMovedLastUpdate": 0,
    "transitAgencyId": null,
    "transitServiceId": null,
    "transitTimetableEntryId": null,
    "realtimeServiceId": null,
    "predictionSeconds": 0,
    "predictionToTripEnd": 0,
    "plate": "",
    "prefix": "3395",
    "ts": 0,
    "lat": -30.061,
    "lng": -51.189,
    "bearing": 301,
    "wheelchair": false,
    "climatized": false,
    "prediction": 0,
    "age": 0,
    "type": null,
    "lastUpdate": 1782074749000,
    "averageSpeed": 3.17,
    "cars": null,
    "tags": [],
    "id": "3395"
  }
]
```

## Status do Veículo

| type | Status | lat/lng |
|------|--------|---------|
| null | 🟢 GPS ativo | Posição real |
| "MESSAGE" | 🟢 Tempo real | Posição real |
| "SCHEDULE" | 🔴 Agendado | 0.0, 0.0 |

## Array Vazio

Se não há veículos, retorna `[]`.
