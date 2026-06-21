# POST /api/auth/refresh

Renovar access token. Usa refresh_token do cookie.

## Request

```http
POST /api/auth/refresh
X-Device-Id: <deviceId>
Cookie: refresh_token=<token>
```

## Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Erros

| Status | Descrição |
|--------|-----------|
| 401 | Cookie ausente ou inválido |
| 401 | DeviceId não bate com sessão |
