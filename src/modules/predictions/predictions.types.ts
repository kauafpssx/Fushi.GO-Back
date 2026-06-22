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
