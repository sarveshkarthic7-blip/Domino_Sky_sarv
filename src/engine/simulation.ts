import rawDataset from '../data/flight_network.json';
import {
  FlightNetworkDataset,
  SimulationParams,
  SimulationResult,
  SimulatedFlight,
  SimulatedConnection,
  SimulatedCrew,
  SimulationKPIs,
  ComparisonResult,
  ComparisonDelta,
  AircraftSwapAction,
} from '../types';

export const dataset = rawDataset as unknown as FlightNetworkDataset;

export function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function toHHMM(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Validates if a spare aircraft can be swapped onto a specific flight.
 */
export function validateAircraftSwap(
  flightId: string,
  spareTailId: string,
  currentParams: SimulationParams
): { valid: boolean; reason?: string } {
  const flight = dataset.flights.find((f) => f.flight_id === flightId);
  if (!flight) return { valid: false, reason: 'Flight not found in dataset' };

  const spare = dataset.spare_aircraft.find((s) => s.tail_id === spareTailId);
  if (!spare) return { valid: false, reason: 'Spare aircraft not found' };

  // Base airport constraint
  if (flight.origin !== spare.base) {
    return {
      valid: false,
      reason: `Spare aircraft ${spare.tail_id} is based at ${spare.base}, but flight ${flightId} departs from ${flight.origin}.`,
    };
  }

  // Capacity constraint
  if (flight.pax > spare.seats) {
    return {
      valid: false,
      reason: `Flight has ${flight.pax} passengers, exceeding spare capacity of ${spare.seats} seats.`,
    };
  }

  // Availability time
  const spareAvailMin = toMinutes(spare.available_from);
  const flightDepMin = toMinutes(flight.dep);
  if (flightDepMin < spareAvailMin) {
    return {
      valid: false,
      reason: `Spare aircraft is only available from ${spare.available_from}.`,
    };
  }

  // Check if spare is already used on another flight at conflicting times
  const existingSwap = currentParams.swaps.find(
    (s) => s.spare_tail_id === spareTailId && s.flight_id !== flightId
  );
  if (existingSwap) {
    return {
      valid: false,
      reason: `Spare aircraft ${spareTailId} is already assigned to flight ${existingSwap.flight_id}.`,
    };
  }

  return { valid: true };
}

/**
 * Core Deterministic Simulation Engine
 */
export function runSimulation(params: SimulationParams): SimulationResult {
  const {
    closedAirport,
    closureStart,
    closureDuration,
    swaps = [],
    cancellations = [],
  } = params;

  const minTurnaround = dataset.meta.min_turnaround_minutes; // 30 minutes
  const cStartMin = closedAirport ? toMinutes(closureStart) : -1;
  const cEndMin = closedAirport ? cStartMin + closureDuration : -1;

  // Track map of swaps: original_tail -> new tail for legs from swapped flight onward
  const swapMap = new Map<string, AircraftSwapAction>();
  for (const s of swaps) {
    swapMap.set(s.flight_id, s);
  }

  // Group flights by original aircraft tail
  const flightsByTail = new Map<string, typeof dataset.flights>();
  for (const f of dataset.flights) {
    if (!flightsByTail.has(f.tail_id)) {
      flightsByTail.set(f.tail_id, []);
    }
    flightsByTail.get(f.tail_id)!.push(f);
  }

  const simulatedFlightsMap = new Map<string, SimulatedFlight>();

  // Process each aircraft rotation deterministically
  for (const [tailId, rawTailFlights] of flightsByTail.entries()) {
    const sortedTailFlights = [...rawTailFlights].sort((a, b) => a.leg_order - b.leg_order);

    let activeTail = tailId;
    let isSwappedRotation = false;
    let prevActualArrMin: number | null = null;

    for (const flight of sortedTailFlights) {
      const schedDepMin = toMinutes(flight.dep);
      const schedArrMin = toMinutes(flight.arr);
      const blockMin = flight.block_minutes;
      const isCancelled = cancellations.includes(flight.flight_id);

      // Check if swap occurs on this leg
      if (swapMap.has(flight.flight_id)) {
        const swap = swapMap.get(flight.flight_id)!;
        activeTail = swap.spare_tail_id;
        isSwappedRotation = true;
        // When spare aircraft takes over at its base, it breaks the inbound delay cascade
        prevActualArrMin = null;
      }

      if (isCancelled) {
        simulatedFlightsMap.set(flight.flight_id, {
          ...flight,
          actual_dep: flight.dep,
          actual_arr: flight.arr,
          actual_dep_min: schedDepMin,
          actual_arr_min: schedArrMin,
          dep_delay: 0,
          arr_delay: 0,
          status: 'CANCELLED',
          delay_reasons: ['Flight manually cancelled by Operations Controller'],
          is_cancelled: true,
          is_swapped: isSwappedRotation,
          original_tail_id: flight.tail_id,
          current_tail_id: activeTail,
        });
        continue;
      }

      const delayReasons: string[] = [];

      // 1. Determine Earliest Departure based on Turnaround
      let earliestDepMin = schedDepMin;
      if (prevActualArrMin !== null) {
        const earliestReadyMin = prevActualArrMin + minTurnaround;
        if (earliestReadyMin > earliestDepMin) {
          earliestDepMin = earliestReadyMin;
          delayReasons.push(
            `Inbound aircraft rotation delay (30m turnaround required after arrival at ${toHHMM(prevActualArrMin)})`
          );
        }
      }

      // 2. Airport Closure Impact on Outbound Departure
      if (closedAirport && flight.origin === closedAirport) {
        if (earliestDepMin >= cStartMin && earliestDepMin < cEndMin) {
          earliestDepMin = Math.max(earliestDepMin, cEndMin);
          delayReasons.push(
            `Ground hold at ${closedAirport}: Airport closed until ${toHHMM(cEndMin)}`
          );
        }
      }

      let actDepMin = earliestDepMin;
      let actArrMin = actDepMin + blockMin;

      // 3. Airport Closure Impact on Inbound Arrival (Ground Delay Program)
      if (closedAirport && flight.destination === closedAirport) {
        if (actArrMin >= cStartMin && actArrMin < cEndMin) {
          if (schedDepMin < cStartMin) {
            actArrMin = cEndMin;
            delayReasons.push(
              `Airborne holding: Runway closed at ${closedAirport} until ${toHHMM(cEndMin)}`
            );
          } else {
            actDepMin = Math.max(actDepMin, cEndMin - blockMin);
            actArrMin = actDepMin + blockMin;
            delayReasons.push(
              `ATFM Ground Stop: Delayed at origin for slot after ${closedAirport} reopening at ${toHHMM(cEndMin)}`
            );
          }
        }
      }

      const depDelay = Math.max(0, actDepMin - schedDepMin);
      const arrDelay = Math.max(0, actArrMin - schedArrMin);

      let status: 'ON_TIME' | 'DELAYED' | 'RECOVERED' = 'ON_TIME';
      if (depDelay > 0 || arrDelay > 0) {
        status = 'DELAYED';
      }

      if (isSwappedRotation && depDelay === 0) {
        status = 'RECOVERED';
      }

      simulatedFlightsMap.set(flight.flight_id, {
        ...flight,
        actual_dep: toHHMM(actDepMin),
        actual_arr: toHHMM(actArrMin),
        actual_dep_min: actDepMin,
        actual_arr_min: actArrMin,
        dep_delay: depDelay,
        arr_delay: arrDelay,
        status,
        delay_reasons: delayReasons,
        is_cancelled: false,
        is_swapped: isSwappedRotation,
        original_tail_id: flight.tail_id,
        current_tail_id: activeTail,
      });

      prevActualArrMin = actArrMin;
    }
  }

  // Compile Simulated Flights in original order
  const simulatedFlights = dataset.flights.map((f) => simulatedFlightsMap.get(f.flight_id)!);

  // Analyze Passenger Connections
  const simulatedConnections: SimulatedConnection[] = dataset.connections.map((cx) => {
    const fromFlight = simulatedFlightsMap.get(cx.from_flight)!;
    const toFlight = simulatedFlightsMap.get(cx.to_flight)!;

    const schedGap = toMinutes(toFlight.dep) - toMinutes(fromFlight.arr);
    let actualGap = toFlight.actual_dep_min - fromFlight.actual_arr_min;
    let status: 'SAFE' | 'BROKEN' = 'SAFE';
    let shortfall = 0;
    let reason = 'Connection safe: Sufficient transfer window';

    if (fromFlight.is_cancelled || toFlight.is_cancelled) {
      status = 'BROKEN';
      reason = fromFlight.is_cancelled
        ? `Inbound flight ${fromFlight.flight_id} was cancelled`
        : `Connecting flight ${toFlight.flight_id} was cancelled`;
      actualGap = 0;
      shortfall = cx.min_connect_minutes;
    } else if (actualGap < cx.min_connect_minutes) {
      status = 'BROKEN';
      shortfall = cx.min_connect_minutes - actualGap;
      reason = `Transfer time (${actualGap}m) below minimum required (${cx.min_connect_minutes}m) by ${shortfall}m due to flight delays`;
    }

    return {
      ...cx,
      scheduled_gap_min: schedGap,
      actual_gap_min: actualGap,
      status,
      shortfall_min: shortfall,
      reason,
    };
  });

  // Analyze Crew Duty
  const simulatedCrews: SimulatedCrew[] = dataset.crews.map((cr) => {
    const dutyStartMin = toMinutes(cr.duty_start);
    const lastFlightId = cr.flight_ids[cr.flight_ids.length - 1];
    const lastFlight = simulatedFlightsMap.get(lastFlightId)!;

    const schedDutyEndMin = toMinutes(lastFlight.arr);
    const schedDutyMins = schedDutyEndMin - dutyStartMin;

    let actualDutyEndMin = lastFlight.actual_arr_min;
    for (let i = cr.flight_ids.length - 1; i >= 0; i--) {
      const f = simulatedFlightsMap.get(cr.flight_ids[i])!;
      if (!f.is_cancelled) {
        actualDutyEndMin = f.actual_arr_min;
        break;
      }
    }

    const actualDutyMins = Math.max(0, actualDutyEndMin - dutyStartMin);
    const overageMins = Math.max(0, actualDutyMins - cr.max_duty_mins);
    const dutyUtilPct = Math.round((actualDutyMins / cr.max_duty_mins) * 100);

    let status: 'NORMAL' | 'WARNING' | 'VIOLATION' = 'NORMAL';
    if (actualDutyMins > cr.max_duty_mins) {
      status = 'VIOLATION';
    } else if (actualDutyMins >= cr.max_duty_mins - 45) {
      status = 'WARNING';
    }

    return {
      ...cr,
      scheduled_duty_mins: schedDutyMins,
      actual_duty_mins: actualDutyMins,
      actual_duty_end: toHHMM(actualDutyEndMin),
      status,
      overage_mins: overageMins,
      duty_utilization_pct: dutyUtilPct,
    };
  });

  // Calculate Key Performance Indicators (KPIs)
  const totalFlights = simulatedFlights.length;
  const delayedFlights = simulatedFlights.filter((f) => f.dep_delay > 0 && !f.is_cancelled).length;
  const cancelledFlights = simulatedFlights.filter((f) => f.is_cancelled).length;
  const recoveredFlights = simulatedFlights.filter((f) => f.status === 'RECOVERED').length;
  const onTimeFlights = totalFlights - delayedFlights - cancelledFlights;

  const totalDepDelay = simulatedFlights
    .filter((f) => !f.is_cancelled)
    .reduce((sum, f) => sum + f.dep_delay, 0);

  const totalArrDelay = simulatedFlights
    .filter((f) => !f.is_cancelled)
    .reduce((sum, f) => sum + f.arr_delay, 0);

  const avgDelay = delayedFlights > 0 ? Math.round(totalDepDelay / delayedFlights) : 0;

  const brokenConnections = simulatedConnections.filter((c) => c.status === 'BROKEN');
  const safeConnections = simulatedConnections.filter((c) => c.status === 'SAFE').length;

  const affectedPassengers = brokenConnections.reduce((sum, c) => sum + c.passengers, 0);

  const crewViolations = simulatedCrews.filter((c) => c.status === 'VIOLATION').length;
  const crewWarnings = simulatedCrews.filter((c) => c.status === 'WARNING').length;

  const kpis: SimulationKPIs = {
    total_flights: totalFlights,
    delayed_flights: delayedFlights,
    on_time_flights: onTimeFlights,
    cancelled_flights: cancelledFlights,
    recovered_flights: recoveredFlights,
    total_departure_delay_min: totalDepDelay,
    total_arrival_delay_min: totalArrDelay,
    average_delay_min: avgDelay,
    broken_connections: brokenConnections.length,
    safe_connections: safeConnections,
    affected_passengers: affectedPassengers,
    crew_duty_violations: crewViolations,
    crew_duty_warnings: crewWarnings,
  };

  return {
    params,
    kpis,
    flights: simulatedFlights,
    connections: simulatedConnections,
    crews: simulatedCrews,
    airports: dataset.airports,
    spare_aircraft: dataset.spare_aircraft,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compares two simulation results (e.g. baseline disrupted vs recovered)
 */
export function compareSimulations(
  before: SimulationResult,
  after: SimulationResult
): ComparisonResult {
  const delayedDiff = after.kpis.delayed_flights - before.kpis.delayed_flights;
  const delayDiff = after.kpis.total_departure_delay_min - before.kpis.total_departure_delay_min;
  const brokenDiff = after.kpis.broken_connections - before.kpis.broken_connections;
  const paxDiff = after.kpis.affected_passengers - before.kpis.affected_passengers;
  const crewDiff = after.kpis.crew_duty_violations - before.kpis.crew_duty_violations;

  const isImproved = delayDiff < 0 || brokenDiff < 0 || crewDiff < 0;

  const delta: ComparisonDelta = {
    delayed_flights_diff: delayedDiff,
    total_delay_diff_min: delayDiff,
    broken_connections_diff: brokenDiff,
    affected_passengers_diff: paxDiff,
    crew_violations_diff: crewDiff,
    is_improved: isImproved,
  };

  return {
    before: before.kpis,
    after: after.kpis,
    delta,
  };
}

/**
 * Generates an executive airline operations briefing from simulation data.
 * Pure deterministic operations reasoning engine.
 */
export function generateDeterministicBriefing(summary: any): string {
  const {
    kpis,
    params,
    topDelayedFlights = [],
    brokenConnections = [],
    crewAlerts = [],
    comparison = null,
  } = summary;

  let report = `### DOMINO SKY OPERATIONS CONTROL CENTRE (OCC) BRIEFING\n\n`;

  if (params.closedAirport) {
    report += `**Incident Alert:** Scheduled closure of **${params.closedAirport}** from **${params.closureStart}** for **${params.closureDuration} minutes**.\n\n`;
  } else {
    report += `**Incident Alert:** Baseline flight operations across normal flight schedule.\n\n`;
  }

  report += `#### 1. Disruption Impact Assessment\n`;
  report += `* **Delayed Flights:** ${kpis.delayed_flights} of ${kpis.total_flights} flights (${Math.round((kpis.delayed_flights / kpis.total_flights) * 100)}% of network).\n`;
  report += `* **Cumulative Departure Delay:** ${kpis.total_departure_delay_min} minutes (Average ${kpis.average_delay_min} min per delayed flight).\n`;
  report += `* **Cancelled Flights:** ${kpis.cancelled_flights} flights.\n`;
  report += `* **Broken Passenger Connections:** ${kpis.broken_connections} connection pairs, impacting **${kpis.affected_passengers} ticketed passengers**.\n`;
  report += `* **Crew Duty Status:** ${kpis.crew_duty_violations} crew violations, ${kpis.crew_duty_warnings} high-risk warnings (approaching 600-minute maximum duty limit).\n\n`;

  if (topDelayedFlights.length > 0) {
    report += `#### 2. Primary Cascade Propagation Chains\n`;
    report += `Delays propagated through aircraft rotations requiring the mandatory 30-minute minimum turnaround:\n`;
    topDelayedFlights.slice(0, 4).forEach((f: any) => {
      report += `* **Flight ${f.flight_id} (${f.tail_id}):** ${f.origin} → ${f.destination} delayed by **${f.dep_delay} min** (Dep: ${f.actual_dep}, Arr: ${f.actual_arr}). Reason: ${f.delay_reasons?.[0] || 'Turnaround propagation'}.\n`;
    });
    report += `\n`;
  }

  if (brokenConnections.length > 0) {
    report += `#### 3. Passenger Transfer Failures\n`;
    brokenConnections.slice(0, 3).forEach((c: any) => {
      report += `* **Connection ${c.connection_id} at ${c.airport}:** Flight ${c.from_flight} → ${c.to_flight} broke with a transfer shortfall of **${c.shortfall_min} min** (${c.passengers} passengers stranded).\n`;
    });
    report += `\n`;
  }

  if (crewAlerts.length > 0) {
    report += `#### 4. Flight Crew Duty Exceedances\n`;
    crewAlerts.forEach((cr: any) => {
      const type = cr.status === 'VIOLATION' ? 'CRITICAL VIOLATION' : 'HIGH RISK WARNING';
      report += `* **Crew ${cr.crew_id} (${cr.base} base, assigned to ${cr.tail_id}):** Actual duty reached **${cr.actual_duty_mins} min** against the ${cr.max_duty_mins} min legal limit (${cr.duty_utilization_pct}% duty capacity) — ${type}.\n`;
    });
    report += `\n`;
  }

  if (comparison && comparison.delta) {
    report += `#### 5. Recovery Strategy Evaluation\n`;
    if (comparison.delta.is_improved) {
      report += `* **Result:** Recovery actions demonstrated **positive network stabilization**.\n`;
      report += `* **Delay Reduction:** Saved **${Math.abs(comparison.delta.total_delay_diff_min)} minutes** of total network delay.\n`;
      if (comparison.delta.broken_connections_diff < 0) {
        report += `* **Connections Restored:** Protected **${Math.abs(comparison.delta.broken_connections_diff)} passenger connections** (${Math.abs(comparison.delta.affected_passengers_diff)} passengers).\n`;
      }
      if (comparison.delta.crew_violations_diff < 0) {
        report += `* **Crew Violations Averted:** Resolved **${Math.abs(comparison.delta.crew_violations_diff)} crew duty violations**.\n`;
      }
    } else {
      report += `* **Result:** Applied recovery strategy did not achieve net positive delay reduction. Review alternate spare aircraft positioning or selective cancellation.\n`;
    }
    report += `\n`;
  }

  report += `#### 6. OCC Recommended Action Plan\n`;
  report += `1. **Spare Aircraft Deployment:** Activate spare aircraft VT-DS18 at DEL and VT-DS17 at BLR for downstream legs whose inbound aircraft have exceeded 30-minute buffers.\n`;
  report += `2. **Passenger Re-accommodation:** Immediately rebook the ${kpis.affected_passengers} passengers from broken transfers onto alternative direct legs.\n`;
  report += `3. **Crew Reserve Callout:** Place standby reserve crews on alert at base hubs to relieve rotations exceeding 540 duty minutes.\n`;

  return report;
}
