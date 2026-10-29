# 🚌 REQUEST 4 — Busca por Nome
## GET /search/q

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/search/q` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Busca rotas de ônibus por nome (terminal, bairro, rua, etc) |

---

## 📤 REQUEST

### Headers
```http
accept-encoding: gzip
content-type: application/json
host: core.cittamobi.com.br
user-agent: Dart/3.10 (dart:io)
username: $2a$12$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW
```

### Query Parameters
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `q` | string | ✅ | Termo de busca |
| `a` | string | ❌ | City ID (não afeta muito) |
| `lat` | float | ❌ | Latitude do usuário |
| `lng` | float | ❌ | Longitude do usuário |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/search/q?q=terminal&a=4926&lat=-30.057&lng=-51.192" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response (Array, máx 20)
```json
[
  {
    "routeCode": "718",
    "routeMnemonic": "ILHA DA PINTADA / CENTRO / ILHA DA PINTADA",
    "serviceMnemonic": "Ilha da Pintada - Centro/Bairro",
    "companyId": null,
    "stopId": null,
    "serviceId": null,
    "routeId": null,
    "id": "0ebf4af7-d280-11f0-a0e6-02001705c31d",
    "activeVehicles": 0,
    "scheduledVehicles": 0,
    "predictionType": null,
    "bgcolor": null,
    "fgcolor": null,
    "vehicles": [],
    "messages": [],
    "alerts": [],
    "hasRealTime": false,
    "estimatedInterval": null,
    "totalTravelTimeUntilStopSeconds": null,
    "modal": 0
  },
  {
    "routeCode": "718",
    "routeMnemonic": "ILHA DA PINTADA / CENTRO / ILHA DA PINTADA",
    "serviceMnemonic": "Ilha da Pintada - Bairro/Centro",
    "companyId": null,
    "stopId": null,
    "serviceId": null,
    "routeId": null,
    "id": "0ebf469d-d280-11f0-a0e6-02001705c31d",
    "activeVehicles": 0,
    "scheduledVehicles": 0,
    "predictionType": null,
    "bgcolor": null,
    "fgcolor": null,
    "vehicles": [],
    "messages": [],
    "alerts": [],
    "hasRealTime": false,
    "estimatedInterval": null,
    "totalTravelTimeUntilStopSeconds": null,
    "modal": 0
  }
]
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

### `routeCode` (string)
- **O que é**: Código da rota (número da linha)
- **Exemplo**: `"718"`, `"2675"`, `"M681"`
- **Uso**: Exibir como identificador principal da rota

### `routeMnemonic` (string)
- **O que é**: Nome curto da rota
- **Formato**: `"ORIGEM / DESTINO / ORIGEM"`
- **Exemplo**: `"ILHA DA PINTADA / CENTRO / ILHA DA PINTADA"`
- **Uso**: Exibir como título da rota

### `serviceMnemonic` (string)
- **O que é**: Nome completo do serviço/direção
- **Formato**: `"Origem - Direção"`
- **Exemplo**: `"Ilha da Pintada - Centro/Bairro"`
- **Uso**: Exibir como subtítulo (indica direção)

### `companyId` (string|null)
- **O que é**: ID da empresa de transporte
- **Geralmente**: `null` na busca
- **Uso**: Identificar empresa operadora

### `stopId` (string|null)
- **O que é**: ID do ponto de parada
- **Geralmente**: `null` na busca
- **Uso**: Não disponível na busca

### `serviceId` (string|null)
- **O que é**: ID do serviço/rota
- **Geralmente**: `null` na busca
- **Uso**: Para buscar veículos (usar `id` ao invés)

### `routeId` (string|null)
- **O que é**: ID da rota
- **Geralmente**: `null` na busca
- **Uso**: Para buscar serviços da rota

### `id` (string)
- **O que é**: **UUID do serviço** (IMPORTANTE!)
- **Formato**: `"0ebf4af7-d280-11f0-a0e6-02001705c31d"`
- **Uso**: Usar como `serviceId` em outros endpoints
- ⚠️ **ATENÇÃO**: Este campo `id` é na verdade o `serviceId`!

