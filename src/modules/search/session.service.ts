import { request } from '../../infrastructure/cittamobi/client';
import { endpoints } from '../../infrastructure/cittamobi/endpoints';

export interface Session {
  cityId: string;
  cityName: string;
  lat: number;
  lng: number;
}

export async function startSession(lat: number, lng: number): Promise<Session> {
  return request<Session>({
    path: endpoints.session(lat, lng),
    requiresAuth: false,
  });
}
