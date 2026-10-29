# GET /v1/services/:serviceId

Detalhes de um serviço/rota.

## Request

```http
GET /v1/services/0ebdad7f-d280-11f0-a0e6-02001705c31d
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
{
  "routeCode": "398",
  "routeMnemonic": "PINHEIRO",
  "serviceMnemonic": "Pinheiro - Bairro/Centro",
  "companyId": "075b0763-d280-11f0-a0e6-02001705c31d",
  "stopId": null,
  "serviceId": null,
  "routeId": "089cf755-d280-11f0-a0e6-02001705c31d",
  "id": "0ebdad7f-d280-11f0-a0e6-02001705c31d",
  "activeVehicles": 2,
  "scheduledVehicles": 0,
  "predictionType": null,
  "bgcolor": null,
  "fgcolor": null,
  "vehicles": [],
  "messages": [],
  "alerts": [],
  "hasRealTime": true,
  "estimatedInterval": null,
  "totalTravelTimeUntilStopSeconds": null,
  "modal": 0
}
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| routeCode | string | Código da rota |
| routeMnemonic | string | Nome curto |
| serviceMnemonic | string | Nome completo com direção |
| routeId | string | UUID da rota (usar em /routes/:routeId/services) |
| activeVehicles | int | Veículos ativos |
| hasRealTime | bool | Dados em tempo real disponíveis |
