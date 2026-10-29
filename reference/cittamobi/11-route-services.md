# 🚌 REQUEST 11 — Rotas por ID da Rota
## GET /route/{routeId}/services

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://core.cittamobi.com.br/route/{routeId}/services` |
| **Método** | GET |
| **Auth** | Username header obrigatório |
| **Descrição** | Retorna todos os serviços/rotas que passam por uma linha específica |

---

## 📤 REQUEST

### Headers
```http
username: $2a$12$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW
```

### Path Parameters
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `routeId` | string (UUID) | ✅ | ID da rota (NÃO do serviço!) |

### Exemplo de Request
```bash
curl "https://core.cittamobi.com.br/route/08a00dc8-d280-11f0-a0e6-02001705c31d/services" \
  -H "username: \$2a\$12\$sASJZT6yD4YvC/0UecFui.XU5RiUPM9dZxbPVXTv6VaZkbGcRDURW"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Body da Response
```json
[
  {
    "id": "0ec23b44-d280-11f0-a0e6-02001705c31d",
    "serviceMnemonic": "Madrugadão B. Novo/C. Novo - Centro/Bairro",
    "tags": []
  }
]
```

---

## ⚠️ IMPORTANTE: routeId vs serviceId

| Campo | UUID | Uso |
|-------|------|-----|
| `serviceId` | `0ec23b44-d280-11f0-a0e6-02001705c31d` | Usar em `/vehicles/service/`, `/stops/service/v2/`, `/prediction/service/` |
| `routeId` | `08a00dc8-d280-11f0-a0e6-02001705c31d` | Usar em `/route/{id}/services` |

**Erro comum**: Usar `serviceId` em `/route/{id}/services` — retorna 400!

---

## 📖 EXPLICAÇÃO DOS CAMPOS

A response retorna um **array** com todos os serviços desta linha:

#### `id` (string)
- **O que é**: UUID do serviço
- **Uso**: Usar em endpoints que precisam de serviceId

#### `name` (string)
- **O que é**: Nome completo
- **Uso**: Exibir sentidos diferentes

#### `mnemonic` (string)
- **O que é**: Nome curto
- **Uso**: Título

#### `serviceMnemonic` (string)
- **O que é**: Nome do serviço com direção
- **Exemplo**: `"Madrugadão B. Novo/C. Novo - Centro/Bairro"`

#### `tags` (array)
- **O que é**: Tags do serviço
- **Geralmente**: `[]`

---

## 💡 QUANDO USAR

- **Listar direções**: Verificar se rota tem ida e volta
- **Escolher sentido**: Usuário seleciona "Sentido Centro" ou "Sentido Bairro"
- **Multiplas opções**: Uma linha pode ter 2+ serviços

---

## 💡 COMO USAR NO SITE

```javascript
async function carregarServicosRota(routeId) {
  const url = `https://core.cittamobi.com.br/route/${routeId}/services`;
  
  const response = await fetch(url, {
    headers: { "username": USERNAME }
  });
  
  return await response.json();
}

// Mostrar opções de direção
async function mostrarDirecoes(routeId) {
  const servicos = await carregarServicosRota(routeId);
  
  const html = servicos.map(s => `
    <button onclick="selecionarServico('${s.id}')">
      ${s.serviceMnemonic}
    </button>
  `).join('');
  
  document.getElementById('direcoes').innerHTML = html;
}
```

---

## ⚠️ CUIDADOS

1. **Sempre retornar 400**: Se usar serviceId em vez de routeId
2. **Array pode ter 1 item**: Algumas rotas só têm ida
3. **Resposta simplificada**: Só tem id, serviceMnemonic e tags
