# 🚌 REQUEST 9 — Previsão de Saída por Data
## GET /prediction/service/departure/byDate

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/prediction/service/departure/byDate` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Retorna previsões de saída para uma data/hora específica |

---

## 📤 REQUEST

### Headers
```http
username: $2a$12$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW
```

### Query Parameters
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `date` | string | ✅ | Data no formato `YYYY-MM-DD` |
| `time` | string | ❌ | Hora no formato `HH:MM` |
| `serviceId` | string (UUID) | ✅ | ID do serviço |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/prediction/service/departure/byDate?date=2026-06-21&serviceId=0ec23b44-d280-11f0-a0e6-02001705c31d" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response
```json
[
  { "departureTimestamp": 1782010800000 },
  { "departureTimestamp": 1782014700000 },
  { "departureTimestamp": 1782019800000 },
  { "departureTimestamp": 1782023400000 }
]
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

Response é um **array simples** de objetos com timestamp.

#### `departureTimestamp` (integer)
- **O que é**: Timestamp da saída programada (em milissegundos)
- **Exemplo**: `1782010800000`
- **Conversão**: `new Date(1782010800000)` = horário da saída
- **Uso**: Converter para horário legível

---

## 💡 QUANDO USAR

Este endpoint é útil para:
- **Consulta de horários**: Verificar quando sai o próximo ônibus
- **Planejamento**: Saber horários de amanhã/semana
- **Horários programados**: Quando não tem veículos em tempo real

---

## 💡 COMO USAR NO SITE

```javascript
async function carregarHorarios(serviceId, data) {
  const url = `https://core.cittamobi.com.br/prediction/service/departure/byDate?date=${data}&serviceId=${serviceId}`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  const horarios = await response.json();
  
  return horarios.map(h => ({
    timestamp: h.departureTimestamp,
    horario: new Date(h.departureTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));
}

// Exibir horários
async function mostrarHorarios(serviceId) {
  const hoje = new Date().toISOString().split('T')[0]; // 2026-06-21
  const horarios = await carregarHorarios(serviceId, hoje);
  
  horarios.forEach(h => {
    console.log(`Saída: ${h.horario}`);
  });
}
```

---

## ⚠️ CUIDADOS

1. **Formato de data**: `YYYY-MM-DD` (ex: `2026-06-21`)
2. **Pode retornar array vazio**: Se não tem horários para aquela data
3. **Timestamp em milissegundos**: Dividir por 1000 para segundos
4. **Útil para horários noturnos**: Quando não tem veículos circulando
