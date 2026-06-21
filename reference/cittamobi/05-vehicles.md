# 🚌 REQUEST 5 — Veículos em Tempo Real
## GET /vehicles/service/{serviceId}

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/vehicles/service/{serviceId}` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Retorna todos os veículos circulando em uma rota específica |

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

### Path Parameters
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `serviceId` | string (UUID) | ✅ | ID do serviço/rota |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/vehicles/service/0ec23b44-d280-11f0-a0e6-02001705c31d" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response (Array)
```json
[
  {
    "tripNumber": 0,
    "firstSeen": 0,
    "transitStopId": null,
    "transitServiceStopSequence": 107,
    "stopSequence": 0,
    "oldLatitude": 0.0,
    "oldLongitude": 0.0,
    "graphEdgePercentage": 0.12933905565998252,
    "distanceToNextStop": 0.0,
    "distanceFromFirstPoint": 0.0,
    "distanceFromPreviousStop": 0.0,
    "distanceMovedLastUpdate": 0.0,
    "transitAgencyId": null,
    "transitServiceId": null,
    "transitTimetableEntryId": null,
    "realtimeServiceId": null,
    "predictionSeconds": 0,
    "predictionToTripEnd": 0,
    "plate": "",
    "prefix": "2309",
    "ts": 0,
    "lat": -30.179929733276367,
    "lng": -51.175880432128906,
    "bearing": 173,
    "wheelchair": false,
    "climatized": false,
    "prediction": 0,
    "age": 0,
    "type": null,
    "lastUpdate": 1782019067000,
    "averageSpeed": 5.927109666155775,
    "cars": null,
    "tags": [],
    "id": "2309"
  }
]
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

### Campos de Identificação

#### `id` (string)
- **O que é**: Identificador único do veículo
- **Exemplo**: `"2309"`
- **Uso**: Identificador principal

#### `prefix` (string)
- **O que é**: Prefixo do veículo (número visível)
- **Exemplo**: `"2309"`
- **Uso**: Exibir no marker do mapa

#### `plate` (string)
- **O que é**: Placa do veículo
- **Exemplo**: `"ABC1234"` ou `""` (vazio)
- **Uso**: Identificação adicional

---

### Campos de Posição

#### `lat` (float)
- **O que é**: Latitude atual do veículo
- **Exemplo**: `-30.179929733276367`
- **Uso**: Posicionar marker no mapa

#### `lng` (float)
- **O que é**: Longitude atual do veículo
- **Exemplo**: `-51.175880432128906`
- **Uso**: Posicionar marker no mapa

#### `bearing` (integer)
- **O que é**: Direção que o veículo está indo (em graus)
- **Valores**: 0-360
  - `0` = Norte ↑
  - `90` = Leste →
  - `180` = Sul ↓
  - `270` = Oeste ←
- **Exemplo**: `173` = quase sul
- **Uso**: Rotacionar ícone do veículo

#### `averageSpeed` (float)
- **O que é**: Velocidade média atual (em km/h)
- **Exemplo**: `5.927109666155775`
- **Uso**: Exibir velocidade, mudar cor (lento=vermelho, rápido=verde)

---

### Campos de Atualização

#### `lastUpdate` (integer)
- **O que é**: Timestamp da última atualização (em milissegundos)
- **Exemplo**: `1782019067000`
- **Conversão**: `new Date(1782019067000)` = 21/06/2026 05:17:47
- **Uso**: Mostrar "há X minutos"

#### `age` (integer)
- **O que é**: Idade da última atualização (em minutos)
- **Exemplo**: `0` = atualizado agora
- **Uso**: Indicar se está desatualizado

#### `type` (string|null) — **STATUS DE CONEXÃO DO VEÍCULO**
- **O que é**: Indica se o veículo está conectado ao GPS
- **Valores**:
  - `null` = 🟢 **CONECTADO** — Veículo real com GPS ativo
  - `"MESSAGE"` = 🟢 **CONECTADO** — Veículo real em tempo real
  - `"SCHEDULE"` = 🔴 **DESCONECTADO** — Sem veículo real, apenas previsão agendada
- **Uso**: Determinar se os dados são confiáveis

