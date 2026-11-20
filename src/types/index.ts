export type AirportTier = 'mega_hub' | 'regional_hub' | 'spoke';

export interface Airport {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  tier: AirportTier;
  capacity_per_hour: number;
}

export interface RawFlight {
  flight_id: string;
  tail_id: string;
  leg_order: number;
  origin: string;
  destination: string;
  dep: string;
  arr: string;
  block_minutes: number;
  pax: number;
  turnaround_before_min: number | null;
}

export type FlightStatus = 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'RECOVERED';

export interface SimulatedFlight extends RawFlight {
  actual_dep: string;
  actual_arr: string;
  actual_dep_min: number;
  actual_arr_min: number;
  dep_delay: number;
  arr_delay: number;
  status: FlightStatus;
  delay_reasons: string[];
  is_cancelled: boolean;
  is_swapped: boolean;
  original_tail_id: string;
  current_tail_id: string;
}

export interface RawConnection {
  connection_id: string;
  airport: string;
  from_flight: string;
  to_flight: string;
  passengers: number;
  min_connect_minutes: number;
}

export type ConnectionStatus = 'SAFE' | 'BROKEN';

export interface SimulatedConnection extends RawConnection {
  scheduled_gap_min: number;
  actual_gap_min: number;
  status: ConnectionStatus;
  shortfall_min: number;
  reason: string;
}

export interface RawCrew {
  crew_id: string;
  tail_id: string;
  base: string;
  duty_start: string;
  max_duty_mins: number;
  flight_ids: string[];
}

export type CrewDutyStatus = 'NORMAL' | 'WARNING' | 'VIOLATION';

export interface SimulatedCrew extends RawCrew {
  scheduled_duty_mins: number;
  actual_duty_mins: number;
  actual_duty_end: string;
  status: CrewDutyStatus;
  overage_mins: number;
  duty_utilization_pct: number;
}

export interface SpareAircraft {
  tail_id: string;
  base: string;
  available_from: string;
  seats: number;
}

export interface AircraftSwapAction {
  flight_id: string;
  spare_tail_id: string;
  timestamp: string;
}

export interface SimulationParams {
  closedAirport: string | null;
  closureStart: string; // "07:30"
  closureDuration: number; // in minutes (e.g. 90)
  swaps: AircraftSwapAction[];
  cancellations: string[];
}

export interface SimulationKPIs {
  total_flights: number;
  delayed_flights: number;
  on_time_flights: number;
  cancelled_flights: number;
  recovered_flights: number;
  total_departure_delay_min: number;
  total_arrival_delay_min: number;
  average_delay_min: number;
  broken_connections: number;
  safe_connections: number;
  affected_passengers: number;
  crew_duty_violations: number;
  crew_duty_warnings: number;
}

export interface SimulationResult {
  params: SimulationParams;
  kpis: SimulationKPIs;
  flights: SimulatedFlight[];
  connections: SimulatedConnection[];
  crews: SimulatedCrew[];
  airports: Airport[];
  spare_aircraft: SpareAircraft[];
  timestamp: string;
}

export interface ComparisonDelta {
  delayed_flights_diff: number; // negative means improvement
  total_delay_diff_min: number; // negative means improvement
  broken_connections_diff: number; // negative means improvement
  affected_passengers_diff: number; // negative means improvement
  crew_violations_diff: number; // negative means improvement
  is_improved: boolean;
}

export interface ComparisonResult {
  before: SimulationKPIs;
  after: SimulationKPIs;
  delta: ComparisonDelta;
}

export interface FlightNetworkDataset {
  meta: {
    dataset: string;
    operating_day: string;
    min_turnaround_minutes: number;
    seats_per_aircraft: number;
    notes: string[];
  };
  airports: Airport[];
  flights: RawFlight[];
  connections: RawConnection[];
  crews: RawCrew[];
  spare_aircraft: SpareAircraft[];
}
