# 🚌 CITTAMOBITrack — Fluxo da Aplicação
## Como o app funciona (do início ao fim)

---

## 🔄 VISÃO GERAL DO FLUXO

```
┌─────────────────────────────────────────────────────────────────┐
│  USUÁRIO ABRE O APP                                             │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. GEOLOCALIZAÇÃO → Detecta cidade                             │
│     GET /session/start?lat=X&lng=Y                              │
│     → { "cityId": 4926, "name": "RS - Porto Alegre" }          │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. MAPA CARREGA → Zoom recomendado                             │
│     GET /stop/viewport/recommendation?lat=X&lng=Y               │
│     → { "radiusMeters": 69.5 } → Calcula zoom                   │
│     GET /stops/viewport?nelat=X&nelng=Y&swlat=X&swlng=Y        │
│     → [{ stops no viewport }]                                   │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. USUÁRIO MOVE O MAPA → Atualiza viewport                    │
│     GET /stops/viewport?nelat=X&nelng=Y&swlat=X&swlng=Y        │
│     → Mostra/atualiza markers                                   │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. USUÁRIO BUSCA ROTA (opcional)                               │
│     GET /search/q?q=terminal&a={cityId}&lat=X&lng=Y             │
│     → [{ routeCode, routeMnemonic, id }]                        │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. USUÁRIO CLICA NO PONTO                                     │
│     GET /prediction/stop/{stopId}                               │
│     → [{ routeCode, routeMnemonic, totalTravelTime, vehicles }] │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. USUÁRIO SELECIONA ROTA                                     │
│     GET /vehicles/service/{serviceId}                           │
│     → [{ prefix, lat, lng, bearing, averageSpeed }]             │
│     GET /stops/service/v2/{serviceId}                           │
│     → { polyline, stops[] }                                     │
│     Desenha polilinha + markers no mapa                         │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. POLLING AUTOMÁTICO (a cada 1 minuto)                        │
│     GET /vehicles/service/{serviceId}                           │
│     → Atualiza posição dos veículos                             │
│                                                                 │
│  8. ATUALIZAÇÃO MANUAL (clique do usuário)                      │
│     Mesmo endpoint do polling                                   │
│     → Atualiza imediatamente                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⏱️ TIMERS E POLLING

### O que o app faz:
- **Auto-refresh**: A cada 60 segundos (1 minuto)
- **Manual refresh**: Usuário clica em botão de atualizar
- **Viewport refresh**: Quando o mapa move, carrega novos pontos

### O que NOSSO site deve fazer:
```javascript
// 1. Carregar pontos quando mapa move
map.on('moveend', () => {
  carregarPontosViewport();
});

// 2. Auto-refresh a cada 60 segundos
setInterval(() => {
  if (rotaSelecionada) {
    atualizarVeiculos(rotaSelecionada);
  }
}, 60000);

// 3. Refresh manual
document.getElementById('btn-refresh').onclick = () => {
  if (rotaSelecionada) {
    atualizarVeiculos(rotaSelecionada);
  }
};
```

---

## 📱 SEQUÊNCIA DE REQUISITOS

### Fase 1: Inicialização (2 requests)
```
1. GET /session/start?lat=X&lng=Y        → Detecta cidade
2. GET /stop/viewport/recommendation?lat=X&lng=Y  → Zoom ideal
```

### Fase 2: Carregar mapa (1 request)
```
3. GET /stops/viewport?nelat=X&nelng=Y&swlat=X&swlng=Y  → Pontos
```

### Fase 3: Usuário interage (1-3 requests)
```
4. GET /search?q=terminal                → Busca (opcional)
5. GET /prediction/stop/{stopId}         → Lista rotas no ponto
6. GET /vehicles/service/{serviceId}     → Veículos
7. GET /stops/service/v2/{serviceId}     → Polilinha
```

### Fase 4: Polling (1 request/minuto)
```
8. GET /vehicles/service/{serviceId}     → Atualiza veículos
```

---

## 🎯 COMPORTAMENTO POR AÇÃO

### Usuário abre o site
```
→ Pede geolocalização
→ 2 requests (detectar cidade + zoom)
→ 1 request (carregar pontos)
```

### Usuário move o mapa
```
→ 1 request (novos pontos no viewport)
```

### Usuário clica no ponto
```
→ 1 request (rotas disponíveis)
```

### Usuário seleciona rota
```
→ 2 requests (veículos + polilinha)
→ Inicia polling (1/minuto)
```

### Usuário clica "Atualizar"
```
→ 1 request (veículos imediatamente)
```

### Usuário fecha rota
```
→ Para polling
→ Volta a mostrar pontos
```

---

## 📊 TOTAL DE REQUESTS

| Ação | Requests | Frequência |
|------|----------|------------|
| Inicialização | 3 | Uma vez |
| Mover mapa | 1 | Por movimento |
| Clicar ponto | 1 | Por clique |
| Selecionar rota | 2 | Uma vez |
| Polling veículos | 1 | 1/minuto |
| **Total por minuto** | **~4** | **Mínimo** |

---

## 🔄 ESTADOS DA APLICAÇÃO

```
┌──────────────┐
│   INICIO     │ ← Abre site, pede localização
└──────┬───────┘
       ▼
┌──────────────┐
│   MAPA       │ ← Mostra pontos no viewport
└──────┬───────┘
       ▼
┌──────────────┐
│   PONTO      │ ← Usuário clica, vê rotas
└──────┬───────┘
       ▼
┌──────────────┐
│   ROTA       │ ← Veículos + polilinha + polling
└──────┬───────┘
       ▼
┌──────────────┐
│  VOLTAR      │ ← Fecha rota, volta ao mapa
└──────────────┘
```

---

## 💡 DICAS DE IMPLEMENTAÇÃO

### 1. Debounce no viewport
```javascript
let timeout;
map.on('moveend', () => {
  clearTimeout(timeout);
  timeout = setTimeout(carregarPontos, 300); // Espera 300ms
});
```

### 2. Cache de rotas
```javascript
const cache = {};

async function getRotas(stopId) {
  if (cache[stopId] && Date.now() - cache[stopId].time < 60000) {
    return cache[stopId].data;
  }
  const data = await fetch(`/prediction/stop/${stopId}`);
  cache[stopId] = { data, time: Date.now() };
  return data;
}
```

### 3. Polling inteligente
```javascript
let pollingInterval;

function iniciarPolling(serviceId) {
  // Atualiza imediatamente
  atualizarVeiculos(serviceId);
  
  // Depois a cada 60s
  pollingInterval = setInterval(() => {
    atualizarVeiculos(serviceId);
  }, 60000);
}

function pararPolling() {
  clearInterval(pollingInterval);
}
```

### 4. Indicador de loading
```javascript
async function atualizarVeiculos(serviceId) {
  mostrarLoading(true);
  try {
    const veiculos = await fetch(`/vehicles/service/${serviceId}`);
    atualizarMarkers(veiculos);
  } finally {
    mostrarLoading(false);
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Fase 1: Geolocalização + detecção de cidade
- [ ] Fase 2: Carregar mapa + zoom recomendado
- [ ] Fase 3: Carregar pontos no viewport
- [ ] Fase 4: Clicar no ponto → ver rotas
- [ ] Fase 5: Selecionar rota → ver veículos
- [ ] Fase 6: Desenhar polilinha
- [ ] Fase 7: Polling automático (60s)
- [ ] Fase 8: Botão de refresh manual
- [ ] Fase 9: Voltar ao mapa
- [ ] Fase 10: Cache de dados