##### Quando `type: "SCHEDULE"` (DESCONECTADO):
```json
{
  "type": "SCHEDULE",
  "lat": 0.0,           // ← SEM posição real
  "lng": 0.0,           // ← SEM posição real
  "prefix": null,       // ← SEM veículo atribuído
  "plate": null,        // ← SEM placa
  "bearing": null,      // ← SEM direção
  "averageSpeed": 0.0,  // ← SEM velocidade
  "lastUpdate": 0,      // ← NUNCA atualizado
  "id": null,           // ← SEM ID de veículo real
  "transitTimetableEntryId": "318106507"  // ← Apenas horário agendado
}
```

##### Quando `type: "MESSAGE"` ou `null` (CONECTADO):
```json
{
  "type": "MESSAGE",
  "lat": -30.160169,    // ← Posição real GPS
  "lng": -51.195838,    // ← Posição real GPS
  "prefix": "2309",     // ← Veículo real
  "plate": "ABC1234",   // ← Placa real
  "bearing": 119,       // ← Direção real
  "averageSpeed": 13.98,// ← Velocidade real
  "lastUpdate": 1782019067000  // ← Última atualização real
}
```

---

### Campos de Previsão

#### `prediction` (integer)
- **O que é**: Previsão de chegada no próximo ponto (em segundos)
- **Exemplo**: `262` = 4min 22seg
- **Uso**: "Próximo ônibus em X minutos"

#### `predictionSeconds` (integer)
- **O que é**: Mesmo que `prediction` (backup)
- **Exemplo**: `0`
- **Uso**: Redundância

#### `predictionToTripEnd` (integer)
- **O que é**: Previsão até o final da viagem (em segundos)
- **Exemplo**: `0`
- **Uso**: Tempo total restante

---

### Campos de Rota

#### `transitServiceStopSequence` (integer)
- **O que é**: Sequência atual do veículo na rota
- **Exemplo**: `107` = 107º ponto da rota
- **Uso**: Saber quanto falta da viagem

#### `graphEdgePercentage` (float)
- **O que é**: Porcentagem da rota percorrida (0.0 a 1.0)
- **Exemplo**: `0.12933905565998252` = 12.9% da rota
- **Uso**: Barra de progresso

#### `distanceToNextStop` (float)
- **O que é**: Distância até o próximo ponto (em metros)
- **Exemplo**: `0.0`
- **Uso**: "Faltam X metros"

#### `distanceFromPreviousStop` (float)
- **O que é**: Distância do ponto anterior (em metros)
- **Exemplo**: `0.0`
- **Uso**: Calcular velocidade real

#### `distanceMovedLastUpdate` (float)
- **O que é**: Distância percorrida desde a última atualização (em metros)
- **Exemplo**: `825.1834380747205`
- **Uso**: Velocidade instantânea

---

### Campos de Viagem

#### `tripNumber` (integer)
- **O que é**: Número da viagem atual
- **Exemplo**: `0`
- **Uso**: Identificar viagens distintas

#### `transitStopId` (string|null)
- **O que é**: ID do próximo ponto
- **Exemplo**: `"4e410a9e-04fa-4a7e-a4cc-5d4718c8fc61"` ou `null`
- **Uso**: Buscar dados do ponto

#### `transitTimetableEntryId` (string|null)
- **O que é**: ID do horário agendado
- **Exemplo**: `"318106508"` ou `null`
- **Uso**: Consultar horário programado

#### `realtimeServiceId` (string|null)
- **O que é**: ID do serviço em tempo real (GTFS)
- **Exemplo**: `"GTFS-ROUTE_CODE_1096_M681_1"` ou `null`
- **Uso**: Integração com GTFS-RT

---

### Campos de Características

#### `wheelchair` (boolean)
- **O que é**: Se o veículo é acessível para cadeirantes
- **Valores**: `true` ou `false`
- **Uso**: Filtrar veículos acessíveis

#### `climatized` (boolean)
- **O que é**: Se o veículo tem ar condicionado
- **Valores**: `true` ou `false`
- **Uso**: Filtrar veículos com AC

---

### Campos Adicionais

#### `firstSeen` (integer)
- **O que é**: Timestamp de quando o veículo foi visto pela primeira vez
- **Exemplo**: `0`
- **Uso**: Rastreabilidade

