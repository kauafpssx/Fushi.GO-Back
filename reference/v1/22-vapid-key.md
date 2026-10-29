# GET /v1/vapid-public-key

Chave pública VAPID para Web Push.

## Request

```http
GET /v1/vapid-public-key
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
{
  "publicKey": "BGlfhfkLIZdQZQ713T0Sjoygu4mpgoukkJSEN9jDm-Ul5iP_JqszlRZgeh0BpXmAn6WboINXOcQZayA1zA92GE8"
}
```

## Uso

Usar com `web-push` library no frontend para solicitar permissão de notificação:

```js
const { publicKey } = await fetch('/v1/vapid-public-key', {
  headers: { 'Authorization': `Bearer ${token}`, 'X-Device-Id': deviceId }
}).then(r => r.json());

const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicKey),
});

// Enviar subscription para o backend
await fetch('/v1/notifications/subscribe', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'X-Device-Id': deviceId, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    stopId: selectedStopId,
    notifyOnApproach: true,
  }),
});
```
