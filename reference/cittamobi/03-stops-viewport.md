# 🚌 REQUEST 3 — Pontos no Mapa (Viewport)
## GET /stops/viewport

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/stops/viewport` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Retorna todos os pontos de ônibus visíveis na tela do mapa |

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
| `nelat` | float | ✅ | Latitude do canto superior direito |
| `nelng` | float | ✅ | Longitude do canto superior direito |
| `swlat` | float | ✅ | Latitude do canto inferior esquerdo |
| `swlng` | float | ✅ | Longitude do canto inferior esquerdo |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/stops/viewport?nelat=-30.055634&nelng=-51.190185&swlat=-30.058686&swlng=-51.193650" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response (Array)
```json
[
  {
    "id": "3f784ce5-6a0f-40b4-bf7f-569828bc9bb3",
    "remoteId": null,
    "mnemonic": "R. Barão do Amazonas 1623, Jd. Botânico, Porto Alegre - Rio Grande do Sul, 90670-002, Brasil",
    "location": {
      "lat": -30.057152,
      "lng": -51.19052
    },
    "bearing": 210,
    "status": "OK",
    "kind": 1,
    "services": [],
    "remoteBusStops": null,
    "officialBusStop": null,
    "origin": null,
    "routeTypes": 1,
    "modal": 0
  },
  {
    "id": "bab69ffa-ff97-4dda-b656-0f8a97c2c049",
    "remoteId": null,
    "mnemonic": "Bento de Amaral - Partenon, Porto Alegre - RS, 90670-005, Brasil",
    "location": {
      "lat": -30.05678,
      "lng": -51.19051
    },
    "bearing": 116,
    "status": "OK",
    "kind": 1,
    "services": [],
    "remoteBusStops": null,
    "officialBusStop": null,
    "origin": null,
    "routeTypes": 1,
    "modal": 0
  }
]
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

### `id` (string)
- **O que é**: UUID único do ponto de ônibus
- **Formato**: `3f784ce5-6a0f-40b4-bf7f-569828bc9bb3`
- **Uso**: Identificador para outros endpoints (prediction/stop/{id})

### `remoteId` (string|null)
- **O que é**: ID do ponto no sistema externo
- **Geralmente**: `null` (não mapeado)
- **Uso**: Integração com sistemas legados

### `mnemonic` (string)
- **O que é**: Nome/endereço do ponto
- **Formato**: `"Rua, Número, Bairro, Cidade - Estado, CEP, País"`
- **Exemplo**: `"R. Barão do Amazonas 1623, Jd. Botânico, Porto Alegre - Rio Grande do Sul, 90670-002, Brasil"`
- **Uso**: Exibir como label do marker no mapa

### `location` (object)
- **O que é**: Coordenadas geográficas do ponto
- **Campos**:
  - `lat` (float): Latitude
  - `lng` (float): Longitude
- **Uso**: Posicionar marker no mapa

### `bearing` (integer|null)
- **O que é**: Direção do ônibus neste ponto (em graus)
- **Valores**: 0-360 (0=Norte, 90=Leste, 180=Sul, 270=Oeste)
- **Exemplo**: `210` =sudoeste
- **Uso**: Rotacionar ícone do ônibus na direção correta
- **Quando null**: Ponto sem direção definida

### `status` (string)
- **O que é**: Status do ponto
- **Valores comuns**: `"OK"` = ativo
- **Uso**: Filtrar pontos ativos vs inativos

### `kind` (integer)
- **O que é**: Tipo do ponto
- **Valores**:
  - `1` = Ponto regular (parada de ônibus)
  - `2` = Terminal
  - `3` = Estação
- **Uso**: Diferenciar tipos de paradas

### `services` (array)
- **O que é**: Lista de rotas que passam por este ponto
- **Geralmente**: `[]` (vazio neste endpoint)
- **Uso**: Para este endpoint, não retorna rotas (usar prediction/stop)

### `remoteBusStops` (object|null)
- **O que é**: Dados de pontos remotos
- **Geralmente**: `null`
- **Uso**: Integração com sistemas externos

### `officialBusStop` (object|null)
- **O que é**: Dados do ponto oficial (SPTrans, etc)
- **Geralmente**: `null`
- **Uso**: Integração com sistemas de transporte oficiais

### `origin` (object|null)
- **O que é**: Origem do dado
- **Geralmente**: `null`
- **Uso**: Rastreabilidade

### `routeTypes` (integer)
- **O que é**: Tipos de rota que passam pelo ponto
- **Valores**:
  - `1` = Ônibus
  - `2` = Metrô
  - `3` = Trem
  - `4` = Barco
- **Uso**: Filtrar por modo de transporte

### `modal` (integer)
- **O que é**: Modalidade do transporte
- **Valores**:
  - `0` = Convencional
  - `1` = Expresso
  - `2` = BRT
- **Uso**: Diferenciar tipos de serviço

---

## 💡 COMO USAR NO SITE

```javascript
async function carregarPontos(mapa) {
  const bounds = mapa.getBounds();
  
  const nelat = bounds.getNorthEast().lat;
  const nelng = bounds.getNorthEast().lng;
  const swlat = bounds.getSouthWest().lat;
  const swlng = bounds.getSouthWest().lng;
  
  const url = `https://core.cittamobi.com.br/stops/viewport?nelat=${nelat}&nelng=${nelng}&swlat=${swlat}&swlng=${swlng}`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  const pontos = await response.json();
  
  pontos.forEach(ponto => {
    // Criar marker no mapa
    const marker = L.marker([ponto.location.lat, ponto.location.lng])
      .addTo(mapa)
      .bindPopup(`
        <b>${ponto.mnemonic.split(',')[0]}</b><br>
        ${ponto.mnemonic}
      `);
    
    // Ao clicar, carregar rotas
    marker.on('click', () => {
      carregarRotasPonto(ponto.id);
    });
  });
  
  return pontos;
}

// Evento de movimento do mapa
mapa.on('moveend', () => {
  carregarPontos(mapa);
});
```

---

## 🗺️ COMO OBTER OS BOUNDS DO MAPA

### Leaflet
```javascript
const bounds = map.getBounds();
const nelat = bounds.getNorthEast().lat;
const nelng = bounds.getNorthEast().lng;
const swlat = bounds.getSouthWest().lat;
const swlng = bounds.getSouthWest().lng;
```

### Google Maps
```javascript
const bounds = map.getBounds();
const nelat = bounds.getNorthEast().lat();
const nelng = bounds.getNorthEast().lng();
const swlat = bounds.getSouthWest().lat();
const swlng = bounds.getSouthWest().lng();
```

### Mapbox
```javascript
const bounds = map.getBounds();
const nelat = bounds.getNorthEast().lat;
const nelng = bounds.getNorthEast().lng;
const swlat = bounds.getSouthWest().lat;
const swlng = bounds.getSouthWest().lng;
```

---

## ⚠️ CUIDADOS

1. **Parâmetros corretos**: Usar `nelat`, `nelng`, `swlat`, `swlng` (NÃO minLat/maxLat)
2. **Viewport pequeno**: Se a área for muito grande, retorna muitos pontos
3. **Viewport grande**: Se a área for muito pequena, retorna poucos pontos
4. **Atualizar ao mover**: Chamar sempre que o mapa mover
5. **Debounce**: Esperar 300ms após parar de mover para evitar spam
