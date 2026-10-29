# 🔔 Web Push Notifications — Guia Completo

## 📋 Visão Geral

Sistema de notificações via navegador para alertar o usuário sobre eventos importantes do ônibus. **Não substitui WebSocket** — é complementar.

---

## 🎯 Regra de Ouro

> **Web Push = acompanhamento em segundo plano**  
> **SSE = tracking em tempo real com o site aberto**

O worker atual pode enviar uma nova notificação quando a minutagem muda, mas evita
repetir o mesmo estado do mesmo veículo.

---

## ⚠️ Controle de repetição

| Problema | Consequência |
|----------|--------------|
| Repetir a mesma previsão | Usuário bloqueia notificações |
| Bateria | Drena bateria do celular |
| Dados | Consome dados desnecessariamente |
| UX | Experiência ruim = abandono |
| Chrome | Pode limitar/bloquear seu push |

**Solução atual**: o worker identifica o veículo pelo `prefix`, registra a última
previsão enviada e só reenvia quando a minutagem muda e a previsão varia mais de
60 segundos para o mesmo veículo.

---

## ✅ Eventos que JUSTIFICAM notificação

| Evento | Preferência | Quando |
|--------|-------------|--------|
| Veículo em aproximação | `notifyOnApproach` | Previsão em tempo real de 0 a 15 min |
| Viagem programada | `notifyScheduled` | Previsão `type: "SCHEDULE"` de 0 a 15 min |

O worker seleciona o veículo com a menor previsão não negativa. Eventos de último
ônibus, cancelamento e atraso não estão implementados atualmente.

---

## 🚫 Eventos que NÃO devem notificar

| Evento | Motivo |
|--------|--------|
| Posição a cada 1 min | Spam, use WebSocket |
| Mudança de velocidade | Irrelevante |
| Previsão acima de 15 min | Fora do limiar do worker |

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
│  • subscription: endpoint + chaves Web Push         │
│  • preferências: aproximação e/ou horário agendado  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND MONITORA (a cada 30s):                     │
│  • Busca previsão do par serviceId + stopId         │
│  • Seleciona a previsão não negativa mais próxima   │
│  • Decide SE deve notificar                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  CONDIÇÕES PARA NOTIFICAR:                          │
│  1. Previsão entre 0 e 15 minutos                   │
│  2. Preferência correspondente está habilitada      │
│  3. A minutagem ainda não foi notificada            │
│  4. Mesmo veículo variou mais de 60s                │
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
// Tabela: notifications (modelo atual - Redis Hash)
{
  id: "uuid",
  endpoint: "https://fcm.googleapis.com/...",
  p256dh: "...",
  auth: "...",
  stopId: "8a5197b2-d51d-49f5-8d30-d6a645a75685",
  serviceId: "0ebdad7f-d280-11f0-a0e6-02001705c31d",
  deviceId: "device-123",
  notifyOnApproach: true,
  notifyScheduled: false,
  createdAt: 1782019067000,
  lastNotified: 1782021875000,
  lastNotifiedMinute: 5,              // última previsão enviada, em minutos
  lastNotifiedPrefix: "M681-1234",   // prefixo do último veículo notificado
  lastNotifiedPrediction: 300         // previsão em segundos do último veículo notificado
}
```

### Worker de verificação
```javascript
// Pseudocódigo equivalente à regra atual; verifica a cada 30 segundos
async function checkAndNotify() {
  const subscriptions = await getAllPreferences();
  
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
    const minutesLeft = Math.floor(vehicle.prediction / 60);
    
    // 3. Regras de notificação
    if (sub.lastNotifiedMinute === currentMinute) continue;

    // Evitar notificar o mesmo ônibus novamente
    if (sub.lastNotifiedPrefix === vehicle.prefix) {
      // Mesmo ônibus - só notifica se a previsão mudou significativamente (>60s)
      if (sub.lastNotifiedPrediction == null || Math.abs(sub.lastNotifiedPrediction - vehicle.prediction) <= 60) {
        continue;
      }
    }

    if (minutesLeft < 0 || minutesLeft > 15) continue;
    const isScheduled = vehicle.type === 'SCHEDULE';
    const shouldNotify = isScheduled
      ? sub.notifyScheduled
      : sub.notifyOnApproach;
    
    // 5. Enviar push
    if (shouldNotify) {
      await sendPush(sub, {
        title: `🚌 Linha ${data.routeCode} chegando!`,
        body: minutesLeft < 1
          ? `O ônibus ${vehicle.prefix} está chegando na tua parada.`
          : `O ônibus ${vehicle.prefix} está a aproximadamente ${minutesLeft} min da tua parada.`,
        tag: `bus-${sub.serviceId}-${sub.stopId}`,
        data: {
          url: '/',
          serviceId: sub.serviceId,
          stopId: sub.stopId
        }
      });
      
      // Atualizar rastreamento
      await db.notifications.update(
        { _id: sub._id },
        { 
          lastNotified: Date.now(),
          lastNotifiedMinute: currentMinute,
          lastNotifiedPrefix: vehicle.prefix,
          lastNotifiedPrediction: vehicle.prediction
        }
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

## 📊 Resumo do comportamento atual

| Evento | Frequência | Urgência | Push? |
|--------|------------|----------|-------|
| Aproximação em 0–15 min | Conforme mudança da previsão | Alta | ✅ `notifyOnApproach` |
| Horário `SCHEDULE` em 0–15 min | Conforme mudança da previsão | Média | ✅ `notifyScheduled` |
| Previsão acima de 15 min | A cada consulta | Baixa | ❌ Não |
| Último ônibus/cancelamento/atraso | — | — | ❌ Não implementado |

---

## ⚠️ Cuidados

1. **Deduplicação**: feita por minutagem, prefixo do veículo e variação da previsão
2. **Intervalo**: o worker consulta os grupos ativos a cada 30 segundos e impede ticks concorrentes
3. **Consentimento**: o usuário deve ativar manualmente
4. **Inscrição sem `serviceId`**: é aceita pela API, mas não é processada pelo worker
5. **Expiração**: hashes e índices por parada/dispositivo têm TTL de 30 dias; `notif:all` é o índice global
4. **Fácil desativar**: Botão "Parar notificações" acessível
5. **Testar em iOS**: Safari tem limitações diferentes
6. **PWA instalado**: iOS só funciona com site instalado na tela inicial
