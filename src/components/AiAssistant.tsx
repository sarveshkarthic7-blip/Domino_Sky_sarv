import React, { useState, useEffect } from 'react';
import {
  SimulationResult,
  ComparisonResult,
} from '../types';
import { generateDeterministicBriefing } from '../engine/simulation';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  RefreshCw,
  HelpCircle,
  ShieldAlert,
  GitBranch,
  FileText,
} from 'lucide-react';

interface AiAssistantProps {
  simulationResult: SimulationResult;
  comparisonResult: ComparisonResult | null;
  hasGeminiKey: boolean;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  simulationResult,
  comparisonResult,
  hasGeminiKey,
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [source, setSource] = useState<'gemini' | 'deterministic_fallback'>('deterministic_fallback');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper to compile the structured summary payload
  const buildSummaryPayload = (topic?: string) => {
    return {
      params: simulationResult.params,
      kpis: simulationResult.kpis,
      topDelayedFlights: simulationResult.flights
        .filter((f) => f.dep_delay > 0)
        .sort((a, b) => b.dep_delay - a.dep_delay)
        .slice(0, 6)
        .map((f) => ({
          flight_id: f.flight_id,
          tail_id: f.current_tail_id,
          origin: f.origin,
          destination: f.destination,
          actual_dep: f.actual_dep,
          actual_arr: f.actual_arr,
          dep_delay: f.dep_delay,
          delay_reasons: f.delay_reasons,
        })),
      brokenConnections: simulationResult.connections
        .filter((c) => c.status === 'BROKEN')
        .map((c) => ({
          connection_id: c.connection_id,
          airport: c.airport,
          from_flight: c.from_flight,
          to_flight: c.to_flight,
          passengers: c.passengers,
          shortfall_min: c.shortfall_min,
        })),
      crewAlerts: simulationResult.crews
        .filter((c) => c.status === 'VIOLATION' || c.status === 'WARNING')
        .map((c) => ({
          crew_id: c.crew_id,
          tail_id: c.tail_id,
          base: c.base,
          status: c.status,
          actual_duty_mins: c.actual_duty_mins,
          max_duty_mins: c.max_duty_mins,
          duty_utilization_pct: c.duty_utilization_pct,
        })),
      comparison: comparisonResult,
      promptTopic: topic || 'general_executive_briefing',
    };
  };

  // Function to fetch AI explanation from backend with instant deterministic fallback
  const fetchExplanation = async (customPromptTopic?: string) => {
    setIsLoading(true);
    const summaryPayload = buildSummaryPayload(customPromptTopic);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryPayload),
      });

      if (response.ok) {
        const data = await response.json();
        setExplanation(data.explanation);
        setSource(data.source === 'gemini' ? 'gemini' : 'deterministic_fallback');
      } else {
        // Fallback directly to deterministic operations briefing
        const fallback = generateDeterministicBriefing(summaryPayload);
        setExplanation(fallback);
        setSource('deterministic_fallback');
      }
    } catch (err) {
      // In case server is offline or proxy blocked, run deterministic reasoning directly
      const fallback = generateDeterministicBriefing(summaryPayload);
      setExplanation(fallback);
      setSource('deterministic_fallback');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial briefing when simulation changes
  useEffect(() => {
    fetchExplanation();
  }, [
    simulationResult.params.closedAirport,
    simulationResult.params.closureDuration,
    simulationResult.params.swaps.length,
    simulationResult.params.cancellations.length,
  ]);

  return (
    <div className="bg-[#0b152d]/90 border border-cyan-900/40 rounded-xl p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-cyan-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-purple-950 border border-purple-700/60 text-purple-400">
              <Bot className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-mono flex items-center gap-2">
              Airline Operations AI Assistant
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  source === 'gemini'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-700'
                    : 'bg-cyan-950/80 text-cyan-300 border border-cyan-700'
                }`}
              >
                {source === 'gemini' ? 'Gemini 2.5 Flash API' : 'OCC Deterministic Engine AI'}
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational intelligence assistant interpreting deterministic calculations in plain aviation language
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchExplanation()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700 text-xs font-mono transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Refresh Briefing</span>
          </button>
        </div>
      </div>

      {/* Quick Prompt Questions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Quick Inquiries:
        </span>
        <button
          onClick={() => fetchExplanation('root_cause_cascade')}
          disabled={isLoading}
          className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#081226] hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-cyan-900/50 transition-colors"
        >
          Why are flights delayed?
        </button>
        <button
          onClick={() => fetchExplanation('passenger_connections')}
          disabled={isLoading}
          className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#081226] hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-cyan-900/50 transition-colors"
        >
          Explain Broken Connections
        </button>
        <button
          onClick={() => fetchExplanation('crew_duty_risks')}
          disabled={isLoading}
          className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#081226] hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-cyan-900/50 transition-colors"
        >
          Crew Duty Risk Analysis
        </button>
        <button
          onClick={() => fetchExplanation('recommend_mitigation')}
          disabled={isLoading}
          className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#081226] hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-cyan-900/50 transition-colors"
        >
          Recommend Recovery Strategy
        </button>
      </div>

      {/* AI Explanation Content Box */}
      <div className="bg-[#060c1c] border border-cyan-950 rounded-xl p-4 min-h-[160px] text-xs font-mono leading-relaxed text-slate-200">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-cyan-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs text-slate-400">Synthesizing network cascade telemetry with AI...</p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-xs space-y-2 whitespace-pre-line">
            {explanation}
          </div>
        )}
      </div>

      {/* AI Guardrail Footer */}
      <div className="mt-3 pt-3 border-t border-cyan-900/30 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Deterministic Rule: AI strictly interprets engine metrics. Never computes or hallucinates delays.</span>
        <span>Secure Server Proxy Integration</span>
      </div>
    </div>
  );
};
