import { request } from '../../infrastructure/cittamobi/client';
import { endpoints } from '../../infrastructure/cittamobi/endpoints';

export interface ViewportRecommendation {
  type: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export async function getViewportRecommendation(
  lat: number,
  lng: number
): Promise<ViewportRecommendation> {
  return request<ViewportRecommendation>({
    path: endpoints.viewportRecommendation(lat, lng),
  });
}
