import { request } from '../../infrastructure/cittamobi/client';
import { endpoints } from '../../infrastructure/cittamobi/endpoints';

export async function getVehicles(serviceId: string): Promise<Vehicle[]> {
  return request<Vehicle[]>({
    path: endpoints.vehicles(serviceId),
  });
}

export interface Vehicle {
  id: string | null;
  prefix: string | null;
  plate: string | null;
  lat: number;
  lng: number;
  bearing: number | null;
  averageSpeed: number;
  lastUpdate: number;
  type: 'MESSAGE' | 'SCHEDULE' | null;
  prediction: number;
}
