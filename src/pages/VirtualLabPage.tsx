import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CircuitConfig, CircuitCalculationResult, ThinkTraceEvaluation } from '../types';
import { VirtualLabCanvas } from '../components/circuit/VirtualLabCanvas';
import {
  FlaskConical,
  HelpCircle,
  BrainCircuit,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  Eye,
  Check,
} from 'lucide-react';

export const VirtualLabPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshLearnerModel } = useAuth();

  // Selected preset
  const presetParam = searchParams.get('preset') || 'series';

  // 7-Stage state: 'predict' | 'experiment' | 'observe' | 'explain' | 'diagnosis'
  const [stage, setStage] = useState<'predict' | 'experiment' | 'observe' | 'explain' | 'diagnosis'>('predict');

  // Circuit Configuration State
  const [config, setConfig] = useState<CircuitConfig>(() => getInitialConfig(presetParam));
  const [calculation, setCalculation] = useState<CircuitCalculationResult>({
    voltage: 12,
    totalResistance: 12,
    totalCurrent: 1,
    totalPower: 12,
    isCircuitClosed: true,
    branchResults: [],
    assumptions: [],
    explanation: '',
  });

  // Prediction State
  const [predictionHypothesis, setPredictionHypothesis] = useState<string>('');
  const [predictionExplanation, setPredictionExplanation] = useState<string>('');
  const [confidence, setConfidence] = useState<string>('somewhat_confident');
  const [postObservationExplanation, setPostObservationExplanation] = useState<string>('');

  // Diagnosis State from ThinkTrace
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<ThinkTraceEvaluation | null>(null);

  useEffect(() => {
    setConfig(getInitialConfig(presetParam));
    setStage('predict');
    setDiagnosis(null);
    setPredictionHypothesis('');
    setPredictionExplanation('');
    setPostObservationExplanation('');
  }, [presetParam]);

  // Recalculate deterministic physics whenever config changes
  useEffect(() => {
    const fetchCalc = async () => {
      try {
        const res = await api.calculateCircuit(config);
        setCalculation(res);
      } catch (e) {
        console.error('Calculation error:', e);
      }
    };
    fetchCalc();
  }, [config]);

  function getInitialConfig(preset: string): CircuitConfig {
    if (preset === 'single') {
      return {
        type: 'single',
        name: "Ohm's Law Single Resistor Lab",
        description: 'Investigate the direct proportionality between voltage and current (V = IR).',
        voltage: 12,
        resistors: [{ id: 'r1', name: 'Fixed Resistor', resistance: 4 }],
        switches: [{ id: 's1', name: 'Main Key', isOpen: false }],
        meters: { ammeterConnected: true, voltmeterConnected: true },
      };
    }
    if (preset === 'parallel') {
      return {
        type: 'parallel',
        name: 'Parallel Circuit Branches Lab',
        description: 'Observe how adding parallel branches lowers total equivalent resistance.',
        voltage: 12,
        resistors: [
          { id: 'r1', name: 'Branch 1 Resistor', resistance: 6, isBulb: true },
          { id: 'r2', name: 'Branch 2 Resistor', resistance: 6, isBulb: true },
        ],
        switches: [
          { id: 's1', name: 'Main Key', isOpen: false },
          { id: 's2', name: 'Branch 2 Key', isOpen: true, controlsBranch: 1 },
        ],
        meters: { ammeterConnected: true, voltmeterConnected: true },
      };
    }
    // Default: Series circuit (Signature Misconception demonstration!)
    return {
      type: 'series',
      name: 'Series Circuit & Current Conservation Lab',
      description: 'Discover whether current is consumed as it passes through successive bulbs.',
      voltage: 12,
      resistors: [
        { id: 'r1', name: 'Bulb 1', resistance: 6, isBulb: true },
        { id: 'r2', name: 'Bulb 2', resistance: 6, isBulb: true },
      ],
      switches: [{ id: 's1', name: 'Main Key', isOpen: false }],
      meters: { ammeterConnected: true, voltmeterConnected: true },
    };
  }

  // Pre-crafted hypotheses for the active circuit
  const hypothesesByPreset: Record<string, { id: string; text: string; isCommonMisconception?: boolean }[]> = {
    series: [
      {
        id: 'h1',
        text: 'Bulb 1 shines brighter because it is closer to the positive terminal and receives current first.',
        isCommonMisconception: true,
      },
      {
        id: 'h2',
        text: 'Both bulbs shine with identical brightness because current is strictly equal everywhere in a series loop.',
      },
      {
        id: 'h3',
        text: 'Bulb 2 shines brighter because electrons flow from the negative terminal.',
      },
    ],
    parallel: [
      {
        id: 'p1',
        text: 'Closing Switch 2 to add a second 6Ω branch in parallel will increase total resistance to 12Ω.',
        isCommonMisconception: true,
      },
      {
        id: 'p2',
        text: 'Closing Switch 2 will decrease equivalent resistance to 3Ω and double the total battery current.',
      },
      {
        id: 'p3',
        text: 'Branch 1 will dim significantly because Branch 2 consumes half the voltage.',
        isCommonMisconception: true,
      },
    ],
    single: [
      {
        id: 's1',
        text: 'Doubling battery voltage from 12V to 24V will double current from 3A to 6A, leaving resistance at 4Ω.',
      },
      {
        id: 's2',
        text: 'Doubling battery voltage will double the resistor resistance because R = V / I.',
        isCommonMisconception: true,
      },
    ],
  };

  const hypotheses = hypothesesByPreset[config.type] || hypothesesByPreset.series;

  const handleSubmitPrediction = () => {
    if (!predictionHypothesis) return;
    setStage('experiment');
  };

  const handleObserveAndExplain = () => {
    setStage('explain');
  };

  const handleRunThinkTraceDiagnosis = async () => {
    if (!user) return;
    setIsDiagnosing(true);
    try {
      const selectedHyp = hypotheses.find((h) => h.id === predictionHypothesis);
      const res = await api.recordCircuitExperiment({
        studentId: user.id,
        circuitType: config.type,
        prediction: selectedHyp ? selectedHyp.text : predictionHypothesis,
        studentExplanation: `${predictionExplanation} | Post-observation reflection: ${postObservationExplanation}`,
        confidence,
        circuitConfig: config,
        conceptName: config.name,
      });

      setDiagnosis(res.diagnosis);
      setStage('diagnosis');
      await refreshLearnerModel();
    } catch (err) {
      console.error('Error running ThinkTrace diagnosis:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleResetLab = () => {
    setConfig(getInitialConfig(presetParam));
    setStage('predict');
    setDiagnosis(null);
    setPredictionHypothesis('');
    setPredictionExplanation('');
    setPostObservationExplanation('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Lab Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                CLASS 10 VIRTUAL LABORATORY
              </span>
              <span className="text-xs text-slate-400">Chapter 12: Electricity</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <FlaskConical className="w-7 h-7 text-cyan-400" />
              <span>{config.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{config.description}</p>
          </div>

          {/* Preset Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => navigate('/lab?preset=series')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                presetParam === 'series' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Series Circuit
            </button>
            <button
              onClick={() => navigate('/lab?preset=parallel')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                presetParam === 'parallel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Parallel Circuit
            </button>
            <button
              onClick={() => navigate('/lab?preset=single')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                presetParam === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ohm's Law
            </button>
          </div>
        </div>

        {/* 7-Stage Process Stepper Indicator */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs overflow-x-auto no-scrollbar gap-2">
          {[
            { key: 'predict', label: '1. PREDICT', desc: 'State Hypothesis' },
            { key: 'experiment', label: '2. EXPERIMENT', desc: 'Interact With Circuit' },
            { key: 'observe', label: '3. OBSERVE', desc: 'Observe Physics Values' },
            { key: 'explain', label: '4. EXPLAIN', desc: 'Explain Differences' },
            { key: 'diagnosis', label: '5. DIAGNOSE', desc: 'ThinkTrace AI' },
          ].map((s, idx) => {
            const isCurrent = stage === s.key || (stage === 'observe' && s.key === 'experiment');
            return (
              <div
                key={s.key}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap ${
                  isCurrent
                    ? 'bg-blue-600/30 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'text-slate-500 font-medium'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <div>
                  <div>{s.label}</div>
                  <div className="text-[10px] text-slate-400 hidden md:block">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= STAGE 1: PREDICTION MODAL / PANEL ================= */}
        {stage === 'predict' && (
          <div className="bg-slate-900 border border-cyan-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 text-xs font-bold border border-cyan-800">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>STEP 1: PREDICTION BEFORE EXPERIMENT</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                Before testing, what do you predict will happen in this circuit?
              </h2>

              <p className="text-xs text-slate-400">
                True scientific learning begins with challenging your intuition. Select a prediction and explain your reasoning. The circuit values will remain locked until your prediction is committed.
              </p>

              {/* Hypothesis Choices */}
              <div className="space-y-2.5">
                {hypotheses.map((h) => (
                  <label
                    key={h.id}
                    onClick={() => setPredictionHypothesis(h.id)}
                    className={`block p-4 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition ${
                      predictionHypothesis === h.id
                        ? 'bg-blue-600/20 border-cyan-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                          predictionHypothesis === h.id ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                        }`}
                      >
                        {predictionHypothesis === h.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                      <span>{h.text}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Written Reasoning Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Why do you believe this will happen? Explain your scientific thinking:
                </label>
                <textarea
                  rows={3}
                  value={predictionExplanation}
                  onChange={(e) => setPredictionExplanation(e.target.value)}
                  placeholder="e.g., I think Bulb 1 receives the electric current first from the battery before it passes to Bulb 2..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none transition"
                />
              </div>

              {/* Confidence Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  How confident are you in this prediction?
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'very_confident', label: 'Very Confident' },
                    { id: 'somewhat_confident', label: 'Somewhat Confident' },
                    { id: 'not_confident', label: 'Uncertain / Guess' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setConfidence(c.id)}
                      className={`py-2 px-3 rounded-lg border font-medium transition cursor-pointer ${
                        confidence === c.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Prediction */}
              <div className="pt-2">
                <button
                  disabled={!predictionHypothesis}
                  onClick={handleSubmitPrediction}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Lock Prediction & Unlock Virtual Lab</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 2 & 3: THE VIRTUAL CIRCUIT CANVAS ================= */}
        <VirtualLabCanvas
          config={config}
          calculation={calculation}
          onConfigChange={setConfig}
          onReset={handleResetLab}
          isObservationLocked={stage === 'predict'}
        />

        {/* Experiment Actions Row */}
        {stage === 'experiment' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Ready to Compare Prediction with Physical Outcome?</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Examine the ammeter reading ({calculation.totalCurrent.toFixed(2)} A) and bulb brightness above.
              </p>
            </div>
            <button
              onClick={handleObserveAndExplain}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/30 whitespace-nowrap"
            >
              <span>Explain Observation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= STAGE 4: EXPLANATION STEP ================= */}
        {stage === 'explain' && (
          <div className="bg-slate-900 border border-blue-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 text-blue-300 text-xs font-bold border border-blue-800">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>STEP 4: REFLECT ON THE OBSERVATION</span>
            </div>

            <h2 className="text-xl font-bold text-white">
              Why was your prediction supported or contradicted by the simulated physics?
            </h2>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="text-slate-400">
                Your Prior Prediction:{' '}
                <strong className="text-slate-200">
                  {hypotheses.find((h) => h.id === predictionHypothesis)?.text || predictionHypothesis}
                </strong>
              </div>
              <div className="text-slate-400">
                Actual Deterministic Result:{' '}
                <strong className="text-cyan-400">
                  Total Current = {calculation.totalCurrent.toFixed(2)} A, Total Resistance = {calculation.totalResistance} Ω
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Describe your understanding now:
              </label>
              <textarea
                rows={3}
                value={postObservationExplanation}
                onChange={(e) => setPostObservationExplanation(e.target.value)}
                placeholder="e.g. I noticed that the current on both meters is identical (1.0 A). The first bulb did not use up current because charge cannot disappear in a single loop..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <button
              disabled={isDiagnosing}
              onClick={handleRunThinkTraceDiagnosis}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>{isDiagnosing ? 'ThinkTrace AI Evaluating Reasoning...' : 'Diagnose Thinking with ThinkTrace AI'}</span>
            </button>
          </div>
        )}

        {/* ================= STAGE 5: THINKTRACE DIAGNOSIS OUTCOME ================= */}
        {stage === 'diagnosis' && diagnosis && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ThinkTrace Reasoning Diagnosis</h3>
                  <p className="text-xs text-slate-400">Class 10 Physics Diagnostic Report</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    diagnosis.reasoningQuality === 'sound'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : diagnosis.reasoningQuality === 'partially_sound'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {diagnosis.reasoningQuality.toUpperCase().replace('_', ' ')} REASONING
                </span>
                <span className="text-xs text-slate-400">
                  Confidence: {Math.round(diagnosis.confidenceOfDiagnosis * 100)}%
                </span>
              </div>
            </div>

            {/* Identified Misconception Alert if present */}
            {diagnosis.possibleMisconception && (
              <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block">
                    Misconception Memory Activated
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    "{diagnosis.possibleMisconception}"
                  </h4>
                  <p className="text-xs text-rose-200 mt-1">
                    {diagnosis.identifiedError || diagnosis.explanation}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    This misconception pattern has been stored in your persistent learner record for targeted follow-up.
                  </p>
                </div>
              </div>
            )}

            {/* Pedagogical Explanation & Correct Scientific Logic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Evaluator Feedback
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{diagnosis.explanation}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Correct Scientific Principle
                </span>
                <p className="text-xs text-emerald-300/90 leading-relaxed">
                  {diagnosis.correctScientificExplanation}
                </p>
              </div>
            </div>

            {/* Stage 6 & 7: Recovery & Verification Next Steps */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={handleResetLab}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Another Experiment</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/practice')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Verify with Practice Question</span>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      `/recovery?concept=${
                        config.type === 'series' ? 'c6' : config.type === 'parallel' ? 'c7' : 'c5'
                      }`
                    )
                  }
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  <span>Launch Recovery Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
