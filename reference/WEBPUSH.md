# 🔔 Web Push Notifications — Guia Completo

## 📋 Visão Geral

Sistema de notificações via navegador para alertar o usuário sobre eventos importantes do ônibus. **Não substitui WebSocket** — é complementar.

---

## 🎯 Regra de Ouro

> **Web Push = Alertas importantes**
> **WebSocket = Tracking em tempo real**

Nunca mande notificação a cada minuto. Use push apenas em **eventos pontuais**.

---

## ⚠️ Por que NÃO enviar a cada 1 minuto

| Problema | Consequência |
|----------|--------------|
| Spam | Usuário bloqueia notificações |
| Bateria | Drena bateria do celular |
| Dados | Consome dados desnecessariamente |
| UX | Experiência ruim = abandono |
| Chrome | Pode limitar/bloquear seu push |

**Solução**: Web Push para **3-5 eventos importantes**, WebSocket para tracking contínuo.

---

## ✅ Eventos que JUSTIFICAM notificação

### Nível 1 — Críticos (sempre notificar)
| Evento | Exemplo | Quando |
|--------|---------|--------|
| Ônibus chegando | "2309 em 3 min no ponto" | 3-5 min antes |
| Último ônibus | "Último 2309 saindo agora" | Quando for o último |
| Linha cancelada | "Linha M681 cancelada hoje" | Quando cancelar |

### Nível 2 — Importantes (usuário escolhe)
| Evento | Exemplo | Quando |
|--------|---------|--------|
| Ônibus passou no ponto anterior | "2309 saiu de R. XV" | Quando sair |
| Atraso significativo | "2309 atrasado 15 min" | Quando atraso > 10 min |

### Nível 3 — Opcionais
| Evento | Exemplo | Quando |
|--------|---------|--------|
| Primeiro ônibus do dia | "Primeiro M681 saindo 6h" | Início do expediente |

---

## 🚫 Eventos que NÃO devem notificar

| Evento | Motivo |
|--------|--------|
| Posição a cada 1 min | Spam, use WebSocket |
| "Ônibus em 12 min" | Não é urgente |
| "Ônibus em 8 min" | Não é urgente |
| Mudança de velocidade | Irrelevante |
| Qualquer coisa a cada < 5 min | Spam |

---

## 🧠 Estratégia Inteligente

### Quando o usuário ABRIU o site
```
→ NÃO mandar push
→ Usar WebSocket para tracking
→ Notificação é redundante
```

### Quando o usuário FECHOU o site
```
→ Monitorar no backend
→ Mandar push nos eventos importantes
→ "Seu ônibus chega em 3 minutos!"
```

### Fluxo completo
```
┌─────────────────────────────────────────────────────┐
│  USUÁRIO MARCA "ME AVISAR" NUMA ROTA + PARADA      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND REGISTRA:                                  │
│  • serviceId: 0ec23b44...                           │
│  • stopId: 35f189cd...                              │
│  • pushToken: do usuário                            │
│  • alertas: ["chegando", "ultimo", "cancelado"]     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND MONITORA (a cada 30s):                     │
│  • Busca previsão /prediction/service/{id}/{stopId} │
│  • Calcula quando o ônibus chega                    │
│  • Decide SE deve notificar                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  CONDIÇÕES PARA NOTIFICAR:                          │
│  1. Previsão <= 3 minutos                           │
│  2. Último ônibus do dia                            │
│  3. Linha cancelada                                 │
│  4. Usuário NÃO está com site aberto                │
│  5. Não notificou nos últimos 10 min (anti-spam)    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  ENVIA PUSH                                         │
│  → Usuário clica                                    │
│  → Abre o site na parada correta                    │
└─────────────────────────────────────────────────────┘
```

---

## 📱 Estrutura da Notificação

### Chrome/Android (máximo)
```json
{
  "title": "🚌 2309 chegando!",
  "body": "Em 3 minutos na R. XV de Novembro",
  "icon": "/icons/bus-arriving.png",
  "image": "/images/notification-banner.png",
  "badge": "/icons/badge.png",
  "tag": "bus-arriving-2309-35f189cd",
  "renotify": true,
  "vibrate": [200, 100, 200],
  "actions": [
    { "action": "track", "title": "Rastrear" },
    { "action": "dismiss", "title": "Dispensar" }
  ],
  "data": {
    "serviceId": "0ec23b44-d280-11f0-a0e6-02001705c31d",
    "stopId": "35f189cd-7340-4600-b265-6bf526c6345d",
    "url": "/tracking?service=0ec23b44&stop=35f189cd"
  }
}
```

### iOS (simplificado)
```json
{
  "title": "🚌 2309 chegando!",
  "body": "Em 3 minutos na R. XV de Novembro",
  "data": {
    "url": "/tracking?service=0ec23b44&stop=35f189cd"
  }
}
```

### Payload máximo permitido
| Campo | Limite |
|-------|--------|
| title | 4KB (~30 caracteres) |
| body | 4KB (~100 caracteres) |
| icon | 256KB |
| image | 2MB (só Chrome) |
| actions | 2-3 botões |
| data | 4KB total |

---

## 🔧 Service Worker (código)

