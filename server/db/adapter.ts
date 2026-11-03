import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import {
  User,
  Concept,
  Question,
  LearnerModel,
  MisconceptionRecord,
  RecoveryActivity,
  RevisionItem,
  TeacherMessage,
} from '../types.js';
import {
  CONCEPTS,
  DIAGNOSTIC_QUESTIONS,
  ADAPTIVE_QUESTIONS_POOL,
} from '../data/seedData.js';

interface CircuitExperimentRecord {
  id: string;
  studentId: string;
  createdAt: string;
  circuitType: string;
  prediction: string;
  explanation: string;
  confidence: string;
  calculatedResult: any;
  diagnosis: any;
}

interface AttemptRecord {
  id: string;
  studentId: string;
  questionId: string;
  conceptId: string;
  answer: string;
  isCorrect: boolean;
  explanation: string;
  confidence: string;
  diagnosis: any;
  createdAt: string;
}

interface DiagnosticAttemptRecord {
  id: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  conceptBreakdown: Record<string, { correct: number; total: number; score: number }>;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  concepts: Concept[];
  questions: Question[];
  learnerModels: Record<string, LearnerModel>;
  misconceptions: MisconceptionRecord[];
  attempts: AttemptRecord[];
  diagnosticAttempts: DiagnosticAttemptRecord[];
  circuitExperiments: CircuitExperimentRecord[];
  recoveryActivities: RecoveryActivity[];
  revisionSchedules: RevisionItem[];
  messages: TeacherMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'db_store.json');

const StateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    data: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const StateModel = mongoose.models.LearnIQStore || mongoose.model('LearnIQStore', StateSchema);

class DatabaseAdapter {
  private isMongoConnected: boolean = false;
  private memoryData!: DatabaseSchema;

  constructor() {
    this.initStore();
  }

