# POST /api/auth/logout

Revogar sessão.

## Request

```http
POST /api/auth/logout
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
{
  "ok": true
}
```
