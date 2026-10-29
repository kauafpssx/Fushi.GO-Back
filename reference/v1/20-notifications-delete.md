# DELETE /v1/notifications/:id

Remover notificação.

## Request

```http
DELETE /v1/notifications/70c2496b-3d77-48aa-8d7b-71d99f86bdf4
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Response

```json
{
  "ok": true
}
```

## Segurança

A exclusão é restrita ao proprietário da inscrição. O `deviceId` da sessão autenticada é comparado com o `deviceId` armazenado na inscrição. Se não coincidirem, a requisição é rejeitada com erro de não autorizado.

- Se a inscrição não existir, a operação é tratada como bem-sucedida (idempotente).
- Se outra tentativa de excluir uma inscrição de outro dispositivo for feita, retorna `401 Unauthorized`.
