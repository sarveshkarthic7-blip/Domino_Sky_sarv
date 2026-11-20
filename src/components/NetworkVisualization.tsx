import React, { useState, useMemo } from 'react';
import { Airport, SimulatedFlight } from '../types';
import { Info, Plane, AlertTriangle, CheckCircle2, Ban, Sparkles, Filter } from 'lucide-react';

interface NetworkVisualizationProps {
  airports: Airport[];
  flights: SimulatedFlight[];
  selectedAirport: string | null;
  onSelectAirport: (airportId: string | null) => void;
  onSelectFlight?: (flightId: string) => void;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  airports,
  flights,
  selectedAirport,
  onSelectAirport,
  onSelectFlight,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<{ origin: string; destination: string } | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'DELAYED_ONLY' | 'RECOVERED_ONLY'>('ALL');

  // Geographic projection: Map lat/lng (India) to SVG coordinate space
  // Lng range: ~71 (West) to ~93 (East)
  // Lat range: ~7.5 (South) to ~32 (North)
  const svgWidth = 800;
  const svgHeight = 650;
  const padding = 50;

  const minLng = 71.0;
  const maxLng = 93.0;
  const minLat = 7.5;
  const maxLat = 32.0;

  const project = (lat: number, lng: number) => {
    const x = padding + ((lng - minLng) / (maxLng - minLng)) * (svgWidth - 2 * padding);
    // Invert Y because latitude increases northward, but SVG Y increases downward
    const y = svgHeight - padding - ((lat - minLat) / (maxLat - minLat)) * (svgHeight - 2 * padding);
    return { x, y };
  };

  const airportCoords = useMemo(() => {
    const map = new Map<string, { x: number; y: number; airport: Airport }>();
    for (const a of airports) {
      map.set(a.id, { ...project(a.lat, a.lng), airport: a });
    }
    return map;
  }, [airports]);

  // Aggregate routes: group flights by origin -> destination pair
  const routes = useMemo(() => {
    const routeMap = new Map<string, { origin: string; destination: string; flights: SimulatedFlight[] }>();
    for (const f of flights) {
      const key = `${f.origin}->${f.destination}`;
      if (!routeMap.has(key)) {
        routeMap.set(key, { origin: f.origin, destination: f.destination, flights: [] });
      }
      routeMap.get(key)!.flights.push(f);
    }
    return Array.from(routeMap.values());
  }, [flights]);

  // Flights on the selected route or airport
  const activeFlights = useMemo(() => {
    if (selectedRoute) {
      return flights.filter(
        (f) => f.origin === selectedRoute.origin && f.destination === selectedRoute.destination
      );
    }
    if (selectedAirport) {
      return flights.filter((f) => f.origin === selectedAirport || f.destination === selectedAirport);
    }
    return [];
  }, [selectedRoute, selectedAirport, flights]);

