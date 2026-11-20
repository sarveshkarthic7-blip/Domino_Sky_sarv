import React, { useState } from 'react';
import {
  SimulatedFlight,
  SpareAircraft,
  SimulationParams,
  AircraftSwapAction,
} from '../types';
import { validateAircraftSwap } from '../engine/simulation';
import {
  RefreshCw,
  Ban,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Building2,
  Sparkles,
} from 'lucide-react';

interface RecoveryPanelProps {
  flights: SimulatedFlight[];
  spareAircraft: SpareAircraft[];
  currentParams: SimulationParams;
  onApplySwap: (flightId: string, spareTailId: string) => void;
  onApplyCancellation: (flightId: string) => void;
  onUndoSwap: (flightId: string) => void;
  onUndoCancellation: (flightId: string) => void;
  onResetAllRecoveries: () => void;
}

export const RecoveryPanel: React.FC<RecoveryPanelProps> = ({
  flights,
  spareAircraft,
  currentParams,
  onApplySwap,
  onApplyCancellation,
  onUndoSwap,
  onUndoCancellation,
  onResetAllRecoveries,
}) => {
  const [activeTab, setActiveTab] = useState<'SWAP' | 'CANCEL'>('SWAP');

  // Swap State
  const [swapFlightId, setSwapFlightId] = useState<string>('');
  const [swapSpareTail, setSwapSpareTail] = useState<string>(
    spareAircraft[0]?.tail_id || ''
  );

  // Cancellation State
  const [cancelFlightId, setCancelFlightId] = useState<string>('');

  // Find candidate flights for swap (flights with delay > 0 or departing DEL/BLR)
  const candidateSwapFlights = flights.filter((f) => !f.is_cancelled);
  const selectedSwapFlight = flights.find((f) => f.flight_id === swapFlightId);

  // Validation
  const swapValidation = swapFlightId && swapSpareTail
    ? validateAircraftSwap(swapFlightId, swapSpareTail, currentParams)
    : { valid: false, reason: 'Select a flight and a spare aircraft' };

  // Candidate flights for cancellation
  const candidateCancelFlights = flights.filter(
    (f) => !currentParams.cancellations.includes(f.flight_id)
  );
  const selectedCancelFlight = flights.find(
    (f) => f.flight_id === cancelFlightId
  );

  const hasRecoveries =
    currentParams.swaps.length > 0 || currentParams.cancellations.length > 0;

  const handleApplySwap = () => {
    if (swapFlightId && swapSpareTail && swapValidation.valid) {
      onApplySwap(swapFlightId, swapSpareTail);
      setSwapFlightId('');
    }
  };

  const handleApplyCancel = () => {
    if (cancelFlightId) {
      onApplyCancellation(cancelFlightId);
      setCancelFlightId('');
    }
  };

  return (
    <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-cyan-900/40">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Operations Recovery Center
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate and deploy tactical mitigation strategies (Aircraft Swapping & Strategic Cancellation)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070e1e] border border-cyan-800/60 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveTab('SWAP')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'SWAP'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              Option 1: Spare Aircraft Swap
            </button>
            <button
              onClick={() => setActiveTab('CANCEL')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'CANCEL'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ban className="w-3 h-3" />
              Option 2: Flight Cancellation
            </button>
          </div>

          {hasRecoveries && (
            <button
              onClick={onResetAllRecoveries}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-slate-700 transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              Reset Recoveries
            </button>
          )}
        </div>
      </div>

      {/* Main Action Form */}
      {activeTab === 'SWAP' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Flight Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-cyan-400" />
                Select Affected Flight Leg
              </label>
              <select
                value={swapFlightId}
                onChange={(e) => setSwapFlightId(e.target.value)}
                className="w-full bg-[#080f21] border border-cyan-800/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
              >
                <option value="">-- Choose Flight to Recover --</option>
                <optgroup label="Delayed Flights (Recommended)">
                  {candidateSwapFlights
                    .filter((f) => f.dep_delay > 0)
                    .map((f) => (
                      <option key={f.flight_id} value={f.flight_id}>
                        {f.flight_id} ({f.origin}→{f.destination}) • {f.dep} • Delay: +{f.dep_delay}m
                      </option>
                    ))}
                </optgroup>
                <optgroup label="All Operational Flights">
                  {candidateSwapFlights.map((f) => (
                    <option key={f.flight_id} value={f.flight_id}>
                      {f.flight_id} ({f.origin}→{f.destination}) • {f.dep} • {f.current_tail_id}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Spare Aircraft Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Select Eligible Spare Aircraft
              </label>
              <select
                value={swapSpareTail}
                onChange={(e) => setSwapSpareTail(e.target.value)}
                className="w-full bg-[#080f21] border border-cyan-800/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
              >
                {spareAircraft.map((s) => (
                  <option key={s.tail_id} value={s.tail_id}>
                    {s.tail_id} • Base: {s.base} • Cap: {s.seats} seats • From: {s.available_from}
                  </option>
                ))}
              </select>
            </div>

            {/* Execute Button */}
            <div>
              <button
                onClick={handleApplySwap}
                disabled={!swapValidation.valid}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs tracking-wider uppercase font-mono shadow-md shadow-cyan-950/50 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Apply Aircraft Swap</span>
              </button>
            </div>
          </div>

          {/* Validation Feedback */}
          {swapFlightId && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
                swapValidation.valid
                  ? 'bg-emerald-950/30 border-emerald-700/60 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-700/60 text-amber-300'
              }`}
            >
              {swapValidation.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {swapValidation.valid
                    ? 'Eligible Aircraft Swap Confirmed'
                    : 'Aviation Constraint Conflict'}
                </p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  {swapValidation.valid
                    ? `Flight ${selectedSwapFlight?.flight_id} departs from ${selectedSwapFlight?.origin}, which matches spare ${swapSpareTail}'s base station. Swapping detaches downstream legs from delayed inbound rotation.`
                    : swapValidation.reason}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            {/* Flight Selector for Cancellation */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                Select Flight Leg to Cancel
              </label>
              <select
                value={cancelFlightId}
                onChange={(e) => setCancelFlightId(e.target.value)}
                className="w-full bg-[#080f21] border border-cyan-800/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
              >
                <option value="">-- Choose Flight to Cancel --</option>
                {candidateCancelFlights.map((f) => (
                  <option key={f.flight_id} value={f.flight_id}>
                    {f.flight_id} ({f.origin}→{f.destination}) • Dep: {f.dep} • Delay: +{f.dep_delay}m • Pax: {f.pax}
                  </option>
                ))}
              </select>
            </div>

            {/* Execute Cancel Button */}
            <div>
              <button
                onClick={handleApplyCancel}
                disabled={!cancelFlightId}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs tracking-wider uppercase font-mono shadow-md shadow-rose-950/50 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Ban className="w-4 h-4" />
                <span>Confirm Tactical Cancellation</span>
              </button>
            </div>
          </div>

          {selectedCancelFlight && (
            <div className="p-3 rounded-lg border bg-rose-950/20 border-rose-700/60 text-xs text-rose-300 font-mono">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Operational Impact Preview:
              </p>
              <ul className="list-disc list-inside text-[11px] mt-1 space-y-0.5 text-rose-200/90">
                <li>Flight {selectedCancelFlight.flight_id} will be nullified (0 departure delay counted).</li>
                <li>{selectedCancelFlight.pax} ticketed passengers require re-accommodation.</li>
                <li>Aircraft remains at {selectedCancelFlight.origin}, shielding remaining hub rotations from delay cascade.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Active Recovery Actions List */}
      {hasRecoveries && (
        <div className="mt-4 pt-4 border-t border-cyan-900/40">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Active Recovery Adjustments ({currentParams.swaps.length + currentParams.cancellations.length})
          </h4>

          <div className="flex flex-wrap gap-2">
            {currentParams.swaps.map((s) => (
              <div
                key={s.flight_id}
                className="flex items-center gap-2 bg-[#07132a] border border-cyan-700/60 px-3 py-1 rounded-lg text-xs font-mono text-cyan-300"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>
                  Swap: <strong>{s.flight_id}</strong> → <strong>{s.spare_tail_id}</strong>
                </span>
                <button
                  onClick={() => onUndoSwap(s.flight_id)}
                  className="hover:text-red-400 text-slate-400 transition-colors ml-1 p-0.5"
                  title="Undo Swap"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {currentParams.cancellations.map((fid) => (
              <div
                key={fid}
                className="flex items-center gap-2 bg-rose-950/50 border border-rose-700/60 px-3 py-1 rounded-lg text-xs font-mono text-rose-300"
              >
                <Ban className="w-3 h-3 text-rose-400" />
                <span>
                  Cancel: <strong>{fid}</strong>
                </span>
                <button
                  onClick={() => onUndoCancellation(fid)}
                  className="hover:text-white text-rose-400 transition-colors ml-1 p-0.5"
                  title="Undo Cancellation"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
