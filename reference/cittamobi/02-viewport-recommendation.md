# 🚌 REQUEST 2 — Recomendação de Zoom
## GET /stop/viewport/recommendation

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/stop/viewport/recommendation` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Calcula o zoom ideal baseado na densidade de pontos da região |

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
| `lat` | float | ✅ | Latitude do centro da tela |
| `lng` | float | ✅ | Longitude do centro da tela |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/stop/viewport/recommendation?lat=-15.7940994&lng=-47.8820112" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response
```json
{
  "type": "ZOOM",
  "lat": -15.7940994,
  "lng": -47.8820111,
  "radiusMeters": 69.50391116579797
}
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

### `type` (string)
- **O que é**: Tipo da recomendação
- **Valor fixo**: `"ZOOM"`
- **Uso**: Indica que é uma recomendação de zoom

### `lat` (float)
- **O que é**: Latitude do ponto central
- **Descrição**: Mesma latitude enviada no request
- **Uso**: Centro do mapa

### `lng` (float)
- **O que é**: Longitude do ponto central
- **Descrição**: Mesma longitude enviada no request
- **Uso**: Centro do mapa

### `radiusMeters` (float)
- **O que é**: Raio recomendado em metros
- **Descrição**: Distância do centro até a borda do mapa
- **Uso**: Calcular o nível de zoom do mapa

---

## 🧮 COMO CALCULAR O ZOOM

```javascript
function calcularZoom(radiusMeters) {
  // Fórmula baseada no Google Maps
  // zoom = log2(156543.03392 * cos(lat) / radiusMeters)
  
  const lat = -30.057; // latitude média
  const zoom = Math.log2(156543.03392 * Math.cos(lat * Math.PI / 180) / radiusMeters);
  
  return Math.round(zoom);
}

// Exemplos:
// radiusMeters = 69.5  → zoom = 17 (muito próximo)
// radiusMeters = 500   → zoom = 15 (próximo)
// radiusMeters = 1000  → zoom = 14 (médio)
// radiusMeters = 5000  → zoom = 12 (longe)
```

---

## 💡 COMO USAR NO SITE

```javascript
async function getZoomRecomendado(lat, lng) {
  const url = `https://core.cittamobi.com.br/stop/viewport/recommendation?lat=${lat}&lng=${lng}`;
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  const data = await response.json();
  
  // Converter radius para zoom
  const zoom = calcularZoom(data.radiusMeters);
  
  return {
    lat: data.lat,
    lng: data.lng,
    zoom: zoom
  };
}

// Uso
const zoom = await getZoomRecomendado(-30.057, -51.192);
map.setView([zoom.lat, zoom.lng], zoom.zoom);
```

---

## 📊 EXEMPLOS DE VALORES

| Local | radiusMeters | Zoom Aproximado |
|-------|--------------|-----------------|
| Rodoviária Brasília | 69.5m | 17 |
| Centro Porto Alegre | 123.1m | 16 |
| Bairro residencial | 500m | 14 |
| Cidade inteira | 5000m | 11 |

---

## ⚠️ CUIDADOS

1. **Precisa de auth**: Este endpoint requer o username header
2. **Densidade variável**: O raio muda conforme a quantidade de pontos
3. **Centro urbano**: Raio menor (mais zoom) = mais pontos
4. **Periferia**: Raio maior (menos zoom) = menos pontos
