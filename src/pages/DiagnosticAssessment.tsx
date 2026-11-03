import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Question } from '../types';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  TrendingUp,
  FlaskConical,
  Award,
} from 'lucide-react';

export const DiagnosticAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshLearnerModel } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { answer: string; confidence: string; explanation: string }>
  >({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentConfidence, setCurrentConfidence] = useState('somewhat_confident');
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.getDiagnosticAssessment();
      setQuestions(res.questions);
    } catch (e) {
      console.error('Failed to load diagnostic:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[currentIndex];

  const handleNextQuestion = () => {
    if (!currentQ || !currentAnswer.trim()) return;

    const updatedAnswers = {
      ...answers,
      [currentQ.id]: {
        answer: currentAnswer.trim(),
        confidence: currentConfidence,
        explanation: currentExplanation.trim(),
      },
    };
    setAnswers(updatedAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      const nextQ = questions[currentIndex + 1];
      const prev = updatedAnswers[nextQ.id];
      setCurrentAnswer(prev?.answer || '');
      setCurrentConfidence(prev?.confidence || 'somewhat_confident');
      setCurrentExplanation(prev?.explanation || '');
    } else {
      // Submit assessment
      handleSubmitDiagnostic(updatedAnswers);
    }
  };

  const handleSubmitDiagnostic = async (
    allAnswers: Record<string, { answer: string; confidence: string; explanation: string }>
  ) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(allAnswers).map(([qid, val]) => ({
        questionId: qid,
        answer: val.answer,
        confidence: val.confidence,
        explanation: val.explanation,
      }));

      const res = await api.submitDiagnostic(user.id, payload);
      setReport(res);
      await refreshLearnerModel();
    } catch (e) {
      console.error('Error submitting diagnostic:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Loading Diagnostic Assessment...
      </div>
    );
  }

  // ================= DIAGNOSTIC REPORT VIEW =================
  if (report) {
    const { report: rep, recommendation } = report;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
              <Award className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Diagnostic Assessment Complete
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-1">
              Class 10 Physics Baseline Report
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2">
              Your initial learner model has been initialized with concept-by-concept diagnostic evidence.
            </p>

            <div className="mt-8 flex justify-center gap-8">
              <div className="text-center">
                <span className="text-xs text-slate-400 uppercase">Correct Score</span>
                <div className="text-3xl font-black text-cyan-400">
                  {rep.score} / {rep.totalQuestions}
                </div>
              </div>
              <div className="w-px bg-slate-800" />
              <div className="text-center">
                <span className="text-xs text-slate-400 uppercase">Baseline Mastery</span>
                <div className="text-3xl font-black text-blue-400">{rep.percentage}%</div>
              </div>
            </div>
          </div>

          {/* Actionable Next Step Recommendation */}
          <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-cyan-800/80 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                Recommended Focus Area
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Investigate "{recommendation.weakestConcept}"
              </h3>
              <p className="text-xs text-slate-400 mt-1">{recommendation.suggestedAction}</p>
            </div>
            <button
              onClick={() => navigate(`/lab?concept=${recommendation.conceptId}`)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer whitespace-nowrap"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Launch Virtual Lab</span>
            </button>
          </div>

          {/* Concept Breakdown Grid */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <h3 className="text-base font-bold text-white mb-4">Topic-Wise Performance Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(rep.conceptBreakdown).map(([cid, val]: [string, any]) => (
                <div key={cid} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{cid.toUpperCase()} Topic</span>
                    <span className="text-[11px] text-slate-400">
                      {val.correct} / {val.total} answered correctly
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      val.score >= 70
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : val.score >= 50
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {val.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/graph')}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
            >
              View Concept Graph
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= ACTIVE DIAGNOSTIC TEST VIEW =================
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span>{progressPct}% Completed</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Current Question Card */}
        {currentQ && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800 font-semibold">
                {currentQ.conceptName}
              </span>
              <span className="text-slate-400 capitalize">
                Difficulty: <strong className="text-slate-200">{currentQ.difficulty}</strong>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQ.questionText}
            </h2>

            {/* Multiple Choice Options */}
            {currentQ.type === 'multiple_choice' && currentQ.options && (
              <div className="space-y-2.5">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCurrentAnswer(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer flex items-start gap-3 ${
                      currentAnswer === opt.id
                        ? 'bg-blue-600/20 border-cyan-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        currentAnswer === opt.id
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
            {currentQ.type === 'numerical' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Numerical Value ({currentQ.unit || 'units'}):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-48 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-base text-white font-mono placeholder-slate-600 focus:outline-none"
                  />
                  <span className="text-sm font-semibold text-cyan-400">{currentQ.unit}</span>
                </div>
              </div>
            )}

            {/* Written Reasoning Explanation (Optional for Diagnostic) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Explain your reasoning (Optional):
              </label>
              <textarea
                rows={2}
                value={currentExplanation}
                onChange={(e) => setCurrentExplanation(e.target.value)}
                placeholder="Share your calculation steps or underlying physics logic..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* Confidence Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Confidence level:
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
                    onClick={() => setCurrentConfidence(c.id)}
                    className={`py-2 px-3 rounded-lg border font-medium transition cursor-pointer ${
                      currentConfidence === c.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Button */}
            <div className="pt-2 flex justify-end">
              <button
                disabled={!currentAnswer.trim() || submitting}
                onClick={handleNextQuestion}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                <span>{currentIndex + 1 === questions.length ? 'Submit Assessment' : 'Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