  private initStore() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.warn('Could not create .data directory, using in-memory store:', e);
      }
    }

    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        this.memoryData = JSON.parse(raw);
        // Ensure standard curriculum and questions are always current
        this.memoryData.concepts = [...CONCEPTS];
        this.memoryData.questions = [...DIAGNOSTIC_QUESTIONS, ...ADAPTIVE_QUESTIONS_POOL];
        // Clean out any legacy demo users if previously cached
        this.memoryData.users = (this.memoryData.users || []).filter(
          (u) => !u.id.startsWith('student-arjun') && !u.id.startsWith('student-priya') && !u.id.startsWith('teacher-anita')
        );
        delete this.memoryData.learnerModels?.['student-arjun'];
        delete this.memoryData.learnerModels?.['student-priya'];
        console.log('[LearnIQ Database] Initialized clean persistent data store.');
        return;
      } catch (err) {
        console.error('[LearnIQ Database] Error reading disk store, re-seeding:', err);
      }
    }

    // Seed clean initial structure: curriculum only, NO dummy users or fake attempts
    this.memoryData = {
      users: [],
      concepts: [...CONCEPTS],
      questions: [...DIAGNOSTIC_QUESTIONS, ...ADAPTIVE_QUESTIONS_POOL],
      learnerModels: {},
      misconceptions: [],
      attempts: [],
      diagnosticAttempts: [],
      circuitExperiments: [],
      recoveryActivities: [],
      revisionSchedules: [],
      messages: [],
    };

    if (!this.memoryData.messages) {
      this.memoryData.messages = [];
    }

    this.persist();
  }

  public resetAllData(): void {
    this.memoryData = {
      users: [],
      concepts: [...CONCEPTS],
      questions: [...DIAGNOSTIC_QUESTIONS, ...ADAPTIVE_QUESTIONS_POOL],
      learnerModels: {},
      misconceptions: [],
      attempts: [],
      diagnosticAttempts: [],
      circuitExperiments: [],
      recoveryActivities: [],
      revisionSchedules: [],
      messages: [],
    };
    this.persist();
    if (this.isMongoConnected) {
      StateModel.deleteOne({ key: 'main' }).catch(() => {});
    }
    console.log('[LearnIQ Database] All user data, attempts, and experiments wiped clean.');
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[LearnIQ Database] Notice: Disk write skipped or in read-only environment:', e);
    }

    if (this.isMongoConnected) {
      StateModel.updateOne({ key: 'main' }, { data: this.memoryData }, { upsert: true }).catch((err: any) => {
        console.warn('[LearnIQ Database] MongoDB async sync error:', err.message);
      });
    }
  }

  private resolveMongoUri(): string | null {
    let raw = (process.env.MONGODB_URI || '').trim();

    // 1. If empty or quotes, fall back to known configured credentials if present
    if (!raw || raw === '""' || raw === "''") {
      return 'mongodb://user_4584fam7b:p4584fam7b@db01.dbhost.dev:5050/db_4584fam7b?authSource=db_4584fam7b';
    }

    // 2. If it is already a valid MongoDB URI
    if (raw.startsWith('mongodb://') || raw.startsWith('mongodb+srv://')) {
      return raw;
    }

    // 3. If raw is in key-value text format: "Host: ... Port: ... Database: ... Username: ... Password: ..."
    const hostMatch = raw.match(/Host:\s*([^\s,;]+)/i);
    const portMatch = raw.match(/Port:\s*(\d+)/i);
    const dbMatch = raw.match(/Database:\s*([^\s,;]+)/i);
    const userMatch = raw.match(/Username:\s*([^\s,;]+)/i);
    const passMatch = raw.match(/Password:\s*([^\s,;]+)/i);

    if (hostMatch && userMatch && passMatch) {
      const host = hostMatch[1];
      const port = portMatch ? portMatch[1] : '27017';
      const database = dbMatch ? dbMatch[1] : 'admin';
      const user = encodeURIComponent(userMatch[1]);
      const pass = encodeURIComponent(passMatch[1]);
      return `mongodb://${user}:${pass}@${host}:${port}/${database}?authSource=${database}`;
    }

    // 4. If raw is "user:pass@host:port/db" without mongodb:// scheme
    if (raw.includes('@') && (raw.includes(':') || raw.includes('/'))) {
      return `mongodb://${raw}`;
    }

    // 5. If nothing matched, but user:pass env vars exist or fallback credentials can be used
    if (raw.includes('db01.dbhost.dev') || raw.includes('db_4584fam7b')) {
      return 'mongodb://user_4584fam7b:p4584fam7b@db01.dbhost.dev:5050/db_4584fam7b?authSource=db_4584fam7b';
    }

    return null;
  }

  public async connect(): Promise<void> {
    const mongoUri = this.resolveMongoUri();
    const isValidScheme = Boolean(
      mongoUri && (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://'))
    );

    if (isValidScheme && mongoUri) {
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        this.isMongoConnected = true;
        console.log('[LearnIQ Database] Successfully connected to MongoDB database (db_4584fam7b).');

        const existingDoc = await StateModel.findOne({ key: 'main' });
        if (existingDoc && existingDoc.data) {
          this.memoryData = existingDoc.data as DatabaseSchema;
          this.memoryData.concepts = [...CONCEPTS];
          this.memoryData.questions = [...DIAGNOSTIC_QUESTIONS, ...ADAPTIVE_QUESTIONS_POOL];
          if (!this.memoryData.messages) this.memoryData.messages = [];
          console.log(
            `[LearnIQ Database] Loaded ${this.memoryData.users.length} users and ${this.memoryData.messages.length} messages from MongoDB.`
          );
        } else {
          await StateModel.create({ key: 'main', data: this.memoryData });
          console.log('[LearnIQ Database] Seeded initial data into MongoDB.');
        }
      } catch (err: any) {
        console.info(
          '[LearnIQ Database] MongoDB connection inactive. Operating in persistent local storage mode:',
          err?.message || err
        );
        this.isMongoConnected = false;
      }
    } else {
      console.log(
        '[LearnIQ Database] Operating in Development Storage Adapter (Set MONGODB_URI in environment to connect MongoDB Atlas). Persistent disk state enabled.'
      );
      this.isMongoConnected = false;
    }
  }

  // Users
  public getUsers(): User[] {
    return this.memoryData.users;
  }

  public getUserById(id: string): User | undefined {
    return this.memoryData.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.memoryData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.memoryData.users.push(user);
    this.persist();
    return user;
  }

  // Concepts
  public getConcepts(): Concept[] {
    return this.memoryData.concepts;
  }

  public getConceptById(id: string): Concept | undefined {
    return this.memoryData.concepts.find((c) => c.id === id);
  }

  // Questions
  public getQuestions(): Question[] {
    return this.memoryData.questions;
  }

  public getQuestionById(id: string): Question | undefined {
    return this.memoryData.questions.find((q) => q.id === id);
  }

  public getDiagnosticQuestions(): Question[] {
    return DIAGNOSTIC_QUESTIONS;
  }

  public addQuestion(question: Question): Question {
    this.memoryData.questions.push(question);
    this.persist();
    return question;
  }

  // Learner Model
  public getLearnerModel(studentId: string): LearnerModel {
    if (!this.memoryData.learnerModels[studentId]) {
      const user = this.getUserById(studentId);
      const studentName = user ? user.name : 'Student';
      const newModel: LearnerModel = {
        studentId,
        studentName,
        overallMastery: 0,
        diagnosticCompleted: false,
        conceptMastery: {},
        activeMisconceptionsCount: 0,
        resolvedMisconceptionsCount: 0,
        experimentsCompletedCount: 0,
        recoveryActivitiesCompletedCount: 0,
        streakDays: 1,
        lastActiveAt: new Date().toISOString(),
      };

      // Initialize all concepts with 0 mastery (Clean slate)
      CONCEPTS.forEach((c) => {
        newModel.conceptMastery[c.id] = {
          conceptId: c.id,
          conceptName: c.name,
          masteryScore: 0,
          status: 'weak',
          totalAttempts: 0,
          correctAttempts: 0,
          soundReasoningCount: 0,
          lastPracticedAt: new Date().toISOString(),
          revisionDueDate: new Date().toISOString().split('T')[0],
          hasActiveMisconception: false,
          hasPrerequisiteGap: false,
          confidenceCalibration: {
            correctAndConfident: 0,
            correctAndUncertain: 0,
            incorrectAndConfident: 0,
            incorrectAndUncertain: 0,
          },
        };
      });

      this.memoryData.learnerModels[studentId] = newModel;
      this.persist();
    }
    return this.memoryData.learnerModels[studentId];
  }

  public updateLearnerModel(studentId: string, updates: Partial<LearnerModel>): LearnerModel {
    const current = this.getLearnerModel(studentId);
    const updated = { ...current, ...updates, lastActiveAt: new Date().toISOString() };
    this.memoryData.learnerModels[studentId] = updated;
    this.persist();
    return updated;
  }

  /**
   * Mastery update heuristic as specified in Master Prompt section 17:
   * New mastery = 0.7 * Previous mastery + 0.3 * Evidence score
   */
  public recordConceptAttempt(
    studentId: string,
    conceptId: string,
    isCorrect: boolean,
    reasoningQuality: string,
    confidence: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): LearnerModel {
    const model = this.getLearnerModel(studentId);
    const cm = model.conceptMastery[conceptId] || {
      conceptId,
      conceptName: CONCEPTS.find((c) => c.id === conceptId)?.name || conceptId,
      masteryScore: 0,
      status: 'weak',
      totalAttempts: 0,
      correctAttempts: 0,
      soundReasoningCount: 0,
      lastPracticedAt: new Date().toISOString(),
      revisionDueDate: new Date().toISOString().split('T')[0],
      hasActiveMisconception: false,
      hasPrerequisiteGap: false,
      confidenceCalibration: {
        correctAndConfident: 0,
        correctAndUncertain: 0,
        incorrectAndConfident: 0,
        incorrectAndUncertain: 0,
      },
    };

    cm.totalAttempts += 1;
    if (isCorrect) cm.correctAttempts += 1;
    if (reasoningQuality === 'sound') cm.soundReasoningCount += 1;

    // Calculate evidence score (0-100)
    let evidence = 0;
    if (isCorrect) {
      evidence = reasoningQuality === 'sound' ? 95 : reasoningQuality === 'partially_sound' ? 75 : 55;
    } else {
      evidence = reasoningQuality === 'partially_sound' ? 35 : 15;
    }

    // Weight by difficulty
    if (difficulty === 'hard') evidence = Math.min(100, evidence * 1.1);
    if (difficulty === 'easy' && isCorrect) evidence = Math.max(50, evidence * 0.9);

    // Apply configurable formula: New mastery = 0.7 * Previous + 0.3 * Evidence
    const previous = cm.masteryScore;
    cm.masteryScore = Math.round(0.7 * previous + 0.3 * evidence);

    // Update status
    if (cm.masteryScore >= 75) cm.status = 'strong';
    else if (cm.masteryScore >= 45) cm.status = 'developing';
    else cm.status = 'weak';

    cm.lastPracticedAt = new Date().toISOString();

    // Spaced repetition schedule based on mastery
    const daysToAdd =
      cm.masteryScore >= 90 ? 14 : cm.masteryScore >= 80 ? 7 : cm.masteryScore >= 60 ? 4 : cm.masteryScore >= 40 ? 2 : 1;
    const dueDate = new Date(Date.now() + daysToAdd * 86400000).toISOString().split('T')[0];
    cm.revisionDueDate = dueDate;

    // Confidence calibration matrix
    const isConfident = confidence === 'very_confident';
    if (isCorrect && isConfident) cm.confidenceCalibration.correctAndConfident += 1;
    else if (isCorrect && !isConfident) cm.confidenceCalibration.correctAndUncertain += 1;
    else if (!isCorrect && isConfident) cm.confidenceCalibration.incorrectAndConfident += 1;
    else cm.confidenceCalibration.incorrectAndUncertain += 1;

    // Prerequisite check: if mastery is weak, check prerequisites
    const concept = CONCEPTS.find((c) => c.id === conceptId);
    if (concept && concept.prerequisites.length > 0 && cm.masteryScore < 50) {
      const hasWeakPrereq = concept.prerequisites.some((pId) => {
        const pScore = model.conceptMastery[pId]?.masteryScore ?? 0;
        return pScore < 50;
      });
      cm.hasPrerequisiteGap = hasWeakPrereq;
    } else {
      cm.hasPrerequisiteGap = false;
    }

    model.conceptMastery[conceptId] = cm;

    // Update overall mastery
    const scores = Object.values(model.conceptMastery).map((c) => c.masteryScore);
    if (scores.length > 0) {
      model.overallMastery = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    this.persist();
    return model;
  }

  // Misconceptions
  public getMisconceptions(studentId?: string): MisconceptionRecord[] {
    if (studentId) {
      return this.memoryData.misconceptions.filter((m) => m.studentId === studentId);
    }
    return this.memoryData.misconceptions;
  }

  public recordMisconception(record: Omit<MisconceptionRecord, 'id'>): MisconceptionRecord {
    // Check if an active record already exists for this student & concept
    const existing = this.memoryData.misconceptions.find(
      (m) =>
        m.studentId === record.studentId &&
        m.conceptId === record.conceptId &&
        m.status !== 'resolved'
    );

    if (existing) {
      existing.occurrences += 1;
      existing.lastTestedAt = new Date().toISOString();
      if (existing.occurrences >= 2) {
        existing.status = 'confirmed';
      }
      this.persist();
      return existing;
    }

    const newRecord: MisconceptionRecord = {
      ...record,
      id: `misc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };

    this.memoryData.misconceptions.push(newRecord);

    // Update learner model flag
    const model = this.getLearnerModel(record.studentId);
    if (model.conceptMastery[record.conceptId]) {
      model.conceptMastery[record.conceptId].hasActiveMisconception = true;
    }
    model.activeMisconceptionsCount = this.memoryData.misconceptions.filter(
      (m) => m.studentId === record.studentId && m.status !== 'resolved'
    ).length;

    this.persist();
    return newRecord;
  }

  public updateMisconceptionStatus(
    id: string,
    status: MisconceptionRecord['status'],
    verificationResult?: { passed: boolean; reasoningQuality: string }
  ): MisconceptionRecord | null {
    const item = this.memoryData.misconceptions.find((m) => m.id === id);
    if (!item) return null;

    item.status = status;
    item.lastTestedAt = new Date().toISOString();
    if (verificationResult) {
      item.verificationAttempts.push({
        date: new Date().toISOString(),
        passed: verificationResult.passed,
        reasoningQuality: verificationResult.reasoningQuality,
      });
    }

    if (status === 'resolved') {
      item.resolvedAt = new Date().toISOString();
      const model = this.getLearnerModel(item.studentId);
      if (model.conceptMastery[item.conceptId]) {
        // Check if there are other active ones
        const remaining = this.memoryData.misconceptions.filter(
          (m) => m.studentId === item.studentId && m.conceptId === item.conceptId && m.status !== 'resolved' && m.id !== id
        );
        if (remaining.length === 0) {
          model.conceptMastery[item.conceptId].hasActiveMisconception = false;
        }
      }
      model.resolvedMisconceptionsCount += 1;
      model.activeMisconceptionsCount = Math.max(0, model.activeMisconceptionsCount - 1);
    }

    this.persist();
    return item;
  }

  // Circuit Experiments
  public recordCircuitExperiment(experiment: Omit<CircuitExperimentRecord, 'id' | 'createdAt'>): CircuitExperimentRecord {
    const record: CircuitExperimentRecord = {
      ...experiment,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.memoryData.circuitExperiments.push(record);

    const model = this.getLearnerModel(experiment.studentId);
    model.experimentsCompletedCount += 1;

    this.persist();
    return record;
  }

  public getCircuitExperiments(studentId: string): CircuitExperimentRecord[] {
    return this.memoryData.circuitExperiments.filter((e) => e.studentId === studentId);
  }

  // Diagnostic Submissions
  public recordDiagnostic(
    studentId: string,
    answers: { questionId: string; answer: string; confidence?: string; explanation?: string }[]
  ): DiagnosticAttemptRecord {
    let score = 0;
    const conceptBreakdown: Record<string, { correct: number; total: number; score: number }> = {};

    CONCEPTS.forEach((c) => {
      conceptBreakdown[c.id] = { correct: 0, total: 0, score: 0 };
    });

    const model = this.getLearnerModel(studentId);

    answers.forEach((ans) => {
      const q = DIAGNOSTIC_QUESTIONS.find((dq) => dq.id === ans.questionId);
      if (!q) return;

      const isCorrect = String(ans.answer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      if (isCorrect) score += 1;

      if (!conceptBreakdown[q.conceptId]) {
        conceptBreakdown[q.conceptId] = { correct: 0, total: 0, score: 0 };
      }
      conceptBreakdown[q.conceptId].total += 1;
      if (isCorrect) conceptBreakdown[q.conceptId].correct += 1;

      // Update concept mastery in model
      this.recordConceptAttempt(
        studentId,
        q.conceptId,
        isCorrect,
        isCorrect ? 'sound' : 'flawed',
        ans.confidence || 'somewhat_confident',
        q.difficulty
      );
    });

    // Compute concept percentages
    Object.keys(conceptBreakdown).forEach((cid) => {
      const b = conceptBreakdown[cid];
      b.score = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
    });

    const percentage = Math.round((score / DIAGNOSTIC_QUESTIONS.length) * 100);

    const record: DiagnosticAttemptRecord = {
      id: `diag-${Date.now()}`,
      studentId,
      score,
      totalQuestions: DIAGNOSTIC_QUESTIONS.length,
      percentage,
      conceptBreakdown,
      createdAt: new Date().toISOString(),
    };

    this.memoryData.diagnosticAttempts.push(record);
    model.diagnosticCompleted = true;
    model.diagnosticScore = score;
    this.updateLearnerModel(studentId, model);

    this.persist();
    return record;
  }

  // Recovery Activities
  public getRecoveryActivities(studentId: string): RecoveryActivity[] {
    return this.memoryData.recoveryActivities.filter((r) => r.studentId === studentId);
  }

  public saveRecoveryActivity(activity: RecoveryActivity): RecoveryActivity {
    const existingIndex = this.memoryData.recoveryActivities.findIndex((r) => r.id === activity.id);
    if (existingIndex >= 0) {
      this.memoryData.recoveryActivities[existingIndex] = activity;
    } else {
      this.memoryData.recoveryActivities.push(activity);
    }
    this.persist();
    return activity;
  }

  // Revision Schedules
  public getRevisionSchedules(studentId: string): RevisionItem[] {
    return this.memoryData.revisionSchedules.filter((r) => r.studentId === studentId);
  }

  public completeRevision(revisionId: string): RevisionItem | null {
    const item = this.memoryData.revisionSchedules.find((r) => r.id === revisionId);
    if (!item) return null;
    item.status = 'completed';
    this.persist();
    return item;
  }

  // Messages between Teacher and Student
  public sendMessage(msg: Omit<TeacherMessage, 'id' | 'createdAt' | 'read'>): TeacherMessage {
    if (!this.memoryData.messages) {
      this.memoryData.messages = [];
    }
    const newMsg: TeacherMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.memoryData.messages.push(newMsg);
    this.persist();
    return newMsg;
  }

  public getMessagesForStudent(studentId: string): TeacherMessage[] {
    if (!this.memoryData.messages) return [];
    return this.memoryData.messages
      .filter((m) => m.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getMessagesByTeacher(teacherId: string): TeacherMessage[] {
    if (!this.memoryData.messages) return [];
    return this.memoryData.messages
      .filter((m) => m.teacherId === teacherId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markMessageRead(messageId: string): TeacherMessage | null {
    if (!this.memoryData.messages) return null;
    const msg = this.memoryData.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    msg.read = true;
    this.persist();
    return msg;
  }

  // Real Dynamic Teacher Analytics: strictly based on actual registered students and real attempts
  public getTeacherAnalytics(): any {
    const students = this.memoryData.users.filter((u) => u.role === 'student');

    if (students.length === 0) {
      return {
        totalStudents: 0,
        classAverageMastery: 0,
        conceptPerformance: CONCEPTS.map((c) => ({
          conceptId: c.id,
          conceptName: c.name,
          averageMastery: 0,
          studentsNeedingHelp: 0,
          commonMisconceptions: c.commonMisconceptions.map((m) => m.title),
          status: 'weak' as const,
        })),
        misconceptionHeatmap: [],
        studentsRequiringSupport: [],
        teacherRecommendations: [
          {
            id: 'rec-init',
            priority: 'medium' as const,
            title: 'Invite Students to Class 10 Electricity',
            description: 'No registered student data found in the platform.',
            actionablePlan:
              'Have students register and complete the Diagnostic Assessment to populate live conceptual analytics.',
            affectedConcepts: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'],
          },
        ],
        classStudents: [],
      };
    }

    // Compute live class students summary
    const classStudents = students.map((s) => {
      const model = this.memoryData.learnerModels[s.id];
      const mastery = model ? model.overallMastery : 0;
      const testAttended = model ? (model.diagnosticCompleted || model.overallMastery > 0) : false;
      const diagnosticScore = model?.diagnosticScore ?? (testAttended ? mastery : undefined);

      // Find student's weakest concept
      let weakestConcept = 'Not assessed';
      if (model && Object.keys(model.conceptMastery).length > 0) {
        const sorted = Object.entries(model.conceptMastery).sort(
          (a, b) => a[1].masteryScore - b[1].masteryScore
        );
        weakestConcept = sorted[0]?.[1]?.conceptName || 'Electricity';
      }

      // Find active misconception for this student
      const activeMisc = this.memoryData.misconceptions.find(
        (m) => m.studentId === s.id && m.status !== 'resolved'
      );

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        mastery,
        testAttended,
        diagnosticScore,
        weakestConcept,
        activeMisconception: activeMisc ? activeMisc.misconceptionTitle : 'None recorded',
        streak: model?.streakDays ?? 1,
        lastActive: model?.lastActiveAt ? new Date(model.lastActiveAt).toLocaleString() : 'Recently',
      };
    });

    const totalMastery = classStudents.reduce((sum, s) => sum + s.mastery, 0);
    const avgMastery = Math.round(totalMastery / students.length);

    // Concept performance aggregation from real models
    const conceptPerformance = CONCEPTS.map((c) => {
      let totalScore = 0;
      let needHelp = 0;

      students.forEach((s) => {
        const studentModel = this.memoryData.learnerModels[s.id];
        const cMastery = studentModel?.conceptMastery[c.id]?.masteryScore ?? 0;
        totalScore += cMastery;
        if (cMastery < 50) needHelp += 1;
      });

      const averageMastery = Math.round(totalScore / students.length);
      const status: 'weak' | 'developing' | 'strong' =
        averageMastery >= 70 ? 'strong' : averageMastery >= 45 ? 'developing' : 'weak';

      return {
        conceptId: c.id,
        conceptName: c.name,
        averageMastery,
        studentsNeedingHelp: needHelp,
        commonMisconceptions: c.commonMisconceptions.map((m) => m.title),
        status,
      };
    });

    // Dynamic Classroom Misconception Heatmap based on REAL recorded misconceptions
    const misconceptionHeatmap = CONCEPTS.map((c) => {
      const relevantMisconceptions = this.memoryData.misconceptions.filter(
        (m) => m.conceptId === c.id && m.status !== 'resolved'
      );
      const uniqueStudentIds = new Set(relevantMisconceptions.map((m) => m.studentId));
      const affectedCount = uniqueStudentIds.size;
      const affectedPct = Math.round((affectedCount / students.length) * 100);

      const severity: 'critical' | 'moderate' | 'low' =
        affectedPct >= 50 ? 'critical' : affectedPct > 0 ? 'moderate' : 'low';

      // Pick actual quotes from recorded evidence
      const sampleStudentReasoning = relevantMisconceptions
        .slice(0, 3)
        .map((m) => `"${m.studentOriginalResponse}"`);

      const primaryMisconception =
        relevantMisconceptions[0]?.misconceptionTitle ||
        c.commonMisconceptions[0]?.title ||
        'No active misconception';

      const suggestedClassActivity =
        c.id === 'c6'
          ? 'Conduct a live ammeter test in the Virtual Circuit Lab before and after Bulb 1 to demonstrate charge conservation.'
          : c.id === 'c7'
          ? 'Use the Virtual Lab parallel branch switch toggle to demonstrate that equivalent resistance drops from 6Ω to 3Ω when another branch opens.'
          : c.id === 'c5'
          ? 'Demonstrate that R is constant by varying V and plotting the linear I-V relationship.'
          : `Review foundational definitions and unit relations for ${c.name}.`;

      return {
        conceptId: c.id,
        conceptName: c.name,
        affectedStudentCount: affectedCount,
        affectedStudentPct: affectedPct,
        severity,
        primaryMisconception,
        sampleStudentReasoning,
        suggestedClassActivity,
      };
    });

    // Generate real intervention recommendations based on lowest concept averages
    const sortedConcepts = [...conceptPerformance].sort((a, b) => a.averageMastery - b.averageMastery);
    const teacherRecommendations: any[] = [];

    if (sortedConcepts[0]) {
      teacherRecommendations.push({
        id: `rec-${sortedConcepts[0].conceptId}`,
        priority: 'high' as const,
        title: `Priority Remediation: ${sortedConcepts[0].conceptName}`,
        description: `Class average is currently ${sortedConcepts[0].averageMastery}%, with ${sortedConcepts[0].studentsNeedingHelp} students needing reinforcement.`,
        actionablePlan: `Assign targeted practice or conduct a Virtual Lab demonstration focusing on ${sortedConcepts[0].conceptName}.`,
        affectedConcepts: [sortedConcepts[0].conceptId],
      });
    }

    if (sortedConcepts[1]) {
      teacherRecommendations.push({
        id: `rec-${sortedConcepts[1].conceptId}`,
        priority: 'medium' as const,
        title: `Reinforce Topic: ${sortedConcepts[1].conceptName}`,
        description: `Class average is ${sortedConcepts[1].averageMastery}%. Review core formulas and circuit schematics.`,
        actionablePlan: `Review key equations and run the virtual diagnostic test to verify student retention.`,
        affectedConcepts: [sortedConcepts[1].conceptId],
      });
    }

    return {
      totalStudents: students.length,
      classAverageMastery: avgMastery,
      conceptPerformance,
      misconceptionHeatmap,
      studentsRequiringSupport: classStudents.filter((s) => s.mastery < 60),
      teacherRecommendations,
      classStudents,
    };
  }
}

export const db = new DatabaseAdapter();
