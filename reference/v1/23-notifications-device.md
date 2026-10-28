# GET /v1/notifications

Listar notificações próprias do dispositivo autenticado.

## Request

```http
GET /v1/notifications
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
    "createdAt": 1782075000000
  }
]
```

## Uso

Listar todas as inscrições de push associadas ao `deviceId` da sessão autenticada.

Retorna um array vazio `[]` quando não há inscrições para o dispositivo.

## Observações

- Apenas inscrições do próprio dispositivo são retornadas (filtro por `deviceId`).
- Dados persistidos no Upstash Redis com TTL de 30 dias.