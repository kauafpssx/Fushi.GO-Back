# GET /v1/notifications/stop/:stopId

Listar notificações de uma parada.

## Request

```http
GET /v1/notifications/stop/8a5197b2-d51d-49f5-8d30-d6a645a75685?serviceId=0ebdad7f-d280-11f0-a0e6-02001705c31d
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
[
  {
    "id": "70c2496b-3d77-48aa-8d7b-71d99f86bdf4",
    "stopId": "8a5197b2-d51d-49f5-8d30-d6a645a75685",
    "serviceId": "0ebdad7f-d280-11f0-a0e6-02001705c31d",
    "deviceId": "device-123",
    "notifyOnApproach": true,
    "notifyScheduled": false,
    "createdAt": 1782075000000,
    "lastNotified": 1782075300000
  }
]
```

## Uso

Verificar se o usuário já tem notificação ativa para uma parada.

O campo `deviceId` está incluído na resposta para identificação do proprietário da inscrição.

## Query

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `serviceId` | string | ❌ | Filtra o índice da parada pelo serviço. Para inscrições vinculadas a serviço, deve ser informado |

O endpoint consulta um índice exato `stopId + serviceId`; omitir `serviceId` não agrega inscrições de todos os serviços.
