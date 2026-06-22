# GET /v1/predictions/departure/schedule

Horários de saída agrupados por dia para uma linha.

Agrega automaticamente as partidas dos próximos dias em uma estrutura de tabela por dia.

## Request

```http
GET /v1/predictions/departure/schedule?serviceId=0ebd3ac4-d280-11f0-a0e6-02001705c31d&days=7
Authorization: Bearer <token>
X-Device-Id: <deviceId>
```

## Query Parameters

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| serviceId | string | ✅ | UUID do serviço |
| days | number | ❌ | Quantidade de dias (padrão: 7, máx: 14) |

## Response

```json
{
  "serviceId": "0ebd3ac4-d280-11f0-a0e6-02001705c31d",
  "schedule": [
    {
      "date": "2026-06-22",
      "dayOfWeek": "segunda-feira",
      "departures": [
        { "departureTimestamp": 1782203100000 },
        { "departureTimestamp": 1782204300000 }
      ]
    },
    {
      "date": "2026-06-23",
      "dayOfWeek": "terça-feira",
      "departures": [
        { "departureTimestamp": 1782289500000 }
      ]
    }
  ]
}
```

## Concorrência

Requisições idênticas em paralelo do mesmo client são deduplicadas automaticamente. O cache interno da rota dura apenas o tempo da requisição — os dados sempre vêm frescos da Cittamobi.

## Uso

Montar tabela de horários programados por dia da semana.