#### `stopSequence` (integer)
- **O que é**: Sequência do ponto atual
- **Exemplo**: `0`
- **Uso**: Posição na rota

#### `oldLatitude` / `oldLongitude` (float)
- **O que é**: Posição anterior
- **Exemplo**: `0.0`
- **Uso**: Calcular movimento

#### `transitAgencyId` (string|null)
- **O que é**: ID da agência de transporte
- **Exemplo**: `"075b0ae1-d280-11f0-a0e6-02001705c31d"` ou `null`
- **Uso**: Identificar operador

#### `transitServiceId` (string|null)
- **O que é**: ID do serviço
- **Exemplo**: `"0ec23b44-d280-11f0-a0e6-02001705c31d"` ou `null`
- **Uso**: Confirmar rota

#### `ts` (integer)
- **O que é**: Timestamp alternativo
- **Exemplo**: `0`
- **Uso**: Backup

#### `cars` (array|null)
- **O que é**: Informações dos carros/vagões
- **Geralmente**: `null`
- **Uso**: Para trens/metrô

#### `tags` (array)
- **O que é**: Tags do veículo
- **Geralmente**: `[]`
- **Uso**: Classificação adicional

---

## 💡 COMO USAR NO SITE

```javascript
async function carregarVeiculos(serviceId) {
  const url = `https://core.cittamobi.com.br/vehicles/service/${serviceId}`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  const veiculos = await response.json();
  
  return veiculos.map(v => ({
    id: v.id,
    prefixo: v.prefix,
    placa: v.plate,
    lat: v.lat,
    lng: v.lng,
    direcao: v.bearing,
    velocidade: v.averageSpeed,
    ultimaAtualizacao: new Date(v.lastUpdate),
    previsao: v.prediction,
    acessivel: v.wheelchair,
    arCondicionado: v.climatized,
    percentualRota: v.graphEdgePercentage,
    tipo: v.type
  }));
}

// Atualizar markers no mapa
function atualizarMarkersVeiculos(veiculos) {
  veiculos.forEach(v => {
    if (!markers[v.id]) {
      // Criar novo marker
      const icon = L.divIcon({
        className: 'bus-marker',
        html: `<div class="bus-icon">${v.prefixo}</div>`,
        iconSize: [40, 40]
      });
      
      markers[v.id] = L.marker([v.lat, v.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <b>Ônibus ${v.prefixo}</b><br>
          Velocidade: ${v.velocidade.toFixed(1)} km/h<br>
          Direção: ${v.direcao}°<br>
          ${v.acessivel ? '♿ Acessível' : ''}
          ${v.arCondicionado ? '❄️ Ar Condicionado' : ''}
        `);
    } else {
      // Atualizar posição
      markers[v.id].setLatLng([v.lat, v.lng]);
    }
  });
}

// Polling a cada 60 segundos
setInterval(async () => {
  const veiculos = await carregarVeiculos(serviceIdAtual);
  atualizarMarkersVeiculos(veiculos);
}, 60000);
```

---

## 🎯 COMO INTERPRETAR OS DADOS

### Velocidade
| Velocidade | Significado |
|------------|-------------|
| 0 km/h | Parado (no ponto ou no trânsito) |
| 1-20 km/h | Lento (trânsito pesado) |
| 20-40 km/h | Médio (trânsito normal) |
| 40-60 km/h | Rápido (via livre) |
| 60+ km/h | Muito rápido (expresso) |

### Type
| Type | Significado |
|------|-------------|
| `null` | Dados reais (GPS) |
| `"MESSAGE"` | Dados em tempo real |
| `"SCHEDULE"` | Dados agendados (estimativa) |

### Bearing
| Bearing | Direção |
|---------|---------|
| 0 | Norte ↑ |
| 90 | Leste → |
| 180 | Sul ↓ |
| 270 | Oeste ← |

---

## ⚠️ CUIDADOS

1. **Array vazio**: Se não tem veículos, retorna `[]`
2. **Posição zero**: `lat: 0.0, lng: 0.0` = sem posição (SCHEDULE)
3. **Velocidade zero**: Pode estar parado ou sem dados
4. **Desatualizado**: Verificar `age` e `lastUpdate`
5. **Polling**: Atualizar a cada 60 segundos (não mais rápido)
