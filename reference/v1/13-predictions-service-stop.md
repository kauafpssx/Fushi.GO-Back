# GET /v1/predictions/:serviceId/:stopId

Previsão detalhada de um serviço específico em uma parada.

## Request

```http
GET /v1/predictions/0ebdad7f-d280-11f0-a0e6-02001705c31d/8a5197b2-d51d-49f5-8d30-d6a645a75685
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
{
  "routeCode": "398",
  "routeMnemonic": "PINHEIRO",
  "serviceMnemonic": "Pinheiro - Bairro/Centro",
  "companyId": "075b0763-...",
  "stopId": "8a5197b2-...",
  "serviceId": "0ebdad7f-...",
  "routeId": "089cf755-...",
  "id": null,
  "activeVehicles": 2,
  "scheduledVehicles": 0,
  "predictionType": "ARRIVAL",
  "bgcolor": null,
  "fgcolor": null,
  "vehicles": [
    {
      "id": "3395",
      "prefix": "3395",
      "plate": "",
      "lat": -30.06,
      "lng": -51.19,
      "bearing": 301,
      "averageSpeed": 5.8,
      "lastUpdate": 1782075681000,
      "age": 0,
      "type": null,
      "prediction": 120,
      "predictionSeconds": 120,
      "predictionToTripEnd": 3600,
      "wheelchair": false,
      "climatized": false,
      "graphEdgePercentage": 0.89,
      "transitServiceStopSequence": 46,
      "distanceToNextStop": 150,
      "distanceFromPreviousStop": 200,
      "distanceMovedLastUpdate": 50,
      "tripNumber": 1,
      "transitStopId": "...",
      "transitTimetableEntryId": null,
      "realtimeServiceId": null,
      "transitAgencyId": null,
      "transitServiceId": null,
      "firstSeen": 1782074000000,
      "stopSequence": 0,
      "oldLatitude": 0,
      "oldLongitude": 0,
      "ts": 0,
      "cars": null,
      "tags": []
    }
  ],
  "messages": [],
  "alerts": [],
  "hasRealTime": true,
  "estimatedInterval": null,
  "totalTravelTimeUntilStopSeconds": 2100,
  "modal": 0
}
```

## Campos do Veículo

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | ID do veículo |
| prefix | string | Prefixo visível no mapa |
| plate | string | Placa (pode ser vazia) |
| lat | float | Latitude atual |
| lng | float | Longitude atual |
| bearing | int | Direção (0-360) |
| averageSpeed | float | Velocidade em km/h |
| lastUpdate | int | Timestamp ms |
| type | string\|null | null=GPS, "MESSAGE"=tempo real, "SCHEDULE"=agendado |
| prediction | int | Segundos até chegar neste ponto |
| wheelchair | bool | Acessível para cadeirantes |
| climatized | bool | Ar condicionado |
| graphEdgePercentage | float | % da rota percorrida (0.0-1.0) |
