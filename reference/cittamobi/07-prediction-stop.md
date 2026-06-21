# 🚌 REQUEST 7 — Previsão em uma Parada
## GET /prediction/stop/{stopId}

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/prediction/stop/{stopId}` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Retorna TODAS as rotas que passam por uma parada com previsões |

---

## 📤 REQUEST

### Headers
```http
username: $2a$12$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW
```

### Path Parameters
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `stopId` | string (UUID) | ✅ | ID da parada |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/prediction/stop/35f189cd-7340-4600-b265-6bf526c6345d" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response
```json
{
  "messages": [],
  "alerts": [],
  "services": [
    {
      "routeCode": "2675",
      "routeMnemonic": "LAMI ATÉ CAVALHADA",
      "serviceMnemonic": "Lami até Cavalhada - Terminal/Bairro",
      "companyId": "075b0ae1-d280-11f0-a0e6-02001705c31d",
      "stopId": "35f189cd-7340-4600-b265-6bf526c6345d",
      "serviceId": "0ec0ec0d-d280-11f0-a0e6-02001705c31d",
      "routeId": "089f8f2c-d280-11f0-a0e6-02001705c31d",
      "id": null,
      "activeVehicles": 0,
      "scheduledVehicles": 0,
      "predictionType": "ARRIVAL",
      "bgcolor": null,
      "fgcolor": null,
      "vehicles": [],
      "messages": [],
      "alerts": [],
      "hasRealTime": false,
      "estimatedInterval": null,
      "totalTravelTimeUntilStopSeconds": 1322,
      "modal": 0
    },
    {
      "routeCode": "M681",
      "routeMnemonic": "NOTURNA BELEM NOVO / CAMPO NOVO",
      "serviceMnemonic": "Madrugadão B. Novo/C. Novo - Centro/Bairro",
      "companyId": "075b0ae1-d280-11f0-a0e6-02001705c31d",
      "stopId": "35f189cd-7340-4600-b265-6bf526c6345d",
      "serviceId": "0ec23b44-d280-11f0-a0e6-02001705c31d",
      "routeId": "08a00dc8-d280-11f0-a0e6-02001705c31d",
      "id": null,
      "activeVehicles": 1,
      "scheduledVehicles": 0,
      "predictionType": "ARRIVAL",
      "bgcolor": null,
      "fgcolor": null,
      "vehicles": [
        {
          "prefix": "2309",
          "prediction": 262,
          "type": "MESSAGE",
          "lat": -30.160169,
          "lng": -51.195838,
          "bearing": 119,
          "averageSpeed": 13.98
        }
      ],
      "messages": [],
      "alerts": [],
      "hasRealTime": true,
      "estimatedInterval": null,
      "totalTravelTimeUntilStopSeconds": 3607,
      "modal": 0
    }
  ],
  "vehiclesAttributes": {},
  "feedbackEnabled": true
}
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

### Campos Raiz

#### `messages` (array)
- **O que é**: Mensagens gerais do sistema
- **Geralmente**: `[]`
- **Uso**: Avisos de manutenção, etc

#### `alerts` (array)
- **O que é**: Alertas gerais
- **Geralmente**: `[]`
- **Uso**: Informações de emergência

#### `vehiclesAttributes` (object)
- **O que é**: Atributos dos veículos
- **Geralmente**: `{}`
- **Uso**: Metadados adicionais

#### `feedbackEnabled` (boolean)
- **O que é**: Se o feedback está habilitado
- **Valores**: `true`
- **Uso**: Permitir ao usuário reportar problemas

---

### Campos de cada Service (rota)

#### `routeCode` (string)
- **O que é**: Código da rota (número da linha)
- **Exemplo**: `"2675"`, `"M681"`
- **Uso**: Identificador principal para o usuário

#### `routeMnemonic` (string)
- **O que é**: Nome curto da rota
- **Formato**: `"ORIGEM / DESTINO"`
- **Exemplo**: `"LAMI ATÉ CAVALHADA"`
- **Uso**: Título da rota

#### `serviceMnemonic` (string)
- **O que é**: Nome completo com direção
- **Formato**: `"Origem - Direção"`
- **Exemplo**: `"Lami até Cavalhada - Terminal/Bairro"`
- **Uso**: Subtítulo (indica sentido)

#### `companyId` (string)
- **O que é**: UUID da empresa operadora
- **Exemplo**: `"075b0ae1-d280-11f0-a0e6-02001705c31d"`
- **Uso**: Identificar empresa

#### `stopId` (string)
- **O que é**: UUID da parada consultada
- **Exemplo**: `"35f189cd-7340-4600-b265-6bf526c6345d"`
- **Uso**: Confirmar parada

#### `serviceId` (string)
- **O que é**: UUID do serviço/rota
- **Exemplo**: `"0ec0ec0d-d280-11f0-a0e6-02001705c31d"`
- **Uso**: Usar em `/vehicles/service/{id}` e `/stops/service/v2/{id}`

#### `routeId` (string)
- **O que é**: UUID da rota
- **Exemplo**: `"089f8f2c-d280-11f0-a0e6-02001705c31d"`
- **Uso**: Usar em `/route/{id}/services`

