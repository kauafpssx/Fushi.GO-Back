export interface ServiceDetails {
  routeCode: string;
  routeMnemonic: string;
  serviceMnemonic: string;
  id: string;
  activeVehicles: number;
  scheduledVehicles: number;
  hasRealTime: boolean;
  estimatedInterval: number | null;
  totalTravelTimeUntilStopSeconds: number | null;
  vehicles: unknown[];
  messages: unknown[];
  alerts: unknown[];
}

export interface RouteService {
  id: string;
  serviceMnemonic: string;
}
