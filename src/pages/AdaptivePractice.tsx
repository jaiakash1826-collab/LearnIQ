import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Question, ThinkTraceEvaluation } from '../types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
  RotateCcw,
  Gauge,
  ShieldAlert,
  Send,
  Zap,
} from 'lucide-react';

export const AdaptivePractice: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshLearnerModel } = useAuth();
  const conceptParam = searchParams.get('concept');

  const [question, setQuestion] = useState<Question | null>(null);
  const [source, setSource] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [confidence, setConfidence] = useState<string>('somewhat_confident');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    diagnosis: ThinkTraceEvaluation;
    updatedMastery: any;
    overallMastery: number;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    loadNextQuestion();
  }, [user, conceptParam]);

  const loadNextQuestion = async () => {
    if (!user) return;
    setLoading(true);
    setResult(null);
    setAnswer('');
    setExplanation('');
    try {
      const res = await api.getNextQuestion(user.id, conceptParam || undefined);
      setQuestion(res.question);
      setSource(res.source);
    } catch (e) {
      console.error('Error fetching question:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !question || !answer.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.submitAttempt({
        studentId: user.id,
        questionId: question.id,
        answer: answer.trim(),
        explanation: explanation.trim(),
        confidence,
      });
      setResult(res);
      await refreshLearnerModel();
    } catch (e) {
      console.error('Error submitting attempt:', e);
    } finally {
      setSubmitting(false);
    }
  };

  // Confidence Calibration Quadrant
  const getCalibrationLabel = () => {
    if (!result) return null;
    const isConf = confidence === 'very_confident';
    if (result.isCorrect && isConf) {
      return {
        label: 'Calibrated Mastery (Correct & Confident)',
        color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
        desc: 'High confidence grounded in valid physics principles.',
      };
    }
    if (result.isCorrect && !isConf) {
      return {
        label: 'Uncertain Correctness (Correct but Hesitant)',
        color: 'text-amber-400 bg-amber-950/60 border-amber-800',
        desc: 'You reached the correct answer, but confidence was low. Review to solidify intuition.',
      };
    }
    if (!result.isCorrect && isConf) {
      return {
        label: 'High-Confidence Misconception (Incorrect but Confident)',
        color: 'text-rose-400 bg-rose-950/60 border-rose-800',
        desc: 'You felt very confident, but the reasoning contradicted physical law. Urgent review recommended!',
      };
    }
    return {
      label: 'Recognized Blindspot (Incorrect & Uncertain)',
      color: 'text-blue-400 bg-blue-950/60 border-blue-800',
      desc: 'You recognized uncertainty in this question. A targeted practice or virtual lab session will help.',
    };
  };

  const calib = getCalibrationLabel();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800">
              ADAPTIVE PRACTICE
            </span>
            <span className="text-xs text-slate-400">Class 10 Physics: Electricity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-cyan-400" />
            <span>ThinkTrace Adaptive Practice</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Questions automatically adapt to your concept mastery and previous misconceptions. Explain your thinking to receive full reasoning diagnosis.
          </p>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            Selecting next adaptive question...
          </div>
        ) : question ? (
          <div className="space-y-6">
            {/* Question Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold border border-slate-700">
                  {question.conceptName}
                </span>
                <span className="text-slate-400 capitalize">
                  Difficulty: <strong className="text-slate-200">{question.difficulty}</strong>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {question.questionText}
              </h2>

              {/* Multiple Choice Options */}
              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-2.5">
                  {question.options.map((opt) => (
                    <button
                      key={opt.id}
                      disabled={!!result}
                      onClick={() => setAnswer(opt.id)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer flex items-start gap-3 ${
                        answer === opt.id
                          ? 'bg-blue-600/20 border-cyan-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          answer === opt.id
                            ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                            : 'border-slate-600 text-slate-400'
                        }`}
                      >
                        {opt.id.toUpperCase()}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Numerical Input */}
              {question.type === 'numerical' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Numerical Answer:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      disabled={!!result}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="e.g. 6"
                      className="w-48 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-base text-white font-mono placeholder-slate-600 focus:outline-none"
                    />
                    <span className="text-sm font-semibold text-cyan-400">{question.unit}</span>
                  </div>
                </div>
              )}

              {/* Reasoning Explanation Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Explain your reasoning (Why did you choose this?):
                </label>
                <textarea
                  rows={2}
                  disabled={!!result}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="ThinkTrace evaluates your reasoning, not just your answer..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Confidence Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  How confident are you?
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'very_confident', label: 'Very Confident' },
                    { id: 'somewhat_confident', label: 'Somewhat Confident' },
                    { id: 'not_confident', label: 'Uncertain' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!!result}
                      onClick={() => setConfidence(c.id)}
                      className={`py-2 px-3 rounded-lg border font-medium transition cursor-pointer ${
                        confidence === c.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit or Next Question */}
              {!result && (
                <div className="pt-2 flex justify-end">
                  <button
                    disabled={!answer.trim() || submitting}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Diagnosing Thinking...' : 'Submit & Diagnose'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* ThinkTrace Evaluation Result Card */}
            {result && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {result.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-rose-400" />
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {result.isCorrect ? 'Correct Result!' : 'Incorrect Result'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Correct Answer: <strong className="text-cyan-400">{result.correctAnswer}</strong>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      result.diagnosis.reasoningQuality === 'sound'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : result.diagnosis.reasoningQuality === 'partially_sound'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {result.diagnosis.reasoningQuality.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                {/* Confidence Calibration Quadrant Badge */}
                {calib && (
                  <div className={`p-3 rounded-xl border text-xs ${calib.color}`}>
                    <strong>Confidence Calibration:</strong> {calib.label}
                    <div className="text-[11px] opacity-80 mt-0.5">{calib.desc}</div>
                  </div>
                )}

                {/* ThinkTrace Reasoning Feedback */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    ThinkTrace Reasoning Evaluation
                  </span>
                  <p className="text-slate-300 leading-relaxed">{result.diagnosis.explanation}</p>
                  <p className="text-emerald-300 font-medium pt-1 border-t border-slate-800">
                    Scientific Logic: {result.diagnosis.correctScientificExplanation}
                  </p>
                </div>

                {/* Next Question Navigation */}
                <div className="pt-2 flex justify-between items-center">
                  <button
                    onClick={() => navigate(`/lab?concept=${question.conceptId}`)}
                    className="text-xs font-semibold text-cyan-400 hover:underline"
                  >
                    Explore in Virtual Lab
                  </button>

                  <button
                    onClick={loadNextQuestion}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-blue-600/30"
                  >
                    <span>Next Adaptive Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            No questions available for this concept.
          </div>
        )}
      </div>
    </div>
  );
};