#### `id` (string|null)
- **O que é**: ID adicional
- **Geralmente**: `null`

#### `activeVehicles` (integer)
- **O que é**: Número de veículos ativos nesta rota
- **Exemplo**: `0` ou `1`
- **Uso**: "Nenhum ônibus" ou "1 ônibus a caminho"

#### `scheduledVehicles` (integer)
- **O que é**: Veículos agendados
- **Exemplo**: `0`
- **Uso**: Próximas partidas programadas

#### `predictionType` (string)
- **O que é**: Tipo de previsão
- **Valores**: `"ARRIVAL"` = chegada
- **Uso**: Indicar se é previsão de chegada

#### `vehicles` (array)
- **O que é**: Veículos com previsão para esta parada
- **Uso**: Lista de próximos ônibus

#### `messages` (array)
- **O que é**: Mensagens específicas da rota
- **Geralmente**: `[]`
- **Uso**: Desvios, alterações

#### `alerts` (array)
- **O que é**: Alertas da rota
- **Geralmente**: `[]`
- **Uso**: Emergências

#### `hasRealTime` (boolean)
- **O que é**: Se tem dados em tempo real
- **Valores**: `true` ou `false`
- **Uso**: Indicar confiabilidade da previsão

#### `estimatedInterval` (integer|null)
- **O que é**: Intervalo entre veículos (em segundos)
- **Exemplo**: `900` = 15 minutos
- **Uso**: "Passa a cada 15 minutos"

#### `totalTravelTimeUntilStopSeconds` (integer)
- **O que é**: Tempo total até esta parada (em segundos)
- **Exemplo**: `1322` = 22 minutos
- **Uso**: "Faltam 22 minutos até o fim da linha"

#### `modal` (integer)
- **O que é**: Modalidade
- **Valores**: `0` = convencional

---

### Campos de cada Vehicle (dentro do service)

#### `prefix` (string)
- **O que é**: Prefixo do veículo
- **Exemplo**: `"2309"`

#### `prediction` (integer)
- **O que é**: Previsão de chegada (em segundos)
- **Exemplo**: `262` = 4min 22seg
- **Uso**: "Próximo em X minutos"

#### `type` (string)
- **O que é**: Tipo da previsão
- **Valores**:
  - `"MESSAGE"` = tempo real
  - `"SCHEDULE"` = agendado

#### `lat` / `lng` (float)
- **O que é**: Posição atual do veículo
- **Uso**: Mostrar no mapa

#### `bearing` (integer)
- **O que é**: Direção do veículo

#### `averageSpeed` (float)
- **O que é**: Velocidade atual (km/h)

---

## 💡 COMO USAR NO SITE

```javascript
async function carregarRotasPonto(stopId) {
  const url = `https://core.cittamobi.com.br/prediction/stop/${stopId}`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  const data = await response.json();
  
  return data.services.map(s => ({
    codigo: s.routeCode,
    nome: s.routeMnemonic,
    direcao: s.serviceMnemonic,
    serviceId: s.serviceId,
    veiculosAtivos: s.activeVehicles,
    tempoTotal: s.totalTravelTimeUntilStopSeconds,
    temTempoReal: s.hasRealTime,
    proximos: s.vehicles.map(v => ({
      prefixo: v.prefix,
      previsao: v.prediction,
      tipo: v.type
    }))
  }));
}

// Exibir rotas disponíveis
async function mostrarRotasPonto(stopId) {
  const rotas = await carregarRotasPonto(stopId);
  
  const html = rotas.map(r => `
    <div class="rota" onclick="selecionarRota('${r.serviceId}')">
      <h3>${r.codigo} - ${r.nome}</h3>
      <p>${r.direcao}</p>
      <p>Tempo total: ${Math.round(r.tempoTotal / 60)} min</p>
      ${r.veiculosAtivos > 0 
        ? `<span class="status verde">${r.veiculosAtivos} ônibus</span>`
        : `<span class="status vermelho">Sem ônibus</span>`
      }
    </div>
  `).join('');
  
  document.getElementById('rotas').innerHTML = html;
}
```

---

## 🎯 COMO INTERPRETAR

### activeVehicles
| Valor | Significado |
|-------|-------------|
| 0 | Nenhum ônibus circulando |
| 1 | 1 ônibus a caminho |
| 2+ | Múltiplos ônibus |

### hasRealTime
| Valor | Significado |
|-------|-------------|
| true | Dados confiáveis (GPS) |
| false | Dados estimados (horário) |

### totalTravelTimeUntilStopSeconds
| Segundos | Minutos | Interpretação |
|----------|---------|---------------|
| 600 | 10 | Próximo |
| 1800 | 30 | Médio |
| 3600 | 60 | Longe |

---

## ⚠️ CUIDADOS

1. **Muitas rotas**: Uma parada pode ter 10+ rotas
2. **Sem veículos**: `vehicles: []` = nenhum ônibus a caminho
3. **Previsão zero**: `prediction: 0` = ônibus no ponto agora
4. **Tipo SCHEDULE**: Não é tempo real, é estimativa
5. **Atualizar**: Chamar novamente a cada 60 segundos
