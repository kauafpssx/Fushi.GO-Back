import { env } from '../../app/env';

export const endpoints = {
  session: (lat: number, lng: number) =>
    `${env.cittamobiSessionUrl}/session/start?lat=${lat}&lng=${lng}`,

  search: (query: string, cityId: string, lat: number, lng: number) =>
    `${env.cittamobiCoreUrl}/search/q?q=${encodeURIComponent(query)}&a=${cityId}&lat=${lat}&lng=${lng}`,

  vehicles: (serviceId: string) =>
    `${env.cittamobiCoreUrl}/vehicles/service/${serviceId}`,

  stopsService: (serviceId: string) =>
    `${env.cittamobiCoreUrl}/stops/service/v2/${serviceId}`,

  stopsViewport: (nelat: number, nelng: number, swlat: number, swlng: number) =>
    `${env.cittamobiCoreUrl}/stops/viewport?nelat=${nelat}&nelng=${nelng}&swlat=${swlat}&swlng=${swlng}`,

  viewportRecommendation: (lat: number, lng: number) =>
    `${env.cittamobiCoreUrl}/stop/viewport/recommendation?lat=${lat}&lng=${lng}`,

  predictionStop: (stopId: string) =>
    `${env.cittamobiCoreUrl}/prediction/stop/${stopId}`,

  predictionService: (serviceId: string, stopId: string) =>
    `${env.cittamobiCoreUrl}/prediction/service/${serviceId}/${stopId}`,

  predictionDeparture: (serviceId: string, date: string, time?: string) => {
    let url = `${env.cittamobiCoreUrl}/prediction/service/departure/byDate?serviceId=${serviceId}&date=${date}`;
    if (time) url += `&time=${time}`;
    return url;
  },

  serviceDetails: (serviceId: string) =>
    `${env.cittamobiCoreUrl}/service/${serviceId}`,

  routeServices: (routeId: string) =>
    `${env.cittamobiCoreUrl}/route/${routeId}/services`,
} as const;
