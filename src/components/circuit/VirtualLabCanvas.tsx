import React, { useState, useEffect } from 'react';
import { CircuitConfig, CircuitCalculationResult } from '../../types';
import {
  Zap,
  Sliders,
  RotateCcw,
  Gauge,
  Lightbulb,
  Radio,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

interface VirtualLabCanvasProps {
  config: CircuitConfig;
  calculation: CircuitCalculationResult;
  onConfigChange: (updated: CircuitConfig) => void;
  onReset: () => void;
  isObservationLocked?: boolean;
}

export const VirtualLabCanvas: React.FC<VirtualLabCanvasProps> = ({
  config,
  calculation,
  onConfigChange,
  onReset,
  isObservationLocked = false,
}) => {
  const [selectedVoltmeterTarget, setSelectedVoltmeterTarget] = useState<'total' | 'r1' | 'r2' | 'r3'>('total');

  const updateVoltage = (v: number) => {
    onConfigChange({
      ...config,
      voltage: v,
    });
  };

  const updateResistor = (index: number, newR: number) => {
    const updated = [...config.resistors];
    if (updated[index]) {
      updated[index] = { ...updated[index], resistance: newR };
      onConfigChange({
        ...config,
        resistors: updated,
      });
    }
  };

  const toggleSwitch = (switchId: string) => {
    const updated = config.switches.map((s) => {
      if (s.id === switchId) {
        return { ...s, isOpen: !s.isOpen };
      }
      return s;
    });
    onConfigChange({
      ...config,
      switches: updated,
    });
  };

  // Determine current for animated electron flow
  const currentSpeed = calculation.isCircuitClosed && calculation.totalCurrent > 0
    ? Math.max(0.6, Math.min(3, 4 / (calculation.totalCurrent + 0.5)))
    : 0;

  // Selected voltmeter reading
  let voltmeterReading = calculation.voltage;
  if (selectedVoltmeterTarget === 'r1' && calculation.branchResults[0]) {
    voltmeterReading = calculation.branchResults[0].voltageDrop;
  } else if (selectedVoltmeterTarget === 'r2' && calculation.branchResults[1]) {
    voltmeterReading = calculation.branchResults[1].voltageDrop;
  } else if (selectedVoltmeterTarget === 'r3' && calculation.branchResults[2]) {
    voltmeterReading = calculation.branchResults[2].voltageDrop;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Workbench Toolbar */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{config.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {config.type.toUpperCase()} CIRCUIT
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive Schematic & Live Physics Simulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Reset circuit to default values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Setup</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col items-center justify-center min-h-[420px] select-none overflow-hidden">
        {/* Circuit Schematic SVG */}
        <div className="w-full max-w-3xl aspect-[16/9] relative">
          <svg
            viewBox="0 0 800 450"
            className="w-full h-full drop-shadow-2xl"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Wire Gradient */}
              <linearGradient id="wireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>

              {/* Glow Filter for Active Circuit & Bulbs */}
              <filter id="bulbGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Circuit Background Grid */}
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.5" />
            </pattern>
            <rect width="800" height="450" fill="url(#smallGrid)" rx="16" />

            {/* -------------------- WIRES -------------------- */}
            {config.type === 'single' && (
              <path
                d="M 160 225 L 160 100 L 640 100 L 640 350 L 160 350 L 160 225"
                fill="none"
                stroke="#334155"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {config.type === 'series' && (
              <path
                d="M 140 225 L 140 100 L 660 100 L 660 350 L 140 350 L 140 225"
                fill="none"
                stroke="#334155"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {config.type === 'parallel' && (
              <g>
                {/* Main loop from battery to branch nodes */}
                <path
                  d="M 140 225 L 140 120 L 320 120 M 140 225 L 140 360 L 320 360"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Branch 1 (top) */}
                <path
                  d="M 320 120 L 320 150 L 600 150 L 600 240 M 600 240 L 600 360 L 320 360"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                {/* Branch 2 (bottom) */}
                <path
                  d="M 320 120 L 320 280 L 600 280 L 600 360"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
                {/* Return to battery */}
                <path
                  d="M 600 360 L 140 360"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Active Current Flow Highlight when closed */}
            {calculation.isCircuitClosed && calculation.totalCurrent > 0 && (
              <path
                d={
                  config.type === 'parallel'
                    ? 'M 140 225 L 140 120 L 320 120 L 320 150 L 600 150 L 600 360 L 140 360 Z'
                    : config.type === 'series'
                    ? 'M 140 225 L 140 100 L 660 100 L 660 350 L 140 350 Z'
                    : 'M 160 225 L 160 100 L 640 100 L 640 350 L 160 350 Z'
                }
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="4"
                strokeDasharray="12 12"
                className="animate-[dash_1s_linear_infinite]"
                style={{
                  animationDuration: `${currentSpeed}s`,
                }}
              />
            )}

            {/* -------------------- 1. BATTERY (Left) -------------------- */}
            <g transform="translate(140, 225)">
              <rect x="-30" y="-45" width="60" height="90" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="2" />
              {/* Positive Terminal (+) */}
              <line x1="0" y1="-25" x2="0" y2="-45" stroke="#38BDF8" strokeWidth="6" />
              <line x1="-18" y1="-25" x2="18" y2="-25" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
              <text x="-25" y="-30" fill="#EF4444" fontSize="14" fontWeight="bold">+</text>

              {/* Negative Terminal (-) */}
              <line x1="-10" y1="20" x2="10" y2="20" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
              <line x1="0" y1="20" x2="0" y2="45" stroke="#38BDF8" strokeWidth="6" />
              <text x="-22" y="32" fill="#94A3B8" fontSize="16" fontWeight="bold">-</text>

              {/* Voltage Label */}
              <text x="0" y="2" fill="#F8FAFC" fontSize="13" fontWeight="bold" textAnchor="middle">
                {config.voltage} V
              </text>
              <text x="0" y="14" fill="#94A3B8" fontSize="9" textAnchor="middle">
                DC Source
              </text>
            </g>

            {/* -------------------- 2. MAIN SWITCH (Bottom wire) -------------------- */}
            {config.switches[0] && (
              <g
                transform={`translate(${config.type === 'parallel' ? 240 : 400}, 350)`}
                className="cursor-pointer group"
                onClick={() => toggleSwitch(config.switches[0].id)}
              >
                <circle cx="-25" cy="0" r="5" fill="#E2E8F0" />
                <circle cx="25" cy="0" r="5" fill="#E2E8F0" />
                {/* Switch Knife Blade */}
                <line
                  x1="-25"
                  y1="0"
                  x2="25"
                  y2={config.switches[0].isOpen ? -28 : 0}
                  stroke={config.switches[0].isOpen ? '#EF4444' : '#10B981'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
                <text
                  x="0"
                  y="26"
                  fill={config.switches[0].isOpen ? '#F87171' : '#34D399'}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {config.switches[0].isOpen ? 'Switch OPEN (Click to Close)' : 'Switch CLOSED'}
                </text>
              </g>
            )}

            {/* -------------------- 3. AMMETER (Series on top wire) -------------------- */}
            <g transform="translate(240, 100)">
              <circle cx="0" cy="0" r="28" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
              <text x="0" y="-8" fill="#38BDF8" fontSize="14" fontWeight="bold" textAnchor="middle">
                A
              </text>
              <text x="0" y="14" fill={calculation.isCircuitClosed ? '#38BDF8' : '#64748B'} fontSize="13" fontWeight="bold" textAnchor="middle">
                {isObservationLocked ? '?.?? A' : `${calculation.totalCurrent.toFixed(2)} A`}
              </text>
              <text x="0" y="40" fill="#94A3B8" fontSize="10" textAnchor="middle">
                Ammeter (Series)
              </text>
            </g>

            {/* -------------------- 4. RESISTORS / BULBS -------------------- */}
            {/* Case A: Single Resistor / Ohm's Law */}
            {config.type === 'single' && config.resistors[0] && (
              <g transform="translate(480, 100)">
                <rect x="-45" y="-22" width="90" height="44" rx="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="2.5" />
                {/* Resistor Zigzag Symbol */}
                <path
                  d="M -35 0 L -25 -10 L -15 10 L -5 -10 L 5 10 L 15 -10 L 25 10 L 35 0"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <text x="0" y="38" fill="#FCD34D" fontSize="12" fontWeight="bold" textAnchor="middle">
                  R1 = {config.resistors[0].resistance} Ω
                </text>
              </g>
            )}

            {/* Case B: Series Circuit (R1 + R2 or Bulb 1 + Bulb 2) */}
            {config.type === 'series' && (
              <g>
                {/* Component 1 (Bulb or Resistor) */}
                <g transform="translate(420, 100)">
                  {config.resistors[0]?.isBulb ? (
                    // Bulb 1
                    <g>
                      <circle
                        cx="0"
                        cy="0"
                        r="26"
                        fill={
                          calculation.branchResults[0]?.bulbBrightnessPct && !isObservationLocked
                            ? `rgba(251, 191, 36, ${Math.min(1, 0.2 + calculation.branchResults[0].bulbBrightnessPct / 100)})`
                            : '#1E293B'
                        }
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        filter={calculation.branchResults[0]?.bulbBrightnessPct && !isObservationLocked ? 'url(#bulbGlow)' : undefined}
                      />
                      {/* Filament */}
                      <path d="M -10 10 L -4 -10 L 4 -10 L 10 10" fill="none" stroke="#FCD34D" strokeWidth="2.5" />
                      <text x="0" y="42" fill="#FCD34D" fontSize="11" fontWeight="bold" textAnchor="middle">
                        Bulb 1 ({config.resistors[0].resistance} Ω)
                      </text>
                      {!isObservationLocked && (
                        <text x="0" y="56" fill="#94A3B8" fontSize="10" textAnchor="middle">
                          P = {calculation.branchResults[0]?.power.toFixed(1)} W
                        </text>
                      )}
                    </g>
                  ) : (
                    // Resistor 1
                    <g>
                      <rect x="-35" y="-18" width="70" height="36" rx="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
                      <path d="M -25 0 L -18 -8 L -10 8 L -2 -8 L 6 8 L 14 -8 L 25 0" fill="none" stroke="#F59E0B" strokeWidth="3" />
                      <text x="0" y="32" fill="#FCD34D" fontSize="11" fontWeight="bold" textAnchor="middle">
                        R1 = {config.resistors[0].resistance} Ω
                      </text>
                    </g>
                  )}
                </g>

                {/* Component 2 */}
                <g transform="translate(580, 100)">
                  {config.resistors[1]?.isBulb ? (
                    // Bulb 2
                    <g>
                      <circle
                        cx="0"
                        cy="0"
                        r="26"
                        fill={
                          calculation.branchResults[1]?.bulbBrightnessPct && !isObservationLocked
                            ? `rgba(251, 191, 36, ${Math.min(1, 0.2 + calculation.branchResults[1].bulbBrightnessPct / 100)})`
                            : '#1E293B'
                        }
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        filter={calculation.branchResults[1]?.bulbBrightnessPct && !isObservationLocked ? 'url(#bulbGlow)' : undefined}
                      />
                      {/* Filament */}
                      <path d="M -10 10 L -4 -10 L 4 -10 L 10 10" fill="none" stroke="#FCD34D" strokeWidth="2.5" />
                      <text x="0" y="42" fill="#FCD34D" fontSize="11" fontWeight="bold" textAnchor="middle">
                        Bulb 2 ({config.resistors[1].resistance} Ω)
                      </text>
                      {!isObservationLocked && (
                        <text x="0" y="56" fill="#94A3B8" fontSize="10" textAnchor="middle">
                          P = {calculation.branchResults[1]?.power.toFixed(1)} W
                        </text>
                      )}
                    </g>
                  ) : (
                    // Resistor 2
                    <g>
                      <rect x="-35" y="-18" width="70" height="36" rx="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
                      <path d="M -25 0 L -18 -8 L -10 8 L -2 -8 L 6 8 L 14 -8 L 25 0" fill="none" stroke="#F59E0B" strokeWidth="3" />
                      <text x="0" y="32" fill="#FCD34D" fontSize="11" fontWeight="bold" textAnchor="middle">
                        R2 = {config.resistors[1].resistance} Ω
                      </text>
                    </g>
                  )}
                </g>
              </g>
            )}

            {/* Case C: Parallel Circuit (Branch 1 & Branch 2) */}
            {config.type === 'parallel' && (
              <g>
                {/* Branch 1 Resistor/Bulb (Top) */}
                <g transform="translate(460, 150)">
                  <circle
                    cx="0"
                    cy="0"
                    r="24"
                    fill={
                      calculation.branchResults[0]?.bulbBrightnessPct && !isObservationLocked
                        ? `rgba(251, 191, 36, ${Math.min(1, 0.2 + calculation.branchResults[0].bulbBrightnessPct / 100)})`
                        : '#1E293B'
                    }
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    filter={calculation.branchResults[0]?.bulbBrightnessPct && !isObservationLocked ? 'url(#bulbGlow)' : undefined}
                  />
                  <path d="M -8 8 L -3 -8 L 3 -8 L 8 8" fill="none" stroke="#FCD34D" strokeWidth="2" />
                  <text x="0" y="-32" fill="#FCD34D" fontSize="11" fontWeight="bold" textAnchor="middle">
                    Branch 1: {config.resistors[0]?.resistance} Ω
                  </text>
                  {!isObservationLocked && (
                    <text x="0" y="36" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle">
                      I₁ = {calculation.branchResults[0]?.current.toFixed(2)} A
                    </text>
                  )}
                </g>

                {/* Branch 2 Switch & Resistor/Bulb (Bottom) */}
                <g transform="translate(460, 280)">
                  <circle
                    cx="0"
                    cy="0"
                    r="24"
                    fill={
                      calculation.branchResults[1]?.bulbBrightnessPct && !isObservationLocked
                        ? `rgba(251, 191, 36, ${Math.min(1, 0.2 + calculation.branchResults[1].bulbBrightnessPct / 100)})`
                        : '#1E293B'
                    }
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    filter={calculation.branchResults[1]?.bulbBrightnessPct && !isObservationLocked ? 'url(#bulbGlow)' : undefined}
                  />
                  <path d="M -8 8 L -3 -8 L 3 -8 L 8 8" fill="none" stroke="#FCD34D" strokeWidth="2" />
                  <text x="0" y="-32" fill="#FCD34D" fontSize="11" fontWeight="bold" textAnchor="middle">
                    Branch 2: {config.resistors[1]?.resistance} Ω
                  </text>
                  {!isObservationLocked && (
                    <text x="0" y="36" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle">
                      I₂ = {calculation.branchResults[1]?.current.toFixed(2)} A
                    </text>
                  )}
                </g>

                {/* Branch 2 Local Switch */}
                {config.switches.find((s) => s.controlsBranch === 1) && (
                  <g
                    transform="translate(370, 280)"
                    className="cursor-pointer"
                    onClick={() => {
                      const s2 = config.switches.find((s) => s.controlsBranch === 1);
                      if (s2) toggleSwitch(s2.id);
                    }}
                  >
                    <circle cx="-15" cy="0" r="4" fill="#E2E8F0" />
                    <circle cx="15" cy="0" r="4" fill="#E2E8F0" />
                    <line
                      x1="-15"
                      y1="0"
                      x2="15"
                      y2={config.switches.find((s) => s.controlsBranch === 1)?.isOpen ? -18 : 0}
                      stroke={config.switches.find((s) => s.controlsBranch === 1)?.isOpen ? '#EF4444' : '#10B981'}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <text x="0" y="16" fill="#94A3B8" fontSize="9" textAnchor="middle">
                      Branch 2 Key
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* -------------------- 5. VOLTMETER DISPLAY (Top Right) -------------------- */}
            <g transform="translate(680, 225)">
              <rect x="-40" y="-35" width="80" height="70" rx="8" fill="#0F172A" stroke="#10B981" strokeWidth="2.5" />
              <text x="0" y="-14" fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                VOLTMETER (V)
              </text>
              <text x="0" y="12" fill="#34D399" fontSize="16" fontWeight="bold" textAnchor="middle">
                {isObservationLocked ? '?.?? V' : `${voltmeterReading.toFixed(2)} V`}
              </text>
              <text x="0" y="26" fill="#94A3B8" fontSize="8" textAnchor="middle">
                Target: {selectedVoltmeterTarget.toUpperCase()}
              </text>
            </g>
          </svg>
        </div>

        {/* Live Observation Banner */}
        <div className="w-full max-w-3xl mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Applied Voltage (V)
            </span>
            <span className="text-lg font-bold text-cyan-400">
              {config.voltage} V
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Equiv. Resistance (R)
            </span>
            <span className="text-lg font-bold text-amber-400">
              {isObservationLocked ? '---' : `${calculation.totalResistance} Ω`}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Current (I)
            </span>
            <span className="text-lg font-bold text-sky-400">
              {isObservationLocked ? '---' : `${calculation.totalCurrent.toFixed(2)} A`}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Power (P)
            </span>
            <span className="text-lg font-bold text-emerald-400">
              {isObservationLocked ? '---' : `${calculation.totalPower.toFixed(1)} W`}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Drawer */}
      <div className="bg-slate-950 p-5 border-t border-slate-800">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Interactive Circuit Controls</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Battery Voltage Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Battery Voltage (V)</span>
              <span className="font-mono font-bold text-cyan-400">{config.voltage} V</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="1"
              value={config.voltage}
              onChange={(e) => updateVoltage(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 V</span>
              <span>12 V</span>
              <span>24 V</span>
            </div>
          </div>

          {/* Resistor 1 Slider */}
          {config.resistors[0] && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                  {config.resistors[0].name} Resistance (R₁)
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {config.resistors[0].resistance} Ω
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.resistors[0].resistance}
                onChange={(e) => updateResistor(0, Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 Ω</span>
                <span>10 Ω</span>
                <span>20 Ω</span>
              </div>
            </div>
          )}

          {/* Resistor 2 Slider (if multi-component) */}
          {config.resistors[1] && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                  {config.resistors[1].name} Resistance (R₂)
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {config.resistors[1].resistance} Ω
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.resistors[1].resistance}
                onChange={(e) => updateResistor(1, Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 Ω</span>
                <span>10 Ω</span>
                <span>20 Ω</span>
              </div>
            </div>
          )}
        </div>

        {/* Assumptions Accordion */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span>
            <strong>Deterministic Physics Engine:</strong> Zero wire resistance, ideal battery (0Ω internal), bulb brightness modeled by P = I²R.
          </span>
        </div>
      </div>
    </div>
  );
};
