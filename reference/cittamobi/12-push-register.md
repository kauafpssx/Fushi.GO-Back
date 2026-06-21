# 🚌 REQUEST 13 — Registro Firebase Push
## POST /push/firebase/register

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://api.cittamobi.com.br/push/firebase/register` |
| **Método** | POST |
| **Auth** | Nenhuma (opcional) |
| **Descrição** | Registra dispositivo para notificações push |

---

## 📤 REQUEST

### Headers
```http
Content-Type: application/json
```

### Body
```json
{
  "token": "fcm_token_aqui...",
  "deviceId": "device_id_aqui...",
  "platform": "android"
}
```

### Campos do Body

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `token` | string | ✅ | Token FCM do dispositivo |
| `deviceId` | string | ✅ | ID único do dispositivo |
| `platform` | string | ✅ | Plataforma (`"android"`, `"ios"`) |

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response
```
true
```

**Nota**: A response é apenas `true` (booleano), não um objeto JSON.

---

## 💡 QUANDO USAR

Este endpoint é usado para:
- **Notificações**: Receber avisos sobre atrasos, cancelamentos
- **Alertas**: Notificar quando o ônibus está próximo
- **Atualizações**: Informar sobre mudanças de rota

---

## ⚠️ IMPORTANTE

- **Este endpoint NÃO é necessário** para o website funcionar
- **É usado apenas pelo app mobile** para receber notificações
- **Opcional**: Só implementar se quiser notificações no navegador
- **FCM**: Firebase Cloud Messaging (necessário configurar projeto Firebase)

---

## 💡 IMPLEMENTAÇÃO OPCIONAL (Web Push)

```javascript
async function registrarPush() {
  // Solicitar permissão
  const permissao = await Notification.requestPermission();
  
  if (permissao === 'granted') {
    // Registrar no Firebase
    const registration = await navigator.serviceWorker.ready;
    const token = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'sua-chave-publica-vapid'
    });
    
    // Enviar para o servidor
    await fetch('https://api.cittamobi.com.br/push/firebase/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        deviceId: 'web_' + Math.random().toString(36).substr(2, 9),
        platform: 'web'
      })
    });
    
    console.log('Push registrado!');
  }
}
```

---

## ⚠️ CUIDADOS

1. **Não necessário**: O website funciona sem push
2. **Firebase**: Necessário criar projeto no Firebase Console
3. **VAPID Key**: Precisa gerar chave pública/privada
4. **Service Worker**: Necessário para receber push no navegador
5. **Permissão**: Usuário deve aceitar notificações
