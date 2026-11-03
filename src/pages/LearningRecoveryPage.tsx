import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RecoveryActivity } from '../types';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BrainCircuit,
  ArrowRight,
  FlaskConical,
  Award,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const LearningRecoveryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshLearnerModel } = useAuth();
  const conceptParam = searchParams.get('concept') || 'c6';

  const [recovery, setRecovery] = useState<RecoveryActivity | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepAnswer, setStepAnswer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingStep, setSubmittingStep] = useState<boolean>(false);
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadOrCreateRecovery();
  }, [user, conceptParam]);

  const loadOrCreateRecovery = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const existing = await api.getRecoveryActivities(user.id);
      const match = existing.activities.find(
        (a) => a.conceptId === conceptParam && a.status !== 'completed'
      );

      if (match) {
        setRecovery(match);
        // Find first incomplete step
        const incIdx = match.steps.findIndex((s) => !s.completed);
        setCurrentStepIndex(incIdx >= 0 ? incIdx : 0);
      } else {
        // Start new recovery journey
        const res = await api.startRecovery(user.id, conceptParam);
        setRecovery(res.recovery);
        setCurrentStepIndex(0);
      }
    } catch (e) {
      console.error('Error in recovery flow:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = recovery?.steps[currentStepIndex];

  const handleCompleteCurrentStep = async () => {
    if (!recovery || !currentStep || !user) return;

    // If step has a question, validate it
    let passed = true;
    if (currentStep.question) {
      const q = currentStep.question;
      const expected = String(q.correctAnswer).trim().toLowerCase();
      const actual = stepAnswer.trim().toLowerCase();
      passed = actual === expected || actual.includes(expected);

      if (!passed) {
        setStepFeedback(
          `Not quite. The expected answer is ${q.correctAnswer} (${q.unit || ''}). Scientific reasoning: ${q.expectedReasoning}`
        );
        return;
      }
    }

    setSubmittingStep(true);
    setStepFeedback(null);
    try {
      const res = await api.completeRecoveryStep({
        studentId: user.id,
        recoveryId: recovery.id,
        stepNumber: currentStep.stepNumber,
        studentResponse: stepAnswer,
        passed,
      });

      setRecovery(res.activity);
      await refreshLearnerModel();

      if (currentStepIndex + 1 < recovery.steps.length) {
        setCurrentStepIndex(currentStepIndex + 1);
        setStepAnswer('');
      }
    } catch (e) {
      console.error('Error completing recovery step:', e);
    } finally {
      setSubmittingStep(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Initializing Targeted Recovery Journey...
      </div>
    );
  }

  const isCompleted = recovery?.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              LEARNING RECOVERY MODE
            </span>
            <span className="text-xs text-slate-400">Personalized Intervention</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <RotateCcw className="w-7 h-7 text-cyan-400" />
            <span>{recovery?.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Addressing: <strong className="text-slate-200">{recovery?.misconceptionAddressed}</strong>
          </p>
        </div>

        {/* Step Progression Stepper */}
        <div className="grid grid-cols-5 gap-2 text-xs">
          {recovery?.steps.map((st, idx) => (
            <div
              key={st.stepNumber}
              className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition ${
                st.completed
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : idx === currentStepIndex
                  ? 'bg-blue-600/30 border-cyan-400 text-white font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="text-[10px] uppercase font-bold">Step {st.stepNumber}</span>
              <span className="text-[11px] truncate w-full mt-0.5">
                {st.completed ? 'Completed' : idx === currentStepIndex ? 'In Progress' : 'Pending'}
              </span>
            </div>
          ))}
        </div>

        {/* ================= COMPLETED STATE ================= */}
        {isCompleted ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Remediation Verified
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Conceptual Gap Successfully Overcome!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2">
                You demonstrated independent scientific mastery across the verification challenge. Your concept mastery has been upgraded by +18%.
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => navigate('/practice')}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Continue Practice
              </button>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE STEP CARD ================= */
          currentStep && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 font-semibold border border-blue-800">
                  {currentStep.title}
                </span>
                <span className="text-slate-400 capitalize">
                  Step {currentStepIndex + 1} of {recovery.steps.length}
                </span>
              </div>

              {/* Explainer Content */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
                <p>{currentStep.content}</p>

                {currentStep.circuitPreset && (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Preset ready in Virtual Lab: {currentStep.circuitPreset.name}
                    </span>
                    <Link
                      to={`/lab?preset=${currentStep.circuitPreset.type}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Open Preset in Lab</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Question Challenge (if step contains a practice/verification question) */}
              {currentStep.question && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{currentStep.question.title}</span>
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-300">
                    {currentStep.question.questionText}
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Your Answer ({currentStep.question.unit || 'value'}):
                    </label>
                    <input
                      type="text"
                      value={stepAnswer}
                      onChange={(e) => setStepAnswer(e.target.value)}
                      placeholder="Enter solution..."
                      className="w-full sm:w-64 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  {stepFeedback && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300">
                      {stepFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Step Navigation Action */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  disabled={submittingStep || (currentStep.question && !stepAnswer.trim())}
                  onClick={handleCompleteCurrentStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  <span>
                    {currentStepIndex + 1 === recovery.steps.length
                      ? 'Submit Verification & Finish'
                      : 'Complete Step & Proceed'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
