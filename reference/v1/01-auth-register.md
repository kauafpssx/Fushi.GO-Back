# POST /api/auth/register

Criar sessão. Retorna accessToken e seta refresh_token no cookie.

## Request

```http
POST /api/auth/register
Content-Type: application/json

{
  "deviceId": "uuid-gerado-pelo-frontend"
}
```

## Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "sessionId": "55f1204da06430ca275374dfca8cda57"
}
```

## Cookie Setado

```
refresh_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| accessToken | string | JWT válido por 15 minutos |
| sessionId | string | ID da sessão (24h de vida) |
