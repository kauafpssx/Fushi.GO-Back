export interface SearchResult {
  routeCode: string;
  routeMnemonic: string;
  serviceMnemonic: string;
  id: string;
  activeVehicles: number;
  scheduledVehicles: number;
  hasRealTime: boolean;
  vehicles: unknown[];
  messages: unknown[];
  alerts: unknown[];
}
