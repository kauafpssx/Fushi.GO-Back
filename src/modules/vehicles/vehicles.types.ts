export type VehicleType = 'MESSAGE' | 'SCHEDULE' | null;

export interface Vehicle {
  id: string | null;
  prefix: string | null;
  plate: string | null;
  lat: number;
  lng: number;
  bearing: number | null;
  averageSpeed: number;
  lastUpdate: number;
  type: VehicleType;
  prediction: number;
  predictionSeconds: number;
  predictionToTripEnd: number;
  transitServiceStopSequence: number;
  graphEdgePercentage: number;
  distanceToNextStop: number;
  distanceFromPreviousStop: number;
  distanceMovedLastUpdate: number;
  wheelchair: boolean;
  climatized: boolean;
  tripNumber: number;
  transitStopId: string | null;
  transitTimetableEntryId: string | null;
  realtimeServiceId: string | null;
  firstSeen: number;
  stopSequence: number;
  oldLatitude: number;
  oldLongitude: number;
  transitAgencyId: string | null;
  transitServiceId: string | null;
  ts: number;
  cars: unknown[] | null;
  tags: unknown[];
}
