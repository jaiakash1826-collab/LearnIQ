export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  avatar?: string;
  classId?: string;
  grade?: string;
  createdAt: string;
}

export interface Concept {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  order: number;
  prerequisites: string[]; // concept IDs
  standardFormulas: string[];
  unit: string;
  commonMisconceptions: {
    id: string;
    title: string;
    description: string;
    correctScientificPrinciple: string;
  }[];
  realWorldApplication: string;
}

export interface Question {
  id: string;
  conceptId: string;
  conceptName: string;
  title: string;
  questionText: string;
  type: 'multiple_choice' | 'numerical' | 'circuit_analysis';
  difficulty: 'easy' | 'medium' | 'hard';
  options?: { id: string; text: string }[];
  correctAnswer: string;
  tolerance?: number; // For numerical comparison
  unit?: string;
  expectedReasoning: string;
  misconceptionTested?: string;
  circuitConfig?: CircuitConfig;
  hint?: string;
}

export interface CircuitComponent {
  id: string;
  type: 'battery' | 'resistor' | 'bulb' | 'switch' | 'ammeter' | 'voltmeter' | 'wire';
  name: string;
  value: number; // Volts or Ohms
  unit: string;
  state?: 'open' | 'closed'; // For switch
  position?: { x: number; y: number };
}

export interface CircuitConfig {
  type: 'single' | 'series' | 'parallel' | 'combination';
  name: string;
  description: string;
  voltage: number; // Volts
  resistors: { id: string; name: string; resistance: number; isBulb?: boolean }[];
  switches: { id: string; name: string; isOpen: boolean; controlsBranch?: number }[];
  meters: {
    ammeterConnected: boolean;
    voltmeterConnected: boolean;
    voltmeterTarget?: 'total' | 'r1' | 'r2' | 'r3';
  };
}

export interface CircuitCalculationResult {
  voltage: number;
  totalResistance: number;
  totalCurrent: number;
  totalPower: number;
  isCircuitClosed: boolean;
  branchResults: {
    id: string;
    resistance: number;
    voltageDrop: number;
    current: number;
    power: number;
    bulbBrightnessPct: number; // 0 to 100%
  }[];
  assumptions: string[];
  explanation: string;
}

export interface ThinkTraceEvaluation {
  answerCorrect: boolean;
  reasoningQuality: 'sound' | 'partially_sound' | 'flawed' | 'memorized_guess';
  reasoningCategory: string;
  identifiedError?: string;
  possibleMisconception?: string;
  confidenceOfDiagnosis: number; // 0.0 to 1.0
  explanation: string;
  correctScientificExplanation: string;
  recommendedNextAction: 'recovery_activity' | 'verification' | 'prerequisite_revisit' | 'advance';
  insufficientEvidence: boolean;
  evidenceQuote?: string;
}

export interface MisconceptionRecord {
  id: string;
  studentId: string;
  conceptId: string;
  conceptName: string;
  misconceptionTitle: string;
  misconceptionDescription: string;
  studentOriginalResponse: string;
  reasoningEvidence: string;
  status: 'suspected' | 'under_verification' | 'confirmed' | 'improving' | 'resolved';
  occurrences: number;
  firstIdentifiedAt: string;
  lastTestedAt: string;
  resolvedAt?: string;
  verificationAttempts: {
    date: string;
    questionId?: string;
    passed: boolean;
    reasoningQuality: string;
  }[];
}

export interface LearnerConceptMastery {
  conceptId: string;
  conceptName: string;
  masteryScore: number; // 0 to 100
  status: 'weak' | 'developing' | 'strong';
  totalAttempts: number;
  correctAttempts: number;
  soundReasoningCount: number;
  lastPracticedAt: string;
  revisionDueDate: string;
  hasActiveMisconception: boolean;
  hasPrerequisiteGap: boolean;
  confidenceCalibration: {
    correctAndConfident: number;
    correctAndUncertain: number;
    incorrectAndConfident: number;
    incorrectAndUncertain: number;
  };
}

export interface LearnerModel {
  studentId: string;
  studentName: string;
  overallMastery: number; // 0 to 100
  diagnosticCompleted: boolean;
  diagnosticScore?: number;
  conceptMastery: Record<string, LearnerConceptMastery>;
  activeMisconceptionsCount: number;
  resolvedMisconceptionsCount: number;
  experimentsCompletedCount: number;
  recoveryActivitiesCompletedCount: number;
  streakDays: number;
  lastActiveAt: string;
}

export interface RecoveryActivity {
  id: string;
  studentId: string;
  conceptId: string;
  conceptName: string;
  misconceptionAddressed?: string;
  title: string;
  status: 'assigned' | 'in_progress' | 'completed';
  createdAt: string;
  completedAt?: string;
  steps: {
    stepNumber: number;
    title: string;
    type: 'identify_gap' | 'concept_explainer' | 'visual_simulation' | 'guided_practice' | 'application_challenge' | 'verification';
    content: string;
    circuitPreset?: CircuitConfig;
    question?: Question;
    completed: boolean;
    studentResponse?: string;
    aiFeedback?: string;
  }[];
}

export interface RevisionItem {
  id: string;
  studentId: string;
  conceptId: string;
  conceptName: string;
  dueDate: string;
  status: 'due' | 'upcoming' | 'overdue' | 'completed';
  recommendedQuestionsCount: number;
  lastPracticedDate: string;
  masteryLevel: number;
}

export interface TeacherAnalytics {
  totalStudents: number;
  classAverageMastery: number;
  conceptPerformance: {
    conceptId: string;
    conceptName: string;
    averageMastery: number;
    studentsNeedingHelp: number;
    commonMisconceptions: string[];
    status: 'weak' | 'developing' | 'strong';
  }[];
  misconceptionHeatmap: {
    conceptId: string;
    conceptName: string;
    affectedStudentCount: number;
    affectedStudentPct: number;
    severity: 'critical' | 'moderate' | 'low';
    primaryMisconception: string;
    sampleStudentReasoning: string[];
    suggestedClassActivity: string;
  }[];
  studentsRequiringSupport: {
    studentId: string;
    studentName: string;
    overallMastery: number;
    weakestConcept: string;
    activeMisconception: string;
    streakDays: number;
    lastActive: string;
  }[];
  teacherRecommendations: {
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionablePlan: string;
    affectedConcepts: string[];
  }[];
}

export interface TeacherMessage {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subject: string;
  message: string;
  testScoreInfo?: string;
  createdAt: string;
  read: boolean;
}
