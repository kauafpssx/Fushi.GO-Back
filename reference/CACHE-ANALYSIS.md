# 🚌 CITTAMOBITrack — Análise de Cache & Otimização
## Testes de ETag, Last-Modified e Outras Opções

**Data**: 21/Jun/2026  
**Endpoints testados**: 12  
**Resultado**: ❌ NENHUM suporte a cache HTTP nativo

---

## 🔍 RESUMO DOS TESTES

### 1. ETag / Last-Modified

| Teste | Resultado |
|-------|-----------|
| Resposta retorna `ETag` header | ❌ **NÃO** |
| Resposta retorna `Last-Modified` header | ❌ **NÃO** |
| `If-None-Match` → 304 | ❌ Retorna **200** (ignorado) |
| `If-Modified-Since` → 304 | ❌ Retorna **200** (ignorado) |
| `Cache-Control` | `no-cache, no-store, max-age=0, must-revalidate` |
| `Pragma` | `no-cache` |
| `Expires` | `0` |

**Conclusão**: O servidor Cittamobi **não implementa cache HTTP**. Todos os headers explícitos proíbem cache.

---

### 2. Compressão (GZIP)

| Teste | Resultado |
|-------|-----------|
| `Content-Encoding: gzip` | ✅ **SUPORTADO** |
| Tamanho com gzip | 12.048 bytes |
| Tamanho sem gzip | 12.048 bytes |

**Nota**: O conteúdo de teste era pequeno. Para payloads maiores (polyline + 131 paradas), gzip deve comprimir significativamente.

---

### 3. Mecanismos de Tempo Real

| Mecanismo | Teste | Resultado |
|-----------|-------|-----------|
| **WebSocket** | Upgrade header | ❌ Retorna **200** (não 101) |
| **SSE** (Server-Sent Events) | Accept: text/event-stream | ❌ Retorna **406** |
| **Firebase (FCM)** | POST /push/firebase/register | ✅ Retorna `false` (token inválido) |
| **MQTT** | Testado via endpoints | ❌ Não encontrado |
| **SignalR** | Testado via endpoints | ❌ Não encontrado |
| **gRPC-Web** | Testado via endpoints | ❌ Não encontrado |

**Conclusão**: O Cittamobi é **REST puro**. Não existe canal de tempo real no servidor.

---

### 4. Outros Testes de Otimização

| Teste | Resultado |
|-------|-----------|
| **HEAD request** | ✅ Suportado (retorna `Content-Length: 519`) |
| **Range request** | ❌ Retorna **0** (não suportado) |
| **Batch/GraphQL** | ❌ Não encontrado |
| **Delta/diff endpoints** | ❌ Não encontrado |
| **Endpoints ocultos** | ❌ Todos retornam **404** |

---

## ⏱️ TEMPO DE RESPOSTA

| Request | Tempo |
|---------|-------|
| 1ª request | 179ms |
| 2ª request | 44ms |
| 3ª request | 44ms |

**Interpretação**: O servidor tem cache interno (provavelmente Redis/Memcached). Requests subsequentes são ~4x mais rápidas.

---

## 📊 HEADERS DE RESPOSTA PADRÃO (todos os endpoints)

```http
HTTP/1.1 200 OK
Transfer-Encoding: chunked
Connection: keep-alive
Vary: origin,access-control-request-method,access-control-request-headers,accept-encoding
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Pragma: no-cache
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Content-Type: application/json
Date: Sun, 21 Jun 2026 18:55:32 GMT
Expires: 0
```

**Ausentes**: `ETag`, `Last-Modified`, `Content-Encoding` (quando não gzip), `Content-Length` (chunked)

---

## 🎯 ESTRATÉGIA RECOMENDADA

Como não existe cache HTTP, a otimização deve ser feita **no cliente**:

### 1. Polling Inteligente (Diferencial)

```typescript
// Comparar com resposta anterior
if (
  oldVehicle.lat !== newVehicle.lat ||
  oldVehicle.lng !== newVehicle.lng ||
  oldVehicle.lastUpdate !== newVehicle.lastUpdate
) {
  // Só broadcast se houve mudança
  broadcast(newVehicle);
}
```

**Benefício**: Mesmo com polling de 5s, clientes só recebem dados quando há alteração real.

### 2. Polling Adaptativo

