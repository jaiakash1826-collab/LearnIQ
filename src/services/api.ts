import {
  User,
  Concept,
  Question,
  LearnerModel,
  MisconceptionRecord,
  CircuitConfig,
  CircuitCalculationResult,
  ThinkTraceEvaluation,
  RecoveryActivity,
  RevisionItem,
  TeacherAnalytics,
  TeacherMessage,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login(email: string, role: 'student' | 'teacher'): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    return res.json();
  },

  async register(data: { name: string; email: string; role: 'student' | 'teacher'; grade?: string }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMe(userId?: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: userId ? { 'x-user-id': userId } : {},
    });
    return res.json();
  },

  // Concepts
  async getConcepts(): Promise<{ concepts: Concept[] }> {
    const res = await fetch(`${API_BASE}/concepts`);
    return res.json();
  },

  async getConceptById(id: string): Promise<{ concept: Concept }> {
    const res = await fetch(`${API_BASE}/concepts/${id}`);
    return res.json();
  },

  async getConceptGraph(studentId: string): Promise<{
    nodes: (Concept & {
      masteryScore: number;
      status: 'weak' | 'developing' | 'strong';
      hasActiveMisconception: boolean;
      hasPrerequisiteGap: boolean;
    })[];
    edges: { source: string; target: string; isPrereqGap: boolean }[];
  }> {
    const res = await fetch(`${API_BASE}/concepts/graph/view?studentId=${studentId}`);
    return res.json();
  },

  // Diagnostic
  async getDiagnosticAssessment(): Promise<{
    chapter: string;
    totalQuestions: number;
    questions: Question[];
  }> {
    const res = await fetch(`${API_BASE}/diagnostic`);
    return res.json();
  },

  async submitDiagnostic(
    studentId: string,
    answers: { questionId: string; answer: string; confidence?: string; explanation?: string }[]
  ): Promise<{
    report: {
      score: number;
      totalQuestions: number;
      percentage: number;
      conceptBreakdown: Record<string, { correct: number; total: number; score: number }>;
    };
    updatedModel: LearnerModel;
    recommendation: { weakestConcept: string; conceptId: string; suggestedAction: string };
  }> {
    const res = await fetch(`${API_BASE}/diagnostic/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, answers }),
    });
    return res.json();
  },

  // Circuit Lab & Physics
  async calculateCircuit(config: CircuitConfig): Promise<CircuitCalculationResult> {
    const res = await fetch(`${API_BASE}/circuits/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async recordCircuitExperiment(data: {
    studentId: string;
    circuitType: string;
    prediction: string;
    studentExplanation: string;
    confidence: string;
    circuitConfig: CircuitConfig;
    conceptName?: string;
  }): Promise<{
    experiment: any;
    calculatedResult: CircuitCalculationResult;
    diagnosis: ThinkTraceEvaluation;
  }> {
    const res = await fetch(`${API_BASE}/circuits/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getCircuitExperiments(studentId: string): Promise<{ experiments: any[] }> {
    const res = await fetch(`${API_BASE}/circuits/experiments/${studentId}`);
    return res.json();
  },

  async testPhysicsBenchmarks(): Promise<{
    case1: boolean;
    case2: boolean;
    case3: boolean;
    case4: boolean;
    allPassed: boolean;
    details: string[];
  }> {
    const res = await fetch(`${API_BASE}/circuits/physics-test`);
    return res.json();
  },

  // Practice & Attempts
  async getNextQuestion(studentId: string, conceptId?: string): Promise<{ question: Question; source: string }> {
    const url = conceptId
      ? `${API_BASE}/questions/next?studentId=${studentId}&conceptId=${conceptId}`
      : `${API_BASE}/questions/next?studentId=${studentId}`;
    const res = await fetch(url);
    return res.json();
  },

  async submitAttempt(data: {
    studentId: string;
    questionId: string;
    answer: string;
    explanation?: string;
    confidence?: string;
  }): Promise<{
    isCorrect: boolean;
    correctAnswer: string;
    diagnosis: ThinkTraceEvaluation;
    updatedMastery: any;
    overallMastery: number;
  }> {
    const res = await fetch(`${API_BASE}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ThinkTrace AI
  async evaluateReasoning(payload: {
    questionText: string;
    correctAnswer: string;
    studentAnswer: string;
    studentExplanation: string;
    expectedReasoning: string;
    conceptName: string;
  }): Promise<ThinkTraceEvaluation> {
    const res = await fetch(`${API_BASE}/ai/evaluate-reasoning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Learner Model
  async getLearnerMastery(studentId: string): Promise<{ model: LearnerModel }> {
    const res = await fetch(`${API_BASE}/learners/${studentId}/mastery`);
    return res.json();
  },

  async getNextRecommendedActivity(studentId: string): Promise<{
    type: string;
    title: string;
    conceptId?: string;
    conceptName?: string;
    actionUrl: string;
    reason: string;
  }> {
    const res = await fetch(`${API_BASE}/learners/${studentId}/next-activity`);
    return res.json();
  },

  // Misconceptions
  async getMisconceptions(studentId: string): Promise<{ misconceptions: MisconceptionRecord[] }> {
    const res = await fetch(`${API_BASE}/misconceptions/${studentId}`);
    return res.json();
  },

  async updateMisconceptionStatus(
    id: string,
    status: MisconceptionRecord['status'],
    verificationResult?: { passed: boolean; reasoningQuality: string }
  ): Promise<{ updated: MisconceptionRecord }> {
    const res = await fetch(`${API_BASE}/misconceptions/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, verificationResult }),
    });
    return res.json();
  },

  // Recovery
  async getRecoveryActivities(studentId: string): Promise<{ activities: RecoveryActivity[] }> {
    const res = await fetch(`${API_BASE}/recovery/${studentId}`);
    return res.json();
  },

  async startRecovery(studentId: string, conceptId: string, misconceptionTitle?: string): Promise<{ recovery: RecoveryActivity }> {
    const res = await fetch(`${API_BASE}/recovery/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, conceptId, misconceptionTitle }),
    });
    return res.json();
  },

  async completeRecoveryStep(data: {
    studentId: string;
    recoveryId: string;
    stepNumber: number;
    studentResponse?: string;
    passed?: boolean;
  }): Promise<{ activity: RecoveryActivity; allDone: boolean }> {
    const res = await fetch(`${API_BASE}/recovery/complete-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Revision Planner
  async getRevisions(studentId: string): Promise<{ revisions: RevisionItem[] }> {
    const res = await fetch(`${API_BASE}/revisions/${studentId}`);
    return res.json();
  },

  async completeRevision(revisionId: string): Promise<{ result: RevisionItem }> {
    const res = await fetch(`${API_BASE}/revisions/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionId }),
    });
    return res.json();
  },

  // Teacher Intelligence
  async getTeacherDashboard(): Promise<TeacherAnalytics & { classStudents: any[] }> {
    const res = await fetch(`${API_BASE}/teachers/dashboard`);
    return res.json();
  },

  async getTeacherStudents(): Promise<{ students: any[] }> {
    const res = await fetch(`${API_BASE}/teachers/students`);
    return res.json();
  },

  async getMisconceptionHeatmap(): Promise<{ heatmap: any[] }> {
    const res = await fetch(`${API_BASE}/teachers/misconceptions`);
    return res.json();
  },

  async getTeacherInterventions(): Promise<{ recommendations: any[] }> {
    const res = await fetch(`${API_BASE}/teachers/interventions`);
    return res.json();
  },

  // Messaging between Teacher and Student
  async sendMessage(data: {
    teacherId: string;
    teacherName: string;
    studentId: string;
    studentName: string;
    subject: string;
    message: string;
    testScoreInfo?: string;
  }): Promise<{ message: TeacherMessage }> {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getStudentMessages(studentId: string): Promise<{ messages: TeacherMessage[] }> {
    const res = await fetch(`${API_BASE}/messages/student/${studentId}`);
    return res.json();
  },

  async getTeacherMessages(teacherId: string): Promise<{ messages: TeacherMessage[] }> {
    const res = await fetch(`${API_BASE}/messages/teacher/${teacherId}`);
    return res.json();
  },

  async markMessageRead(messageId: string): Promise<{ message: TeacherMessage }> {
    const res = await fetch(`${API_BASE}/messages/${messageId}/read`, {
      method: 'POST',
    });
    return res.json();
  },

  // DAA Model Exam Runner & Practice
  async runDaaProgram(programId: number, input: string, customCode?: string): Promise<{
    output: string;
    error: string | null;
    executionTimeMs: number;
  }> {
    const res = await fetch(`${API_BASE}/daa/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId, input, customCode }),
    });
    return res.json();
  },

  async submitDaaPractice(studentId: string, programId: number, programTitle: string, passed: boolean): Promise<{
    success: boolean;
  }> {
    const res = await fetch(`${API_BASE}/daa/submit-practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, programId, programTitle, passed }),
    });
    return res.json();
  },
};

