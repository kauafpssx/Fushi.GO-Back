# 🚌 REQUEST 1 — Detecção de Cidade
## GET /session/start

---

## 📋 INFORMAÇÕES GERAIS

| Campo | Valor |
|-------|-------|
| **URL** | `https://api.cittamobi.com.br/session/start` |
| **Método** | GET |
| **Auth** | Nenhuma necessária |
| **Descrição** | Detecta qual cidade o usuário está baseado na localização |

---

## 📤 REQUEST

### Headers
```http
accept-encoding: gzip
host: api.cittamobi.com.br
user-agent: Dart/3.10 (dart:io)
```

### Query Parameters
| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `lat` | float | ✅ | Latitude do usuário |
| `lng` | float | ✅ | Longitude do usuário |

### Exemplo de Request
```bash
curl "https://api.cittamobi.com.br/session/start?lat=-30.0571587&lng=-51.1919182"
```

---

## 📥 RESPONSE

### Status: 200 OK

### Headers da Response
```http
Content-Type: application/json;charset=UTF-8
Set-Cookie: route=1782020337.318.38.98415|880720cbe2e37d1988dac94dc6ad6f48; Expires=Tue, 23-Jun-26 05:38:56 GMT; Max-Age=172800; Path=/; Secure; HttpOnly
```

### Body da Response
```json
{
  "cityId": 4926,
  "name": "RS - Porto Alegre"
}
```

---

## 📖 EXPLICAÇÃO DOS CAMPOS

### `cityId` (integer)
- **O que é**: ID numérico da cidade no sistema Cittamobi
- **Exemplo**: `4926` = Porto Alegre
- **Uso**: Usado em outros endpoints como parâmetro `a` na busca
- **Valores conhecidos**:
  - `4926` → RS - Porto Alegre
  - `5563` → DF - Brasília

### `name` (string)
- **O que é**: Nome da cidade com sigla do estado
- **Formato**: `SIGLA - Nome`
- **Exemplo**: `"RS - Porto Alegre"`, `"DF - Brasília"`
- **Uso**: Exibir para o usuário confirmando a cidade detectada

---

## 🍪 COOKIE

### `route`
- **O que é**: Cookie de roteamento/load balancing
- **Valor**: `1782020337.318.38.98415|880720cbe2e37d1988dac94dc6ad6f48`
- **Expiração**: 2 dias
- **Path**: `/`
- **Flags**: `Secure; HttpOnly`
- **Uso**: Manter o usuário no mesmo servidor

---

## 💡 COMO USAR NO SITE

```javascript
async function detectarCidade(lat, lng) {
  const url = `https://api.cittamobi.com.br/session/start?lat=${lat}&lng=${lng}`;
  const response = await fetch(url);
  const data = await response.json();
  
  console.log(`Cidade detectada: ${data.name}`);
  console.log(`ID da cidade: ${data.cityId}`);
  
  return {
    id: data.cityId,
    nome: data.name
  };
}

// Uso
navigator.geolocation.getCurrentPosition(async (pos) => {
  const cidade = await detectarCidade(
    pos.coords.latitude,
    pos.coords.longitude
  );
  // cidade = { id: 4926, nome: "RS - Porto Alegre" }
});
```

---

## ⚠️ CUIDADOS

1. **Sem autenticação**: Este endpoint é público
2. **Precisa de lat/lng**: Sem esses parâmetros, retorna erro
3. **Cookie importante**: Guardar para manter sessão
4. **Cidade errada**: Se o usuário estiver com GPS desligado, detecta errado

---

## 🔗 ENDPOINTS RELACIONADOS

Após detectar a cidade, usar o `cityId` em:
- `/search/q?q={query}&a={cityId}` — Buscar rotas da cidade
- `/stop/viewport/recommendation` — Zoom recomendado
- `/stops/viewport` — Carregar pontos
