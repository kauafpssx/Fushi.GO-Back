# 🚌 REQUEST 6 — Polilinha e Paradas da Rota
## GET /stops/service/v2/{serviceId}

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/stops/service/v2/{serviceId}` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Retorna a polilinha (caminho) e todas as paradas de uma rota |

---

## 📤 REQUEST

### Headers
```http
username: $2a$12$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW
```

### Path Parameters
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `serviceId` | string (UUID) | ✅ | ID do serviço/rota |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/stops/service/v2/0ec23b44-d280-11f0-a0e6-02001705c31d" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response
```json
{
  "polyline": "hshvDrmtwHjp@bCN\\D\\Cx@w@bAk@^yAvAm@D]SMYGq@f@}E?eBOo@AUqAgDcEsDHS`c@od@cKsTrLcIjAi@~k@{Hb[lJnBP|XeRnBu@br@tHoAjAuAt@Wp@?",
  "stops": [
    {
      "id": "8c2a816f-d00f-4fbb-b8bd-bbbc706cd93e",
      "remoteId": null,
      "mnemonic": "R. Domingos Crescêncio 43, Santana, Porto Alegre - Rio Grande do Sul, 90650-090, Brasil",
      "location": {
        "lat": -30.050491,
        "lng": -51.21012
      },
      "bearing": null,
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
      "id": "61f4cc55-84ed-4e5b-b02c-bc768f54ce1d",
      "remoteId": null,
      "mnemonic": "Av. Princesa Isabel 160, Azenha, Porto Alegre - Rio Grande do Sul, 90620-000, Brasil",
      "location": {
        "lat": -30.050224,
        "lng": -51.21153
      },
      "bearing": 240,
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
}
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

### `polyline` (string)
- **O que é**: Polilinha codificada no formato Google
- **Formato**: `"{encoding}` (Polyline Encoding Algorithm)
- **Uso**: Desenhar a rota no mapa
- **Decodificação**: Necessita biblioteca específica

### `stops` (array)
- **O que é**: Lista de **TODAS** as paradas da rota (ida + volta, em ordem)
- **Confirmado**: API retorna itinerária completa (ex: 131 paradas na rota M681)
- **Uso**: Criar markers das paradas no mapa
- **Sem paginação**: Tudo vem em uma única response

#### Campos de cada stop:

##### `id` (string)
- **O que é**: UUID da parada
- **Uso**: Identificador para prediction/stop/{id}

##### `mnemonic` (string)
- **O que é**: Nome/endereço da parada
- **Uso**: Label do marker

##### `location` (object)
- **O que é**: Coordenadas da parada
- **Campos**: `lat`, `lng`
- **Uso**: Posicionar marker

##### `bearing` (integer|null)
- **O que é**: Direção do ônibus neste ponto
- **Uso**: Rotacionar ícone

##### `status` (string)
- **O que é**: Status da parada
- **Valores**: `"OK"` = ativa

##### `kind` (integer)
- **O que é**: Tipo da parada
- **Valores**: `1` = regular

##### `routeTypes` (integer)
- **O que é**: Tipo de transporte
- **Valores**: `1` = ônibus

---

## 🔧 DECODIFICANDO A POLILINHA

### Bibliotecas recomendadas:

#### JavaScript (Leaflet)
```javascript
// Usando leaflet-plugins
function decodePolyline(encoded) {
  var points = [], index = 0, lat = 0, lng = 0;
  
  while (index < encoded.length) {
    var b, shift = 0, result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
    
    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
    
    points.push([lat / 1e5, lng / 1e5]);
  }
  
  return points;
}

// Uso
const polyline = "hshvDrmtwHjp@bCN...";
const pontos = decodePolyline(polyline);
L.polyline(pontos, { color: 'blue', weight: 5 }).addTo(map);
```

#### Python
```python
def decode_polyline(encoded):
    decoded = []
    lat, lng = 0, 0
    index = 0
    
    while index < len(encoded):
        b, shift, result = 0, 0, 0
        
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        
        lat += ~(result >> 1) if result & 1 else result >> 1
        
        shift, result = 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        
        lng += ~(result >> 1) if result & 1 else result >> 1
        
        decoded.append((lat / 1e5, lng / 1e5))
    
    return decoded
```

---

## 💡 COMO USAR NO SITE

```javascript
async function carregarRota(serviceId) {
  const url = `https://core.cittamobi.com.br/stops/service/v2/${serviceId}`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  const data = await response.json();
  
  // Decodificar polilinha
  const pontosRota = decodePolyline(data.polyline);
  
  // Desenhar rota no mapa
  L.polyline(pontosRota, {
    color: '#667eea',
    weight: 5,
    opacity: 0.8
  }).addTo(map);
  
  // Criar markers das paradas
  data.stops.forEach((stop, index) => {
    L.marker([stop.location.lat, stop.location.lng])
      .addTo(map)
      .bindPopup(`
        <b>Parada ${index + 1}</b><br>
        ${stop.mnemonic}
      `);
  });
  
  return data;
}
```

---

## 🎯 ORDEM DAS PARADAS

As paradas vêm em **ordem cronológica** (da primeira à última da rota):
1. Primeira parada = Início da rota
2. Última parada = Fim da rota
3. A polilinha segue essa mesma ordem

---

## ⚠️ CUIDADOS

1. **Polilinha codificada**: Precisa de biblioteca para decodificar
2. **Ordem importante**: As paradas estão em ordem da rota
3. **Muitas paradas**: Algumas rotas têm 50+ paradas
4. **Polilinha longa**: Pode ter thousands de caracteres
5. **Performance**: Decodificar polilinha pode ser pesado (fazer uma vez)
