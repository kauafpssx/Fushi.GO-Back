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

export interface StopPredictionService {
  routeCode: string;
  routeMnemonic: string;
  serviceMnemonic: string;
  companyId: string;
  stopId: string;
  serviceId: string;
  routeId: string;
  id: string | null;
  activeVehicles: number;
  scheduledVehicles: number;
  predictionType: string | null;
  bgcolor: string | null;
  fgcolor: string | null;
  vehicles: StopPredictionVehicle[];
  messages: unknown[];
  alerts: unknown[];
  hasRealTime: boolean;
  estimatedInterval: number | null;
  totalTravelTimeUntilStopSeconds: number;
  modal: number;
}

export interface StopPredictionVehicle {
  prefix: string;
  lat: number;
  lng: number;
  bearing: number;
  averageSpeed: number;
  prediction: number;
  type: string | null;
  wheelchair: boolean;
  climatized: boolean;
}

export interface StopPredictionsResponse {
  messages: unknown[];
  alerts: unknown[];
  services: StopPredictionService[];
}

export interface DepartureTimestamp {
  departureTimestamp: number;
}

export interface DayDepartures {
  date: string;
  dayOfWeek: string;
  departures: DepartureTimestamp[];
}

export interface ServiceSchedule {
  serviceId: string;
  schedule: DayDepartures[];
}
