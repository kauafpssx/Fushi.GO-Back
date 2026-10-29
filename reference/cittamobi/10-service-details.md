# 🚌 REQUEST 10 — Detalhes de uma Rota (Service)
## GET /service/{serviceId}

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/service/{serviceId}` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Retorna informações de uma rota específica |

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

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/service/0ec23b44-d280-11f0-a0e6-02001705c31d" \
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
  "stopId": null,
  "serviceId": null,
  "routeId": "08a00dc8-d280-11f0-a0e6-02001705c31d",
  "id": "0ec23b44-d280-11f0-a0e6-02001705c31d",
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
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

Este endpoint retorna a **mesma estrutura** do endpoint de busca (`/search/q`).

#### `id` (string)
- **O que é**: UUID do serviço (serviceId)
- **Uso**: Usar em outros endpoints

#### `routeCode` (string)
- **O que é**: Código da rota
- **Exemplo**: `"M681"`

#### `routeMnemonic` (string)
- **O que é**: Nome da rota
- **Exemplo**: `"NOTURNA BELEM NOVO / CAMPO NOVO"`

#### `serviceMnemonic` (string)
- **O que é**: Nome com direção
- **Exemplo**: `"Madrugadão B. Novo/C. Novo - Centro/Bairro"`

#### `companyId` (string)
- **O que é**: UUID da empresa operadora

#### `routeId` (string)
- **O que é**: UUID da rota (usar em `/route/{id}/services`)

#### `activeVehicles` (integer)
- **O que é**: Veículos ativos

#### `hasRealTime` (boolean)
- **O que é**: Se tem dados em tempo real

#### `modal` (integer)
- **O que é**: Modalidade (0 = convencional)

---

## 💡 QUANDO USAR

- **Detalhes de rota**: Quando usuário clica em "Mais informações"
- **Status**: Verificar se rota está ativa

---

## 💡 COMO USAR NO SITE

```javascript
async function carregarDetalhesRota(serviceId) {
  const url = `https://core.cittamobi.com.br/service/${serviceId}`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  return await response.json();
}

// Exibir detalhes
async function mostrarDetalhes(serviceId) {
  const rota = await carregarDetalhesRota(serviceId);
  
  document.getElementById('detalhes').innerHTML = `
    <h3>${rota.routeMnemonic}</h3>
    <p>${rota.serviceMnemonic}</p>
    <p>Rota: ${rota.routeCode}</p>
    <p>Veículos ativos: ${rota.activeVehicles}</p>
    <p>Tempo real: ${rota.hasRealTime ? 'Sim' : 'Não'}</p>
  `;
}
```

---

## ⚠️ CUIDADOS

1. **Pode retornar 404**: Se serviceId não existe
2. **Mesma estrutura do search**: Não tem campos extras como stopsCount, firstDeparture, etc.
