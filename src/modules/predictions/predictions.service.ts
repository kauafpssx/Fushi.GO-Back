import { request } from '../../infrastructure/cittamobi/client';
import { endpoints } from '../../infrastructure/cittamobi/endpoints';
import type { DepartureTimestamp, DayDepartures, ServiceSchedule, StopPredictionsResponse } from './predictions.types';

export type { StopPredictionsResponse };

export interface Prediction {
  stopId: string;
  stopName: string;
  arrivals: Arrival[];
}

export interface Arrival {
  serviceId: string;
  serviceName: string;
  arrivalTime: number;
  arrivalSeconds: number;
}

export async function getPredictions(stopId: string): Promise<StopPredictionsResponse> {
  return request<StopPredictionsResponse>({
    path: endpoints.predictionStop(stopId),
  });
}

export async function getPredictionService(serviceId: string, stopId: string): Promise<StopPredictionsResponse> {
  return request<StopPredictionsResponse>({
    path: endpoints.predictionService(serviceId, stopId),
  });
}

export interface Departure {
  serviceId: string;
  serviceName: string;
  departureTime: number;
  departureSeconds: number;
}

export async function getPredictionDeparture(
  serviceId: string,
  date: string,
  time?: string
): Promise<Departure[]> {
  return request<Departure[]>({
    path: endpoints.predictionDeparture(serviceId, date, time),
  });
}

function getNextDates(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const dayFetchCache = new Map<string, Promise<ServiceSchedule>>();

export async function getServiceSchedule(
  serviceId: string,
  days: number = 7
): Promise<ServiceSchedule> {
  const dates = getNextDates(days);

  const cacheKey = `schedule:${serviceId}:${days}`;
  const cached = dayFetchCache.get(cacheKey);
  if (cached) {
    const result = await cached;
    return result;
  }

  const promise = (async () => {
    const results = await Promise.all(
      dates.map(async (date) => {
        const departures = await request<DepartureTimestamp[]>({
          path: endpoints.predictionDeparture(serviceId, date),
        });
        return { date, departures };
      })
    );

    return {
      serviceId,
      schedule: results.map((r) => ({
        date: r.date,
        dayOfWeek: new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }),
        departures: r.departures,
      })),
    };
  })();

  dayFetchCache.set(cacheKey, promise);
  promise.finally(() => dayFetchCache.delete(cacheKey));

  return promise;
}
