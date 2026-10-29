# GET /v1/notifications/:id/status

Consulta o status da inscrição de notificação para o frontend saber o estado atual (útil para o sino/indicador).

## Request

```http
GET /v1/notifications/70c2496b-3d77-48aa-8d7b-71d99f86bdf4/status
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
{
  "id": "70c2496b-3d77-48aa-8d7b-71d99f86bdf4",
  "stopId": "8a5197b2-d51d-49f5-8d30-d6a645a75685",
  "serviceId": "0ebdad7f-d280-11f0-a0e6-02001705c31d",
  "lastNotified": 1761760000000,
  "lastNotifiedState": "approaching",
  "lastNotifiedPrefix": "2491",
  "lastNotifiedPrediction": 180,
  "lastNotifiedMinute": 3,
  "notifyOnApproach": true,
  "notifyScheduled": false,
  "enableDepartureReminder": true,
  "createdAt": 1761758000000
}
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| lastNotifiedState | string \| null | Estado da última notificação: `normal`, `approaching`, `imminent`, `arrived`, `departureReminder` |
| lastNotifiedPrefix | string \| null | Prefixo do ônibus notificado |
| lastNotifiedPrediction | number \| null | Previsão em segundos na última notificação |
| lastNotifiedMinute | number \| null | Minutos arredondados na última notificação |

## Observações

- Somente o proprietário (mesmo `deviceId`) pode consultar
- Retorna 404 se não existir ou não pertencer ao dispositivo
