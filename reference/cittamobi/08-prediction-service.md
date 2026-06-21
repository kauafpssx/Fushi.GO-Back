# 🚌 REQUEST 8 — Previsão por Serviço + Parada
## GET /prediction/service/{serviceId}/{stopId}

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/prediction/service/{serviceId}/{stopId}` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Previsão detalhada de um serviço específico em uma parada específica |

---

## 📤 REQUEST

### Headers
```http
username: $2a$12$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW
```

### Path Parameters
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `serviceId` | string (UUID) | ✅ | ID do serviço |
| `stopId` | string (UUID) | ✅ | ID da parada |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/prediction/service/0ec23b44-d280-11f0-a0e6-02001705c31d/35f189cd-7340-4600-b265-6bf526c6345d" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response
```json
{
  "routeCode": "M681",
  "routeMnemonic": "NOTURNA BELEM NOVO / CAMPO NOVO",
  "serviceMnemonic": "Madrugadão B. Novo/C. Novo - Centro/Bairro",
  "companyId": "075b0ae1-d280-11f0-a0e6-02001705c31d",
  "stopId": "35f189cd-7340-4600-b265-6bf526c6345d",
  "serviceId": "0ec23b44-d280-11f0-a0e6-02001705c31d",
  "routeId": "08a00dc8-d280-11f0-a0e6-02001705c31d",
  "id": null,
  "activeVehicles": 0,
  "scheduledVehicles": 0,
  "predictionType": "ARRIVAL",
  "bgcolor": null,
  "fgcolor": null,
  "vehicles": [
    {
      "tripNumber": 0,
      "firstSeen": 0,
      "transitStopId": "f60bb81d-8a9a-44eb-a6d0-cae509bd5dc7",
      "transitServiceStopSequence": 52,
      "stopSequence": 0,
      "oldLatitude": 0.0,
      "oldLongitude": 0.0,
      "graphEdgePercentage": 0.0,
      "distanceToNextStop": 89.81,
      "distanceFromFirstPoint": 0.0,
      "distanceFromPreviousStop": 265.99,
      "distanceMovedLastUpdate": 0.0,
      "transitAgencyId": "075b0ae1-d280-11f0-a0e6-02001705c31d",
      "transitServiceId": "0ec23b44-d280-11f0-a0e6-02001705c31d",
      "transitTimetableEntryId": "318106507",
      "realtimeServiceId": "GTFS-ROUTE_CODE_1096_M681_1",
      "predictionSeconds": 0,
      "predictionToTripEnd": 0,
      "plate": "",
      "prefix": "2334",
      "ts": 0,
      "lat": -30.12425994873047,
      "lng": 0.0,
      "bearing": 173,
      "wheelchair": false,
      "climatized": false,
      "prediction": 1494,
      "age": 17,
      "type": "MESSAGE",
      "lastUpdate": 1782021494000,
      "averageSpeed": 0.0,
      "cars": null,
      "tags": [],
      "id": "2334"
    }
  ],
  "messages": [],
  "alerts": [],
  "hasRealTime": false,
  "estimatedInterval": null,
  "totalTravelTimeUntilStopSeconds": 3626,
  "modal": 0
}
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

Este endpoint retorna os **mesmos campos** do `/prediction/stop/{stopId}`. O `vehicles` array contém o objeto completo do veículo (mesma estrutura do `/vehicles/service/{id}`).

**Diferença do /prediction/stop/{id}**: Retorna previsão para **um serviço específico** (não todos).

---

## 💡 QUANDO USAR

| Endpoint | Quando usar |
|----------|-------------|
| `/prediction/stop/{id}` | Quando o usuário clica numa parada e quer ver TODAS as rotas |
| `/prediction/service/{serviceId}/{stopId}` | Quando o usuário já selecionou uma rota específica e quer ver detalhes |

---

## 💡 COMO USAR NO SITE

```javascript
async function carregarPrevisaoDetalhada(serviceId, stopId) {
  const url = `https://core.cittamobi.com.br/prediction/service/${serviceId}/${stopId}`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  const data = await response.json();
  
  return {
    rota: `${data.routeCode} - ${data.routeMnemonic}`,
    direcao: data.serviceMnemonic,
    tempoTotal: data.totalTravelTimeUntilStopSeconds,
    temTempoReal: data.hasRealTime,
    intervalo: data.estimatedInterval,
    proximos: data.vehicles.map(v => ({
      prefixo: v.prefix,
      previsao: v.prediction,
      tipo: v.type,
      lat: v.lat,
      lng: v.lng
    }))
  };
}
```

---

## ⚠️ CUIDADOS

1. **Pode retornar sem vehicles**: Se nenhum ônibus estiver a caminho
2. **estimatedInterval pode ser null**: Se não tem intervalo calculado
3. **Comparar com /prediction/stop**: O endpoint anterior mostra todas as rotas; este mostra apenas uma