### Escutando push
```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/icons/bus.png',
    image: data.image,
    badge: data.badge || '/icons/badge.png',
    tag: data.tag,
    renotify: data.renotify || false,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || [],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

### Clicando na notificação
```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já tem site aberto, foca nele
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Senão, abre nova janela
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

---

## 📡 Backend — Lógica de Notificação

### Estrutura de dados
```javascript
// Tabela: notifications
{
  userId: "user_123",
  serviceId: "0ec23b44-d280-11f0-a0e6-02001705c31d",
  stopId: "35f189cd-7340-4600-b265-6bf526c6345d",
  routeCode: "M681",
  stopName: "R. XV de Novembro",
  pushToken: "fcm_token...",
  platform: "android", // ou "ios", "web"
  alerts: {
    arriving: true,      // "chegando em 3 min"
    lastBus: true,       // "último ônibus"
    cancelled: true,     // "linha cancelada"
    delay: true          // "atrasado 10+ min"
  },
  lastNotified: 1782021875000,  // anti-spam
  createdAt: 1782019067000
}
```

### Worker de verificação
```javascript
// Verifica a cada 30 segundos
async function checkAndNotify() {
  const subscriptions = await db.notifications.find({});
  
  for (const sub of subscriptions) {
    // 1. Buscar previsão
    const prediction = await fetch(
      `https://core.cittamobi.com.br/prediction/service/${sub.serviceId}/${sub.stopId}`,
      { headers: { username: USERNAME } }
    );
    const data = await prediction.json();
    
    // 2. Verificar se tem veículo
    if (data.vehicles.length === 0) continue;
    
    const vehicle = data.vehicles[0];
    const minutesLeft = Math.round(vehicle.prediction / 60);
    
    // 3. Regras de notificação
    const shouldNotify = (
      // Chegando (3-5 min)
      (sub.alerts.arriving && minutesLeft <= 3 && minutesLeft > 0) ||
      // Último ônibus
      (sub.alerts.lastBus && isLastBusOfDay(sub.serviceId)) ||
      // Cancelado
      (sub.alerts.cancelled && isCancelled(sub.serviceId)) ||
      // Atrasado
      (sub.alerts.delay && minutesLeft > 20)
    );
    
    // 4. Anti-spam (não notificar se já notificou nos últimos 10 min)
    const timeSinceLastNotify = Date.now() - sub.lastNotified;
    if (timeSinceLastNotify < 10 * 60 * 1000) continue;
    
    // 5. Enviar push
    if (shouldNotify) {
      await sendPush(sub, {
        title: `🚌 ${vehicle.prefix || sub.routeCode} chegando!`,
        body: `Em ${minutesLeft} minutos na ${sub.stopName}`,
        tag: `bus-${vehicle.id}-${sub.stopId}`,
        data: {
          url: `/tracking?service=${sub.serviceId}&stop=${sub.stopId}`
        }
      });
      
      // Atualizar último notify
      await db.notifications.update(
        { _id: sub._id },
        { lastNotified: Date.now() }
      );
    }
  }
}
```

---

## 📋 API do Backend

Endpoints detalhados em `reference/v1/`:
- `19-notifications-subscribe.md` — POST /v1/notifications/subscribe
- `20-notifications-delete.md` — DELETE /v1/notifications/:id
- `21-notifications-list.md` — GET /v1/notifications/stop/:stopId
- `22-vapid-key.md` — GET /v1/vapid-public-key
- `23-notifications-device.md` — GET /v1/notifications (listar próprias)

### Resumo dos endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/v1/notifications/subscribe` | Criar inscrição de push |
| `DELETE` | `/v1/notifications/:id` | Remover inscrição (somente proprietário) |
| `GET` | `/v1/notifications` | Listar inscrições próprias do dispositivo |
| `GET` | `/v1/notifications/stop/:stopId` | Listar inscrições de uma parada |
| `GET` | `/v1/vapid-public-key` | Chave pública VAPID |

### Fluxo de uso no frontend

```js
const { publicKey } = await fetch('/v1/vapid-public-key', {
  headers: { 'Authorization': `Bearer ${token}`, 'X-Device-Id': deviceId }
}).then(r => r.json());

const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicKey),
});

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

## Persistência

As inscrições são armazenadas no Upstash Redis com TTL de 30 dias, indexadas por parada, serviço e dispositivo.

---

## 📊 Resumo de Eventos

| Evento | Frequência | Urgência | Push? |
|--------|------------|----------|-------|
| Chegando (3 min) | 1x por viagem | Alta | ✅ Sim |
| Chegando (8 min) | 1x por viagem | Baixa | ❌ Não |
| Último ônibus | 1x por dia | Alta | ✅ Sim |
| Cancelado | 1x por dia | Alta | ✅ Sim |
| Atrasado 10+ min | Quando atrasar | Média | ✅ Sim |
| Posição a cada 1 min | Muitas | Nenhuma | ❌ Nunca |

---

## ⚠️ Cuidados

1. **Anti-spam**: Mínimo 10 min entre notificações do mesmo usuário
2. **Horário**: Não notificar entre 23h e 6h (exceto noturnas)
3. **Consentimento**: Usuário deve ativar manualmente
4. **Fácil desativar**: Botão "Parar notificações" acessível
5. **Testar em iOS**: Safari tem limitações diferentes
6. **PWA instalado**: iOS só funciona com site instalado na tela inicial
