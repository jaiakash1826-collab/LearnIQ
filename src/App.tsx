import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { DiagnosticAssessment } from './pages/DiagnosticAssessment';
import { VirtualLabPage } from './pages/VirtualLabPage';
import { ConceptGraphPage } from './pages/ConceptGraphPage';
import { AdaptivePractice } from './pages/AdaptivePractice';
import { MisconceptionsPage } from './pages/MisconceptionsPage';
import { LearningRecoveryPage } from './pages/LearningRecoveryPage';
import { RevisionPlannerPage } from './pages/RevisionPlannerPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AuthPage } from './pages/AuthPage';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Initializing LearnIQ Platform...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Student Routes */}
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/diagnostic" element={<DiagnosticAssessment />} />
          <Route path="/graph" element={<ConceptGraphPage />} />
          <Route path="/lab" element={<VirtualLabPage />} />
          <Route path="/practice" element={<AdaptivePractice />} />
          <Route path="/misconceptions" element={<MisconceptionsPage />} />
          <Route path="/recovery" element={<LearningRecoveryPage />} />
          <Route path="/revisions" element={<RevisionPlannerPage />} />
          <Route path="/daa-prep" element={<Navigate to="/dashboard" replace />} />
          <Route path="/daa" element={<Navigate to="/dashboard" replace />} />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/heatmap" element={<TeacherDashboard />} />
          <Route path="/teacher/interventions" element={<TeacherDashboard />} />
          <Route path="/teacher/students" element={<TeacherDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">LearnIQ</span>
            <span>•</span>
            <span>AI-Powered Adaptive Physics & Intelligent Virtual Laboratory</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Predict • Experiment • Observe • Explain • Diagnose • Recover • Verify
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
