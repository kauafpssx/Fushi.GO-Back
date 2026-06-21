# POST /api/sse/token

Gerar token temporário para SSE (30 segundos de validade, single use).

## Request

```http
POST /api/sse/token
Authorization: Bearer <token>
X-Device-Id: <deviceId>
Content-Type: application/json

{}
```

## Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Uso

```js
const { token } = await fetch('/api/sse/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Device-Id': deviceId,
    'Content-Type': 'application/json',
  },
  body: '{}',
}).then(r => r.json());

const events = new EventSource(
  `/live/vehicles/${serviceId}?sseToken=${token}`
);
```
