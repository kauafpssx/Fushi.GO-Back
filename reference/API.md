# 🚌 CITTAMOBITrack — API Completa
## Todos os Endpoints Verificados (Sem Login!)

**Data**: 21/Jun/2026  
**Status**: ✅ 12 ENDPOINTS VERIFICADOS  
**Auth**: Username header (bcrypt) — NÃO precisa de login de usuário

---

## 🔐 AUTENTICAÇÃO

**Único header obrigatório** (apenas CORE API):
```http
username: $2a$12$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW
```

**Session API NÃO precisa de auth**:
```
https://api.cittamobi.com.br/session/start
```

**Rate Limit**: ✅ NENHUM detectado (450+ requests testadas)  
**Cache HTTP**: ❌ NÃO suportado (ETag, Last-Modified ausentes)  
**Compressão**: ✅ GZIP suportado  
**Tempo Real**: ❌ Sem WebSocket/SSE — REST puro

---

## ✅ TODOS OS ENDPOINTS

### Session API (sem auth)

| # | Método | Endpoint | Descrição |
|---|--------|----------|-----------|
| 1 | GET | `/session/start?lat={lat}&lng={lng}` | Detecta cidade |

### CORE API (com username header)

| # | Método | Endpoint | Descrição |
|---|--------|----------|-----------|
| 2 | GET | `/stop/viewport/recommendation?lat={lat}&lng={lng}` | Zoom ideal |
| 3 | GET | `/stops/viewport?nelat={}&nelng={}&swlat={}&swlng={}` | Pontos no mapa |
| 4 | GET | `/search/q?q={query}&a={cityId}&lat={}&lng={}` | Busca por nome |
| 5 | GET | `/vehicles/service/{serviceId}` | Veículos tempo real |
| 6 | GET | `/stops/service/v2/{serviceId}` | Polilinha + paradas |
| 7 | GET | `/prediction/stop/{stopId}` | Previsão na parada |
| 8 | GET | `/prediction/service/{serviceId}/{stopId}` | Previsão detalhada |
| 9 | GET | `/prediction/service/departure/byDate?serviceId={}&date={}` | Horários |
| 10 | GET | `/service/{serviceId}` | Detalhes do serviço |
| 11 | GET | `/route/{routeId}/services` | Serviços de uma rota |
| 12 | POST | `/push/firebase/register` | Registro FCM (app) |

---

## 📍 EXEMPLOS REAIS

### Busca por nome
```
GET /search/q?q=terminal&a=4926&lat=-30.057&lng=-51.192
→ 20 resultados com serviceId para cada rota
```

### Route services (usa routeId!)
```
GET /route/08a00dc8-d280-11f0-a0e6-02001705c31d/services
→ [{ "id": "0ec23b44...", "serviceMnemonic": "Madrugadão..." }]
```

### Viewport (nelat nelng swlat swlng)
```
GET /stops/viewport?nelat=-30.055&nelng=-51.190&swlat=-30.058&swlng=-51.193
→ [{ "id": "...", "mnemonic": "R. Barão do Amazonas 1623...", "location": {...} }]
```

---

## 🚌 STATUS DE CONEXÃO DO VEÍCULO

**Campo-chave**: `type` no objeto de veículo

| `type` | Status | O que significa |
|--------|--------|-----------------|
| `null` | 🟢 Conectado | Veículo real com GPS ativo |
| `"MESSAGE"` | 🟢 Conectado | Veículo real em tempo real |
| `"SCHEDULE"` | 🔴 Desconectado | Sem veículo real, apenas previsão agendada |

### Veículo DESCONECTADO (`type: "SCHEDULE"`)
```json
{
  "type": "SCHEDULE",
  "lat": 0.0,
  "lng": 0.0,
  "prefix": null,
  "plate": null,
  "bearing": null,
  "averageSpeed": 0.0,
  "lastUpdate": 0,
  "id": null,
  "transitTimetableEntryId": "318106507",
  "prediction": 2071
}
```
→ **Não tem veículo real atribuído**. Apenas previsão baseada no horário.

### Veículo CONECTADO (`type: "MESSAGE"` ou `null`)
```json
{
  "type": "MESSAGE",
  "lat": -30.160169,
  "lng": -51.195838,
  "prefix": "2309",
  "plate": "ABC1234",
  "bearing": 119,
  "averageSpeed": 13.98,
  "lastUpdate": 1782019067000,
  "id": "2309"
}
```
→ **Dados reais de GPS** em tempo real.

### Como usar no site
```javascript
function statusConexao(vehicle) {
  if (vehicle.type === "SCHEDULE") {
    return { status: "desconectado", cor: "vermelho", texto: "Sem veículo" };
  }
  if (vehicle.type === "MESSAGE" || vehicle.type === null) {
    return { status: "conectado", cor: "verde", texto: "Em tempo real" };
  }
  return { status: "desconhecido", cor: "cinza", texto: "Indisponível" };
}
```

---

## 🗺️ ITINERÁRIA COMPLETA

**Confirmado**: O endpoint `/stops/service/v2/{serviceId}` retorna **TODAS as paradas** (ida + volta).

- **Exemplo**: Rota M681 retorna **131 paradas** (não apenas 64 de um sentido)
- **Polilinha**: Retorna o caminho completo decodificado
- **Ordem**: Paradas vêm em ordem cronológica (primeira → última)
- **Sem paginação**: Tudo vem em uma única response

---

## 🚀 TESTE RÁPIDO

```bash
# Detectar cidade
curl "https://api.cittamobi.com.br/session/start?lat=-30.032&lng=-51.228"

# Buscar rotas
curl "https://core.cittamobi.com.br/search/q?q=terminal&a=4926" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"

# Pontos no mapa
curl "https://core.cittamobi.com.br/stops/viewport?nelat=-30.03&nelng=-51.22&swlat=-30.04&swlng=-51.23" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"

# Veículos
curl "https://core.cittamobi.com.br/vehicles/service/0ec23b44-d280-11f0-a0e6-02001705c31d" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```