### `activeVehicles` (integer)
- **O que é**: Número de veículos ativos nesta rota
- **Exemplo**: `0` = nenhum ônibus rodando
- **Uso**: Indicar se tem ônibus em circulação

### `scheduledVehicles` (integer)
- **O que é**: Número de veículos agendados
- **Exemplo**: `0`
- **Uso**: Veículos programados para sair

### `predictionType` (string|null)
- **O que é**: Tipo de previsão
- **Valores**: `"ARRIVAL"` ou `"DEPARTURE"`
- **Geralmente**: `null` na busca

### `bgcolor` (string|null)
- **O que é**: Cor de fundo da rota
- **Geralmente**: `null`
- **Uso**: Personalização visual

### `fgcolor` (string|null)
- **O que é**: Cor do texto da rota
- **Geralmente**: `null`
- **Uso**: Personalização visual

### `vehicles` (array)
- **O que é**: Lista de veículos
- **Geralmente**: `[]` vazio na busca
- **Uso**: Dados completos em `/vehicles/service/{id}`

### `messages` (array)
- **O que é**: Mensagens da rota
- **Geralmente**: `[]` vazio
- **Uso**: Avisos de desvios, etc

### `alerts` (array)
- **O que é**: Alertas da rota
- **Geralmente**: `[]` vazio
- **Uso**: Informações de emergência

### `hasRealTime` (boolean)
- **O que é**: Se tem dados em tempo real
- **Valores**: `true` ou `false`
- **Uso**: Indicar se pode rastrear

### `estimatedInterval` (integer|null)
- **O que é**: Intervalo estimado entre veículos (em segundos)
- **Exemplo**: `900` = 15 minutos
- **Geralmente**: `null` na busca

### `totalTravelTimeUntilStopSeconds` (integer|null)
- **O que é**: Tempo total até o destino (em segundos)
- **Exemplo**: `3600` = 1 hora
- **Geralmente**: `null` na busca

### `modal` (integer)
- **O que é**: Modalidade do transporte
- **Valores**:
  - `0` = Convencional
  - `1` = Expresso
- **Uso**: Diferenciar tipos de serviço

---

## 💡 COMO USAR NO SITE

```javascript
async function buscarRotas(query, cityId) {
  const url = `https://core.cittamobi.com.br/search/q?q=${encodeURIComponent(query)}&a=${cityId}`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  const resultados = await response.json();
  
  return resultados.map(r => ({
    codigo: r.routeCode,
    nome: r.routeMnemonic,
    direcao: r.serviceMnemonic,
    serviceId: r.id,  // ⚠️ ATENÇÃO: id = serviceId
    temTempoReal: r.hasRealTime,
    veiculosAtivos: r.activeVehicles
  }));
}

// Uso
const input = document.getElementById('busca');
input.addEventListener('input', async (e) => {
  const query = e.target.value;
  if (query.length >= 2) {
    const rotas = await buscarRotas(query, 4926);
    mostrarResultados(rotas);
  }
});
```

---

## 🎯 COMPORTAMENTO DA BUSCA

### Termos que funcionam bem:
- `"terminal"` → Terminais da cidade
- `"centro"` → Rotas que passam pelo centro
- `"belém"` → Rotas do bairro Belém
- `"268"` → Código da rota específica
- `"avenida"` → Rotas de avenidas

### Limitações:
- Retorna no máximo **20 resultados**
- Não faz busca fuzzy (exato)
- Não busca por endereço completo
- Não busca por ponto específico

---

## ⚠️ CUIDADOS

1. **`id` ≠ `serviceId`**: O campo `id` retornado é o `serviceId` para outros endpoints
2. **Máximo 20**: Limitado a 20 resultados
3. **Sem autocompletar**: Não tem endpoint de sugestão
4. **Case sensitive**: `"Terminal"` ≠ `"terminal"` (mas funciona)
5. **Sem acento**: `"belem"` funciona para `"belém"`
