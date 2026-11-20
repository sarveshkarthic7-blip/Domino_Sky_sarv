import React from 'react';
import { Play, RotateCcw, AlertTriangle, Building2, Clock, Hourglass } from 'lucide-react';
import { Airport } from '../types';

interface SimulationControlsProps {
  airports: Airport[];
  selectedAirport: string;
  closureStartTime: string;
  closureDuration: number;
  onSelectAirport: (id: string) => void;
  onChangeStartTime: (time: string) => void;
  onChangeDuration: (mins: number) => void;
  onRunSimulation: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  airports,
  selectedAirport,
  closureStartTime,
  closureDuration,
  onSelectAirport,
  onChangeStartTime,
  onChangeDuration,
  onRunSimulation,
  onReset,
  isRunning,
}) => {
  const currentAirportObj = airports.find((a) => a.id === selectedAirport);

  // Quick preset durations
  const presetDurations = [30, 60, 90, 120, 180, 240];

  return (
    <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-900/40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            Disruption Scenario Injector
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          DOMINO CASCADE ENGINE v1.0
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* 1. Airport Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            Target Airport Closure
          </label>
          <select
            value={selectedAirport}
            onChange={(e) => onSelectAirport(e.target.value)}
            className="w-full bg-[#080f21] border border-cyan-800/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono cursor-pointer"
          >
            <optgroup label="Mega Hubs (30+ flights/hr)">
              {airports
                .filter((a) => a.tier === 'mega_hub')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} - {a.city} ({a.name})
                  </option>
                ))}
            </optgroup>
            <optgroup label="Regional Hubs">
              {airports
                .filter((a) => a.tier === 'regional_hub')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} - {a.city} ({a.name})
                  </option>
                ))}
            </optgroup>
            <optgroup label="Spoke Stations">
              {airports
                .filter((a) => a.tier === 'spoke')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} - {a.city} ({a.name})
                  </option>
                ))}
            </optgroup>
          </select>
          {currentAirportObj && (
            <p className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Tier: <strong className="text-cyan-300">{currentAirportObj.tier.replace('_', ' ')}</strong></span>
              <span>Cap: <strong className="text-slate-200">{currentAirportObj.capacity_per_hour} fl/hr</strong></span>
            </p>
          )}
        </div>

        {/* 2. Closure Start Time */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Closure Start Time (IST)
          </label>
          <input
            type="time"
            value={closureStartTime}
            onChange={(e) => onChangeStartTime(e.target.value)}
            className="w-full bg-[#080f21] border border-cyan-800/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono"
          />
          <div className="flex items-center gap-1.5 mt-1.5">
            {['06:00', '07:30', '08:30', '12:00'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeStartTime(preset)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors font-mono ${
                  closureStartTime === preset
                    ? 'bg-cyan-900/60 text-cyan-300 border-cyan-500'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Closure Duration */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Hourglass className="w-3.5 h-3.5 text-cyan-400" />
            Closure Duration ({closureDuration} mins)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="15"
              max="360"
              step="15"
              value={closureDuration}
              onChange={(e) => onChangeDuration(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-cyan-300 w-12 text-right">
              {closureDuration}m
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {presetDurations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChangeDuration(d)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors font-mono ${
                  closureDuration === d
                    ? 'bg-cyan-900/60 text-cyan-300 border-cyan-500'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRunSimulation}
            disabled={isRunning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-950/60 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Run Simulation</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-sm border border-slate-700 transition-colors"
            title="Reset to Scheduled Baseline"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
