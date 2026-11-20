import { describe, it, expect } from 'vitest';
import {
  runSimulation,
  validateAircraftSwap,
  compareSimulations,
  toMinutes,
  toHHMM,
  dataset,
} from '../src/engine/simulation';
import { SimulationParams } from '../src/types';

describe('DOMINO SKY Deterministic Simulation Engine', () => {
  it('preserves exact dataset constants', () => {
    expect(dataset.airports.length).toBe(16);
    expect(dataset.flights.length).toBe(70);
    expect(dataset.connections.length).toBe(21);
    expect(dataset.crews.length).toBe(16);
    expect(dataset.spare_aircraft.length).toBe(2);
    expect(dataset.meta.min_turnaround_minutes).toBe(30);
  });

  it('correctly converts time strings to minutes and back', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('07:30')).toBe(450);
    expect(toMinutes('09:00')).toBe(540);
    expect(toMinutes('23:59')).toBe(1439);

    expect(toHHMM(0)).toBe('00:00');
    expect(toHHMM(450)).toBe('07:30');
    expect(toHHMM(540)).toBe('09:00');
  });

  describe('1. Normal Operations (No Closure)', () => {
    it('produces 0 delays, 0 broken connections, 0 crew violations on baseline schedule', () => {
      const normalParams: SimulationParams = {
        closedAirport: null,
        closureStart: '07:30',
        closureDuration: 0,
        swaps: [],
        cancellations: [],
      };

      const result = runSimulation(normalParams);

      expect(result.kpis.total_flights).toBe(70);
      expect(result.kpis.delayed_flights).toBe(0);
      expect(result.kpis.total_departure_delay_min).toBe(0);
      expect(result.kpis.broken_connections).toBe(0);
      expect(result.kpis.affected_passengers).toBe(0);
      expect(result.kpis.crew_duty_violations).toBe(0);
    });
  });

  describe('2. Airport Closure Calculations & Delay Propagation', () => {
    const bomParams: SimulationParams = {
      closedAirport: 'BOM',
      closureStart: '07:30',
      closureDuration: 90, // Reopens at 09:00
      swaps: [],
      cancellations: [],
    };

    it('holds outbound flights departing BOM until airport reopens (09:00)', () => {
      const result = runSimulation(bomParams);

      // DS0401 was scheduled to depart BOM at 07:45
      const ds0401 = result.flights.find((f) => f.flight_id === 'DS0401')!;
      expect(ds0401.actual_dep).toBe('09:00');
      expect(ds0401.dep_delay).toBe(75); // 09:00 - 07:45 = 75 min

      // DS0501 was scheduled to depart BOM at 08:15
      const ds0501 = result.flights.find((f) => f.flight_id === 'DS0501')!;
      expect(ds0501.actual_dep).toBe('09:00');
      expect(ds0501.dep_delay).toBe(45); // 09:00 - 08:15 = 45 min
    });

    it('enforces 30-minute minimum aircraft turnaround across legs', () => {
      const result = runSimulation(bomParams);

      // VT-DS12 rotation:
      // DS1201 (AMD->BOM): sched arr 07:40, arrives at 09:00
      // DS1202 (BOM->AMD): sched dep 08:10. Must have 30 min turnaround after 09:00 -> departs 09:30!
      const ds1201 = result.flights.find((f) => f.flight_id === 'DS1201')!;
      const ds1202 = result.flights.find((f) => f.flight_id === 'DS1202')!;

      expect(ds1201.actual_arr).toBe('09:00');
      expect(ds1202.actual_dep).toBe('09:30');
      expect(ds1202.dep_delay).toBe(80); // 09:30 - 08:10 = 80 min

      // DS1202 arrives AMD at 09:30 + 70 = 10:40
      // Next leg DS1203 (AMD->DEL) scheduled dep 10:35.
      // Must wait for DS1202 arr (10:40) + 30 min turnaround -> departs 11:10!
      const ds1203 = result.flights.find((f) => f.flight_id === 'DS1203')!;
      expect(ds1203.actual_dep).toBe('11:10');
      expect(ds1203.dep_delay).toBe(35); // 11:10 - 10:35 = 35 min
    });

    it('is completely deterministic across multiple executions', () => {
      const run1 = runSimulation(bomParams);
      const run2 = runSimulation(bomParams);

      expect(run1.kpis).toEqual(run2.kpis);
      expect(run1.flights.map((f) => f.actual_dep)).toEqual(run2.flights.map((f) => f.actual_dep));
    });
  });

  describe('3. Passenger Connection Calculations', () => {
    it('detects broken connections when actual transfer window drops below min_connect_minutes', () => {
      const bomParams: SimulationParams = {
        closedAirport: 'BOM',
        closureStart: '07:30',
        closureDuration: 90,
        swaps: [],
        cancellations: [],
      };

      const result = runSimulation(bomParams);

      // CX01 at BOM: DS1201 (arr 09:00) -> DS1502 (dep 09:30)
      // Gap is 30 mins, but min_connect_minutes is 45 mins -> BROKEN!
      const cx01 = result.connections.find((c) => c.connection_id === 'CX01')!;
      expect(cx01.status).toBe('BROKEN');
      expect(cx01.actual_gap_min).toBe(30);
      expect(cx01.shortfall_min).toBe(15);
      expect(cx01.passengers).toBe(43);

      // CX10 at DEL: DS1203 (arr 12:45) -> DS0903 (dep 13:25)
      // Gap is 40 mins, but min_connect_minutes is 45 mins -> BROKEN!
      const cx10 = result.connections.find((c) => c.connection_id === 'CX10')!;
      expect(cx10.status).toBe('BROKEN');
      expect(cx10.actual_gap_min).toBe(40);
      expect(cx10.shortfall_min).toBe(5);

      expect(result.kpis.broken_connections).toBeGreaterThan(0);
      expect(result.kpis.affected_passengers).toBeGreaterThan(0);
    });
  });

  describe('4. Crew Duty Calculations', () => {
    it('tracks crew duty usage and triggers alerts when approaching or exceeding 600m limit', () => {
      // 180 min closure triggers direct duty violations
      const longClosureParams: SimulationParams = {
        closedAirport: 'BOM',
        closureStart: '07:30',
        closureDuration: 180,
        swaps: [],
        cancellations: [],
      };

      const result = runSimulation(longClosureParams);

      expect(result.kpis.crew_duty_violations).toBeGreaterThan(0);
      const violatedCrews = result.crews.filter((c) => c.status === 'VIOLATION');
      expect(violatedCrews.length).toBeGreaterThan(0);
      expect(violatedCrews[0].actual_duty_mins).toBeGreaterThan(600);
      expect(violatedCrews[0].overage_mins).toBeGreaterThan(0);
    });
  });

  describe('5. Recovery Option 1: Spare Aircraft Swap', () => {
    const bomParams: SimulationParams = {
      closedAirport: 'BOM',
      closureStart: '07:30',
      closureDuration: 90,
      swaps: [],
      cancellations: [],
    };

    it('validates spare aircraft base and capacity constraints', () => {
      // VT-DS18 is based at DEL, cannot swap onto a flight departing BOM
      const invalidSwap = validateAircraftSwap('DS0401', 'VT-DS18', bomParams);
      expect(invalidSwap.valid).toBe(false);
      expect(invalidSwap.reason).toContain('based at DEL');

      // DS1204 departs from DEL, matches VT-DS18 base!
      const validSwap = validateAircraftSwap('DS1204', 'VT-DS18', bomParams);
      expect(validSwap.valid).toBe(true);
    });

    it('successfully recovers delayed rotation when spare aircraft is swapped', () => {
      const swappedParams: SimulationParams = {
        ...bomParams,
        swaps: [
          {
            flight_id: 'DS1204',
            spare_tail_id: 'VT-DS18',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const baseResult = runSimulation(bomParams);
      const swappedResult = runSimulation(swappedParams);

      const baseDS1204 = baseResult.flights.find((f) => f.flight_id === 'DS1204')!;
      const swappedDS1204 = swappedResult.flights.find((f) => f.flight_id === 'DS1204')!;

      // In baseline, DS1204 had 30m delay waiting for delayed incoming DS1203
      expect(baseDS1204.dep_delay).toBe(30);

      // With spare VT-DS18 already parked at DEL, DS1204 departs on time!
      expect(swappedDS1204.dep_delay).toBe(0);
      expect(swappedDS1204.current_tail_id).toBe('VT-DS18');
      expect(swappedDS1204.status).toBe('RECOVERED');

      // Total network delay is reduced
      expect(swappedResult.kpis.total_departure_delay_min).toBeLessThan(
        baseResult.kpis.total_departure_delay_min
      );
    });
  });

  describe('6. Recovery Option 2: Flight Cancellation', () => {
    it('cancels flight, marks status as CANCELLED, and updates downstream metrics', () => {
      const cancelParams: SimulationParams = {
        closedAirport: 'BOM',
        closureStart: '07:30',
        closureDuration: 90,
        swaps: [],
        cancellations: ['DS0401', 'DS0402'],
      };

      const result = runSimulation(cancelParams);

      const ds0401 = result.flights.find((f) => f.flight_id === 'DS0401')!;
      expect(ds0401.status).toBe('CANCELLED');
      expect(ds0401.is_cancelled).toBe(true);
      expect(result.kpis.cancelled_flights).toBe(2);
    });
  });

  describe('7. Before & After Comparison Engine', () => {
    it('accurately calculates delta metrics between baseline disruption and recovery', () => {
      const baselineParams: SimulationParams = {
        closedAirport: 'BOM',
        closureStart: '07:30',
        closureDuration: 90,
        swaps: [],
        cancellations: [],
      };

      const recoveryParams: SimulationParams = {
        ...baselineParams,
        swaps: [
          {
            flight_id: 'DS1204',
            spare_tail_id: 'VT-DS18',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const before = runSimulation(baselineParams);
      const after = runSimulation(recoveryParams);
      const comparison = compareSimulations(before, after);

      expect(comparison.before).toEqual(before.kpis);
      expect(comparison.after).toEqual(after.kpis);
      expect(comparison.delta.total_delay_diff_min).toBeLessThan(0);
      expect(comparison.delta.is_improved).toBe(true);
    });
  });
});