  // Helper to compute curved bezier path between two airports
  const getCurvePath = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Perpendicular offset for arc curvature
    const curvature = Math.min(dist * 0.15, 35);
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    // Normal vector
    const nx = -dy / dist;
    const ny = dx / dist;
    const cx = midX + nx * curvature;
    const cy = midY + ny * curvature;
    return `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
  };

  return (
    <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md relative overflow-hidden flex flex-col lg:flex-row gap-5">
      {/* Network Map Visual Area */}
      <div className="flex-1 relative flex flex-col">
        <div className="flex items-center justify-between mb-3 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase font-mono">
              Live Route Network & Cascade Radar
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center bg-[#070e1e] border border-cyan-800/60 rounded-lg p-0.5 text-[11px] font-mono">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'ALL' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All (70)
              </button>
              <button
                onClick={() => setFilterMode('DELAYED_ONLY')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'DELAYED_ONLY'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Delayed
              </button>
              <button
                onClick={() => setFilterMode('RECOVERED_ONLY')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterMode === 'RECOVERED_ONLY'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Recovered
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 mb-2 z-10 bg-[#081024]/80 px-3 py-1.5 rounded-lg border border-cyan-900/30">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50"></span>
            Normal Route
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse shadow-sm shadow-amber-400/50"></span>
            Delayed Corridor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
            Cancelled Leg
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            Recovered Swap
          </span>
          <span className="text-slate-500 text-[11px] ml-auto">
            Click any airport or route for telemetry
          </span>
        </div>

        {/* SVG Visualization Canvas */}
        <div className="relative w-full aspect-[8/6.5] max-h-[580px] bg-[#050b18] border border-cyan-950 rounded-xl overflow-hidden radar-grid flex items-center justify-center">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full select-none"
            style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.1))' }}
          >
            <defs>
              {/* Radial gradient for glowing airport nodes */}
              <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="closedGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Flight Routes */}
            {routes.map((route) => {
              const p1 = airportCoords.get(route.origin);
              const p2 = airportCoords.get(route.destination);
              if (!p1 || !p2) return null;

              const isDelayed = route.flights.some((f) => f.dep_delay > 0);
              const isCancelled = route.flights.some((f) => f.is_cancelled);
              const isRecovered = route.flights.some((f) => f.status === 'RECOVERED');

              if (filterMode === 'DELAYED_ONLY' && !isDelayed) return null;
              if (filterMode === 'RECOVERED_ONLY' && !isRecovered) return null;

              const isSelected =
                selectedRoute?.origin === route.origin && selectedRoute?.destination === route.destination;

              let strokeColor = '#0891b2'; // cyan-600
              let strokeWidth = isSelected ? 3 : 1.5;
              let strokeDasharray = 'none';
              let opacity = 0.45;

              if (isCancelled) {
                strokeColor = '#ef4444';
                strokeDasharray = '4 3';
                opacity = 0.8;
              } else if (isDelayed) {
                strokeColor = '#f59e0b'; // amber-500
                strokeWidth = isSelected ? 3.5 : 2;
                opacity = 0.85;
              } else if (isRecovered) {
                strokeColor = '#10b981'; // emerald-500
                strokeWidth = isSelected ? 3.5 : 2;
                opacity = 0.85;
              }

              if (isSelected) opacity = 1;

              const pathData = getCurvePath(p1, p2);

              return (
                <g
                  key={`${route.origin}-${route.destination}`}
                  className="cursor-pointer group"
                  onClick={() => {
                    setSelectedRoute({ origin: route.origin, destination: route.destination });
                  }}
                >
                  {/* Invisible thicker stroke for easy hover */}
                  <path d={pathData} fill="none" stroke="transparent" strokeWidth="14" />
                  {/* Visual flight corridor arc */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    opacity={opacity}
                    className="transition-all duration-300 group-hover:opacity-100 group-hover:stroke-cyan-300"
                  />
                </g>
              );
            })}

            {/* Airport Nodes */}
            {airports.map((airport) => {
              const pos = airportCoords.get(airport.id);
              if (!pos) return null;

              const isClosed = selectedAirport === airport.id;
              const isHub = airport.tier === 'mega_hub';
              const radius = isHub ? 8 : airport.tier === 'regional_hub' ? 6 : 4.5;

              return (
                <g
                  key={airport.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer select-none"
                  onClick={() => {
                    if (selectedAirport === airport.id) {
                      onSelectAirport(null);
                    } else {
                      onSelectAirport(airport.id);
                    }
                    setSelectedRoute(null);
                  }}
                >
                  {/* Glow circle for closed or hub airport */}
                  {isClosed ? (
                    <circle r="22" fill="url(#closedGlow)" className="animate-pulse" />
                  ) : isHub ? (
                    <circle r="16" fill="url(#hubGlow)" opacity="0.3" />
                  ) : null}

                  {/* Airport Node Circle */}
                  <circle
                    r={radius}
                    fill={isClosed ? '#ef4444' : isHub ? '#06b6d4' : '#64748b'}
                    stroke={isClosed ? '#fecaca' : isHub ? '#e0f2fe' : '#94a3b8'}
                    strokeWidth={isClosed ? 2.5 : 1.5}
                    className="transition-all duration-200 hover:scale-125"
                  />

                  {/* Airport IATA Code Label */}
                  <text
                    x={radius + 4}
                    y={3}
                    fill={isClosed ? '#f87171' : isHub ? '#38bdf8' : '#cbd5e1'}
                    fontSize={isHub ? '11' : '9.5'}
                    fontFamily="monospace"
                    fontWeight={isHub || isClosed ? 'bold' : 'normal'}
                    className="pointer-events-none drop-shadow-md"
                  >
                    {airport.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Flight Telemetry Drawer / Sidebar */}
      <div className="w-full lg:w-80 bg-[#070e20] border border-cyan-900/40 rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-cyan-900/40">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Route Telemetry
            </h4>
            {selectedRoute && (
              <button
                onClick={() => setSelectedRoute(null)}
                className="text-[10px] text-cyan-400 hover:underline font-mono"
              >
                Clear Route
              </button>
            )}
          </div>

          {selectedRoute ? (
            <div className="space-y-3">
              <div className="bg-[#0b162f] p-3 rounded-lg border border-cyan-800/40">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Corridor</span>
                <div className="text-base font-mono font-bold text-cyan-300 flex items-center gap-2 mt-0.5">
                  <span>{selectedRoute.origin}</span>
                  <span className="text-slate-500">→</span>
                  <span>{selectedRoute.destination}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Active flights: <strong className="text-white">{activeFlights.length}</strong>
                </p>
              </div>

              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                {activeFlights.map((f) => (
                  <div
                    key={f.flight_id}
                    onClick={() => onSelectFlight && onSelectFlight(f.flight_id)}
                    className="p-2.5 rounded-lg bg-[#081226] border border-cyan-900/30 hover:border-cyan-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                        <Plane className="w-3 h-3 text-cyan-400" />
                        {f.flight_id}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                          f.is_cancelled
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : f.dep_delay > 0
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : f.status === 'RECOVERED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {f.is_cancelled
                          ? 'CANCELLED'
                          : f.dep_delay > 0
                          ? `+${f.dep_delay}m DELAY`
                          : f.status === 'RECOVERED'
                          ? 'RECOVERED'
                          : 'ON TIME'}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-300 grid grid-cols-2 gap-1 mb-1">
                      <div>Sched: {f.dep} → {f.arr}</div>
                      <div>Actual: {f.actual_dep} → {f.actual_arr}</div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Tail: <strong className="text-cyan-300 font-mono">{f.current_tail_id}</strong></span>
                      <span>Pax: <strong className="text-slate-200">{f.pax}</strong></span>
                    </div>

                    {f.delay_reasons.length > 0 && (
                      <p className="text-[10px] text-amber-400/90 mt-1 italic leading-tight">
                        • {f.delay_reasons[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : selectedAirport ? (
            <div className="space-y-3">
              <div className="bg-[#0b162f] p-3 rounded-lg border border-red-900/40">
                <span className="text-[10px] text-red-400 uppercase tracking-widest font-mono">Station Alert</span>
                <div className="text-base font-mono font-bold text-white flex items-center gap-2 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>{selectedAirport} Operations</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Total arriving & departing legs: <strong className="text-cyan-300">{activeFlights.length}</strong>
                </p>
              </div>

              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                {activeFlights.map((f) => (
                  <div
                    key={f.flight_id}
                    className="p-2 rounded bg-[#081226] border border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-white">{f.flight_id}</span>
                      <span className="text-cyan-300">{f.origin} → {f.destination}</span>
                      <span className={f.dep_delay > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                        {f.dep_delay > 0 ? `+${f.dep_delay}m` : 'On-Time'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Plane className="w-8 h-8 text-cyan-600/40 mx-auto -rotate-45" />
              <p className="text-xs">Select any route arc or airport node on the radar network to inspect real-time cascade state.</p>
            </div>
          )}
        </div>

        {/* Airport Network Summary Footer */}
        <div className="pt-3 border-t border-cyan-900/40 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Active Hubs: 16</span>
          <span>Corridors: {routes.length}</span>
        </div>
      </div>
    </div>
  );
};
