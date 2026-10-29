# GET /v1/session

Detectar cidade por localização.

## Request

```http
GET /v1/session?lat=-30.057&lng=-51.192
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| lat | float | ✅ | Latitude |
| lng | float | ✅ | Longitude |

## Response

```json
{
  "cityId": 4926,
  "name": "RS - Porto Alegre"
}
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| cityId | int | ID da cidade (usar no parâmetro `a` do search) |
| name | string | Nome da cidade com estado |
