import { request } from '../../infrastructure/cittamobi/client';
import { endpoints } from '../../infrastructure/cittamobi/endpoints';

export interface SearchResult {
  id: string;
  name: string;
  serviceId: string;
}

export async function search(query: string, cityId: string, lat: number, lng: number): Promise<SearchResult[]> {
  return request<SearchResult[]>({
    path: endpoints.search(query, cityId, lat, lng),
  });
}