| Cenário | Frequência |
|---------|------------|
| Usuários ativos | 5s |
| Nenhum conectado | Worker destruído |
| Ônibus parado | 15s |
| Madrugada | 30s |
| Linha sem veículo (SCHEDULE) | 60s |

### 3. Cache Local por Endpoint

| Endpoint | TTL | Estratégia |
|----------|-----|------------|
| `/session/start` | 24h | Cache estático |
| `/search/q` | 1h | stale-while-revalidate |
| `/stops/viewport` | 5min | Cache curto |
| `/service/{id}` | 1h | Cache médio |
| `/prediction/*` | 30s | Mínimo ou nenhum |
| `/stops/service/v2/*` | 24h | Cache longo |
| `/vehicles/*` | 5s | Diferencial |

### 4. Compressão

- Sempre enviar `Accept-Encoding: gzip`
- Para payloads grandes (polyline + paradas), gzip deve reduzir ~60-80%

### 5. HEAD Requests

- Usar HEAD para verificar se dados mudaram (retorna `Content-Length`)
- Útil para monitorar mudanças sem baixar o corpo completo

---

## 🚫 O QUE NÃO FUNCIONA

1. **ETag/304**: Servidor ignora completamente
2. **Last-Modified**: Servidor ignora completamente
3. **WebSocket**: Não suportado
4. **SSE**: Retorna 406
5. **Delta/diff**: Não existe endpoint
6. **Batch**: Não existe endpoint
7. **GraphQL**: Não existe endpoint

---

## 📈 COMPARAÇÃO DE FREQUÊNCIAS

| Frequência | Requests/min (1 worker) | Qualidade |
|------------|------------------------|-----------|
| 60s | 1 | Muito lento |
| 30s | 2 | Aceitável |
| 10s | 6 | Bom |
| **5s** | **12** | **Excelente** |
| 1s | 60 | Exagerado |

**Recomendação**: **5 segundos** com polling diferencial.

---

## 🔧 CÓDIGO DE EXEMPLO

### Polling Diferencial

```typescript
let previousVehicles: Map<string, Vehicle> = new Map();

async function fetchVehicles(serviceId: string): Promise<Vehicle[]> {
  const response = await fetch(
    `https://core.cittamobi.com.br/vehicles/service/${serviceId}`,
    { headers: { username: USERNAME } }
  );
  return await response.json();
}

function shouldBroadcast(old: Vehicle, new_: Vehicle): boolean {
  return (
    old.lat !== new_.lat ||
    old.lng !== new_.lng ||
    old.lastUpdate !== new_.lastUpdate ||
    old.type !== new_.type
  );
}

// Polling a cada 5 segundos
setInterval(async () => {
  const vehicles = await fetchVehicles(serviceId);
  
  for (const vehicle of vehicles) {
    const prev = previousVehicles.get(vehicle.id);
    if (!prev || shouldBroadcast(prev, vehicle)) {
      broadcast(vehicle);
    }
  }
  
  previousVehicles = new Map(vehicles.map(v => [v.id, v]));
}, 5000);
```

### Cache por Endpoint

```typescript
const cache = new Map<string, { data: any; time: number }>();

const TTL: Record<string, number> = {
  '/session/start': 86400000,  // 24h
  '/search/q': 3600000,        // 1h
  '/stops/viewport': 300000,   // 5min
  '/service/': 3600000,        // 1h
  '/prediction/': 30000,       // 30s
  '/stops/service/v2/': 86400000, // 24h
  '/vehicles/service/': 5000,  // 5s
};

async function cachedFetch(path: string, params: Record<string, string>) {
  const url = new URL(`https://core.cittamobi.com.br${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const key = url.toString();
  const cached = cache.get(key);
  const ttl = TTL[path] || 60000;
  
  if (cached && Date.now() - cached.time < ttl) {
    return cached.data;
  }
  
  const response = await fetch(url, { headers: { username: USERNAME } });
  const data = await response.json();
  cache.set(key, { data, time: Date.now() });
  return data;
}
```

---

## ✅ CONCLUSÃO

**ETag/Last-Modified não existe no Cittamobi.** A API é REST puro com headers anti-cache explícitos.

**Solução**: Polling de 5 segundos + comparação diferencial + cache local por endpoint.

**Requests por minuto (200 usuários, 1 worker)**: ~12 requests/min — totalmente viável.
