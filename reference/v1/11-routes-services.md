# GET /v1/routes/:routeId/services

Todos os serviços/.sentidos de uma rota.

## Request

```http
GET /v1/routes/089cf755-d280-11f0-a0e6-02001705c31d/services
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Path Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| routeId | string | ✅ | UUID da rota (**NÃO** serviceId) |

## Response

```json
[
  {
    "id": "0ebe2b5b-d280-11f0-a0e6-02001705c31d",
    "serviceMnemonic": "Rápida Bento - Bairro/Centro",
    "tags": []
  },
  {
    "id": "0ebe28ec-d280-11f0-a0e6-02001705c31d",
    "serviceMnemonic": "Rápida Bento - Centro/Bairro",
    "tags": []
  }
]
```

## Importante

- Usa `routeId`, **NÃO** `serviceId`
- Uma rota pode ter múltiplos serviços (sentidos)
- Cada serviço tem seu próprio `id` (serviceId)
