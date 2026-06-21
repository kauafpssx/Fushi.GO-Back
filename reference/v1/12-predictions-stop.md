# GET /v1/predictions/stop/:stopId

Todas as rotas que passam por uma parada com previsões e veículos.

## Request

```http
GET /v1/predictions/stop/8a5197b2-d51d-49f5-8d30-d6a645a75685
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
{
  "messages": [],
  "alerts": [],
  "services": [
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
          "prefix": "3395",
          "lat": -30.06,
          "lng": -51.19,
          "bearing": 301,
          "averageSpeed": 5.8,
          "prediction": 0,
          "type": null,
          "wheelchair": false,
          "climatized": false
        }
      ],
      "messages": [],
      "alerts": [],
      "hasRealTime": true,
      "estimatedInterval": null,
      "totalTravelTimeUntilStopSeconds": 2068,
      "modal": 0
    }
  ]
}
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| services | array | Todas as rotas da parada |
| services[].routeCode | string | Código da rota |
| services[].serviceId | string | ID do serviço |
| services[].vehicles | array | Veículos se aproximando |
| services[].totalTravelTimeUntilStopSeconds | int | Tempo até chegar (segundos) |
| services[].vehicles[].prediction | int | Segundos até chegar (0 = no ponto) |
| services[].vehicles[].type | string\|null | null=GPS, "SCHEDULE"=agendado |

## Uso

Mostrar lista de ônibus na parada com tempo de chegada.
