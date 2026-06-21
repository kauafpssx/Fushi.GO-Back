import { request } from '../../infrastructure/cittamobi/client';
import { endpoints } from '../../infrastructure/cittamobi/endpoints';

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

export async function getPredictions(stopId: string): Promise<Prediction[]> {
  return request<Prediction[]>({
    path: endpoints.predictionStop(stopId),
  });
}

export async function getPredictionService(serviceId: string, stopId: string): Promise<Prediction[]> {
  return request<Prediction[]>({
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
