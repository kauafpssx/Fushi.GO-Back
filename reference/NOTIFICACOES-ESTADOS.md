# Sistema de Notificações por Estados

## Visão Geral

O worker agora usa máquina de estados ao invés de notificar por minuto. Também adiciona detecção de "chegou" por inferência e aviso de "hora de sair".

## Estados

| Estado | Condição | Título | Corpo |
|--------|----------|--------|-------|
| `normal` | `etaMinutes > 5` | `🚌 Linha {routeCode} – Chega em {minute} min` | `O ônibus {prefix} está a aproximadamente {minute} min da tua parada.` |
| `approaching` | `1 < etaMinutes <= 5` | `🚌 Linha {routeCode} – Faltam {minute} min` | Se `vehicle.distance` disponível: `O ônibus {prefix} está a {distance}m da tua parada.` Senão: `O ônibus {prefix} está a {minute} min da tua parada.` |
| `imminent` | `etaMinutes < 1` | `🚌 Linha {routeCode} – Tá chegando!` | `O ônibus {prefix} está a poucos metros da tua parada!` |
| `arrived` | Ônibus sumiu da previsão após ter sido notificado | `✅ Linha {routeCode} – Chegou!` | `O ônibus {prefix} chegou à tua parada.` |
| `departureReminder` | `etaMinutes <= walkingMinutes + 2.5` e `etaMinutes >= walkingMinutes - 1` | `⏰ Hora de sair! Linha {routeCode}` | `O ônibus {prefix} chega em {minute} min. Hora de ir para a parada!` |

## Regras

- Só processa inscrições com `serviceId` informado
- Usa `tag: bus-{serviceId}-{stopId}` para substituir notificação anterior no cliente
- Evita reenvio do mesmo estado + mesmo prefixo (exceto `departureReminder` com cooldown de 5 min)
- `departureReminder` precisa de coordenadas do usuário + parada para calcular tempo de caminhada (Haversine, ~72m/min com folga)
- `arrived` é inferido: guarda último ônibus visto e notificado por grupo, quando some dispara uma vez
- Threshold de abordagem: `etaMinutes <= 15`

## Novos campos no Redis

```json
{
  "lastNotifiedState": "normal|approaching|imminent|arrived|departureReminder|null",
  "lastNotifiedPrefix": "string|null",
  "lastNotifiedPrediction": "number|null",
  "userLat": "number|null",
  "userLng": "number|null",
  "walkingMinutes": "number|null",
  "enableDepartureReminder": "true|false"
}
```

## Novas rotas

- `GET /v1/notifications/:id/status` - Status da inscrição (apenas dono)

## Mudanças no worker

- Máquina de estados ao invés de filtro por minuto
- Cálculo de distância caminhada com Haversine
- Rastreamento por grupo `(serviceId:stopId)` para detectar chegada
- Cache em memória `lastSeenByGroup` para inferir `arrived`
