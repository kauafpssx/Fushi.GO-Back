import { request } from '../../infrastructure/cittamobi/client';
import { endpoints } from '../../infrastructure/cittamobi/endpoints';

export interface ServiceDetails {
  id: string;
  name: string;
  description: string;
}

export async function getServiceDetails(serviceId: string): Promise<ServiceDetails> {
  return request<ServiceDetails>({
    path: endpoints.serviceDetails(serviceId),
  });
}

export async function getRouteServices(routeId: string): Promise<{ id: string; name: string }[]> {
  return request<{ id: string; name: string }[]>({
    path: endpoints.routeServices(routeId),
  });
}
