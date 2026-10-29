import { request } from '../../infrastructure/cittamobi/client';
import { endpoints } from '../../infrastructure/cittamobi/endpoints';

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export async function getStopsViewport(
  nelat: number,
  nelng: number,
  swlat: number,
  swlng: number
): Promise<Stop[]> {
  return request<Stop[]>({
    path: endpoints.stopsViewport(nelat, nelng, swlat, swlng),
  });
}

export async function getStopsService(serviceId: string): Promise<Stop[]> {
  return request<Stop[]>({
    path: endpoints.stopsService(serviceId),
  });
}

export async function getStop(stopId: string): Promise<Stop | null> {
  try {
    const stops = await request<Stop[]>({
      path: `/stops/${stopId}`,
    });
    if (Array.isArray(stops)) {
      return stops[0] ?? null;
    }
    return stops as unknown as Stop;
  } catch (e) {
    return null;
  }
}
