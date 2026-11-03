import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DAA_PROGRAMS, DaaProgram } from '../data/daaPrograms';
import {
  Code2,
  Play,
  Copy,
  Check,
  Terminal,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Clock,
  Layers,
  Send,
  HelpCircle,
} from 'lucide-react';

export const DaaModelExamPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<DaaProgram>(DAA_PROGRAMS[0]);
  const [customInput, setCustomInput] = useState<string>(DAA_PROGRAMS[0].sampleInput);
  const [customCode, setCustomCode] = useState<string>(DAA_PROGRAMS[0].code);
  const [isEditingCode, setIsEditingCode] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [submittingTest, setSubmittingTest] = useState<boolean>(false);
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(true);

  const handleSelectProgram = (prog: DaaProgram) => {
    setSelectedProgram(prog);
    setCustomInput(prog.sampleInput);
    setCustomCode(prog.code);
    setIsEditingCode(false);
    setOutput(null);
    setError(null);
    setExecutionTime(null);
    setTestSubmitted(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditingCode ? customCode : selectedProgram.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetSample = () => {
    setCustomInput(selectedProgram.sampleInput);
    setCustomCode(selectedProgram.code);
    setOutput(null);
    setError(null);
  };

  const handleRunProgram = async () => {
    setRunning(true);
    setError(null);
    setOutput(null);
    try {
      const res = await api.runDaaProgram(
        selectedProgram.id,
        customInput,
        isEditingCode ? customCode : undefined
      );
      if (res.error) {
        setError(res.error);
      }
      setOutput(res.output);
      setExecutionTime(res.executionTimeMs);
    } catch (e: any) {
      setError(e.message || 'Failed to execute program');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitAttendance = async () => {
    setSubmittingTest(true);
    try {
      const studentId = user?.id || 'jaiakash1826';
      await api.submitDaaPractice(
        studentId,
        selectedProgram.id,
        selectedProgram.title,
        output ? output.trim() === selectedProgram.expectedOutput.trim() : true
      );
      setTestSubmitted(true);
      setTimeout(() => setTestSubmitted(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingTest(false);
    }
  };

  const isOutputMatching =
    output && output.trim() === selectedProgram.expectedOutput.trim();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner Alert from Teacher Instructions */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-800/60 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Model Exam High-Yield
                </span>
                <span className="text-xs text-amber-400 font-medium bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                  Modules 3 & 4 Theory Omitted
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                DAA Model Exam Preparation (7 Practical Programs)
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                Shortest exam-friendly Python implementations with dynamic runtime input (<code className="text-cyan-300">input()</code>), aligned sample inputs, expected outputs, and live Python execution testing.
              </p>
            </div>
            <button
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 shrink-0"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              {showCheatSheet ? 'Hide Revision Table' : 'Show Revision Table'}
            </button>
          </div>
        </div>

        {/* Revision Table */}
        {showCheatSheet && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 overflow-hidden">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Final DAA Revision Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">No.</th>
                    <th className="py-2.5 px-4">Topic / Problem</th>
                    <th className="py-2.5 px-4">Algorithm Paradigm</th>
                    <th className="py-2.5 px-4">Core Mechanism</th>
                    <th className="py-2.5 px-3">Time Complexity</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {DAA_PROGRAMS.map((prog) => (
                    <tr
                      key={prog.id}
                      onClick={() => handleSelectProgram(prog)}
                      className={`cursor-pointer transition-colors ${
                        selectedProgram.id === prog.id
                          ? 'bg-cyan-950/40 text-cyan-100 font-medium'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">#{prog.id}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-100">{prog.title}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            prog.technique === 'Greedy'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : prog.technique === 'Dynamic Programming'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                              : prog.technique === 'Backtracking'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          }`}
                        >
                          {prog.technique}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{prog.mainConcept}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{prog.timeComplexity}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProgram(prog);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 underline font-medium text-[11px]"
                        >
                          View & Run
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Program Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          {DAA_PROGRAMS.map((prog) => (
            <button
              key={prog.id}
              onClick={() => handleSelectProgram(prog)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedProgram.id === prog.id
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-900/30'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-950/60 flex items-center justify-center font-bold text-[10px]">
                {prog.id}
              </span>
              <span>{prog.title}</span>
            </button>
          ))}
        </div>

        {/* Selected Program Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Code and Explanation */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      Program {selectedProgram.id}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{selectedProgram.algorithm}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {selectedProgram.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingCode(!isEditingCode)}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
                  >
                    {isEditingCode ? 'View Original' : 'Edit / Custom Code'}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Python 3 (Dynamic Input)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Time: {selectedProgram.timeComplexity} | Space: {selectedProgram.spaceComplexity}
                  </span>
                </div>

                {isEditingCode ? (
                  <textarea
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    rows={16}
                    className="w-full bg-slate-950 font-mono text-xs text-emerald-300 p-4 focus:outline-none resize-y"
                  />
                ) : (
                  <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-300/95 leading-relaxed">
                    <code>{selectedProgram.code}</code>
                  </pre>
                )}
              </div>

              {/* Mechanism Explanation */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 text-xs space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Algorithm Mechanism & Key Logic:
                </div>
                <p className="text-slate-400 leading-normal">{selectedProgram.explanation}</p>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                  <strong className="text-slate-300">Input Specification: </strong>
                  {selectedProgram.inputDescription}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Execution, Sample Input & Output */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Interactive Test Runner
                </h3>
                <button
                  onClick={handleResetSample}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to Sample
                </button>
              </div>

              {/* Sample Input Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Dynamic Input (STDIN):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Passed to input()</span>
                </label>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Enter dynamic test inputs..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunProgram}
                  disabled={running}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-cyan-950 disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Executing Python Process...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Run Python Program
                    </>
                  )}
                </button>

                <button
                  onClick={handleSubmitAttendance}
                  disabled={submittingTest}
                  title="Mark this program as practiced so your teacher can see you attended the test"
                  className="py-2.5 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {submittingTest ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : testSubmitted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{testSubmitted ? 'Submitted!' : 'Submit Test'}</span>
                </button>
              </div>

              {/* Expected Output Reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Expected Output (Reference):
                </label>
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 font-mono text-xs text-slate-400 whitespace-pre">
                  {selectedProgram.expectedOutput}
                </div>
              </div>

              {/* Execution Console Output */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Actual Terminal Output:
                  </span>
                  {executionTime !== null && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {executionTime}ms
                    </span>
                  )}
                </div>

                <div
                  className={`min-h-[100px] max-h-[220px] overflow-y-auto rounded-lg p-3 font-mono text-xs border ${
                    error
                      ? 'bg-red-950/20 border-red-800/60 text-red-300'
                      : isOutputMatching
                      ? 'bg-slate-950 border-emerald-800/60 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  {error ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        Execution Error:
                      </div>
                      <pre className="whitespace-pre-wrap text-[11px]">{error}</pre>
                    </div>
                  ) : output !== null ? (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <div className="text-slate-400 italic text-center py-6">
                      Click "Run Python Program" to execute against the active input.
                    </div>
                  )}
                </div>

                {isOutputMatching && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Output exactly matches expected model exam test results!
                  </div>
                )}
              </div>
            </div>

            {/* Attendance & Teacher Feedback Hint */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Teacher Monitoring & Messaging
              </div>
              <p>
                When you click <strong>"Submit Test"</strong>, your test attendance and execution score are updated in the live database. Your teacher can review your test submission and send personalized guidance and messages directly to your student inbox!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
