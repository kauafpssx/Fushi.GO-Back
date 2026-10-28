# POST /v1/notifications/subscribe

Criar inscrição de notificação push para uma parada.

## Request

```http
POST /v1/notifications/subscribe
Authorization: Bearer <token>
X-Device-Id: <deviceId>
Content-Type: application/json

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "stopId": "8a5197b2-d51d-49f5-8d30-d6a645a75685",
  "serviceId": "0ebdad7f-d280-11f0-a0e6-02001705c31d",
  "notifyOnApproach": true,
  "notifyScheduled": false
}
```

## Body

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| subscription | object | ✅ | Subscription do Push API |
| subscription.endpoint | string | ✅ | Endpoint FCM (deve ser URL válida) |
| subscription.keys.p256dh | string | ✅ | Chave pública P-256 |
| subscription.keys.auth | string | ✅ | Chave de autenticação |
| stopId | string | ✅ | UUID da parada |
| serviceId | string | ❌ | UUID do serviço (opcional) |
| notifyOnApproach | bool | ❌ | Avisa quando ônibus se aproxima (default: true) |
| notifyScheduled | bool | ❌ | Avisa quando tem horário agendado (default: false) |

O `deviceId` é extraído automaticamente do cabeçalho `X-Device-Id` e associado à inscrição para controle de propriedade.

## Validação

O corpo da requisição é validado com Zod:
- `subscription.endpoint` deve ser uma URL válida
- `subscription.keys.p256dh` e `subscription.keys.auth` devem ser strings não vazias
- `stopId` e `serviceId` (quando informado) devem ser UUIDs válidos

## Response

```json
{
  "id": "70c2496b-3d77-48aa-8d7b-71d99f86bdf4"
}
```

## Observações

- Dados persistidos no Upstash Redis com TTL de 30 dias
- Se não houver mais atividade, expira automaticamente
- O `deviceId` da sessão autenticada é armazenado com a inscrição para permitir exclusão apenas pelo proprietário
