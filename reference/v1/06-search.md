# GET /v1/search

Buscar rotas por nome (max 20 resultados).

## Request

```http
GET /v1/search?q=pinheiro&a=4926&lat=-30.057&lng=-51.192
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| q | string | ✅ | Termo de busca (nome da rota, bairro, rua) |
| a | string | ❌ | cityId (obtido do /session) |
| lat | float | ❌ | Latitude do usuário |
| lng | float | ❌ | Longitude do usuário |

## Response

```json
[
  {
    "routeCode": "398",
    "routeMnemonic": "PINHEIRO",
    "serviceMnemonic": "Pinheiro - Bairro/Centro",
    "companyId": null,
    "stopId": null,
    "serviceId": null,
    "routeId": null,
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
]
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| routeCode | string | Código da rota (ex: "398") |
| routeMnemonic | string | Nome curto da rota |
| serviceMnemonic | string | Nome completo com direção |
| id | string | **ESTE É O serviceId** (usar em outros endpoints) |
| activeVehicles | int | Veículos com GPS ativo |
| scheduledVehicles | int | Veículos agendados |
| hasRealTime | bool | Se tem dados em tempo real |
| modal | int | 0=convencional, 1=expresso, 2=BRT |

## Importante

O campo `id` da resposta é o `serviceId` para usar em:
- `/v1/vehicles/service/:serviceId`
- `/v1/stops/service/:serviceId`
- `/v1/predictions/:serviceId/:stopId`
- `/live/vehicles/:serviceId`
