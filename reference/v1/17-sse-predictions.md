# GET /live/predictions/:stopId

Previsões em tempo real via SSE.

## Request

```http
GET /live/predictions/8a5197b2-d51d-49f5-8d30-d6a645a75685?sseToken=<token>
X-Device-Id: <deviceId>
```

## Response (SSE)

```
data: [{"routeCode":"398","vehicles":[{"prefix":"3395","prediction":120}],"totalTravelTimeUntilStopSeconds":2100}]
```

## Uso

```js
const events = new EventSource(
  `/live/predictions/${stopId}?sseToken=${token}`
);

events.onmessage = (e) => {
  const predictions = JSON.parse(e.data);
  updatePredictionList(predictions);
};
```

## Comportamento

Mesmo do SSE vehicles: polling 5s, dedup, compartilhado.
