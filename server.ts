import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { db } from './server/db/adapter.js';
import { calculateCircuit, verifyPhysicsBenchmarks } from './server/physics/engine.js';
import {
  evaluateStudentReasoning,
  generateAdaptiveQuestion,
  generateRecoveryJourney,
} from './server/ai/gemini.js';
import { CONCEPTS, DIAGNOSTIC_QUESTIONS } from './server/data/seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Database
await db.connect();

// ---------------------------------------------------------------------
// 1. Authentication Endpoints
// ---------------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.json({ user: existing, token: `demo-token-${existing.id}` });
  }

  // Create user if not existing
  const newUser = db.createUser({
    id: `user-${Date.now()}`,
    name: email.split('@')[0],
    email,
    role: role || 'student',
    createdAt: new Date().toISOString(),
  });

  return res.json({ user: newUser, token: `demo-token-${newUser.id}` });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role, grade } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const user = db.createUser({
    id: `user-${Date.now()}`,
    name,
    email,
    role: role || 'student',
    grade: grade || 'Class 10',
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ user, token: `demo-token-${user.id}` });
});

app.get('/api/auth/me', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.json({ user: null });
  }
  const user = db.getUserById(userId);
  return res.json({ user: user || null });
});

app.post('/api/admin/reset', (_req, res) => {
  db.resetAllData();
  return res.json({ message: 'Database reset to clean state' });
});

// ---------------------------------------------------------------------
// 2. Concepts & Knowledge Graph Endpoints
// ---------------------------------------------------------------------
app.get('/api/concepts', (_req, res) => {
  const concepts = db.getConcepts();
  res.json({ concepts });
});

app.get('/api/concepts/:id', (req, res) => {
  const concept = db.getConceptById(req.params.id);
  if (!concept) {
    return res.status(404).json({ error: 'Concept not found' });
  }
  res.json({ concept });
});

app.get('/api/concepts/graph/view', (req, res) => {
  const studentId = (req.query.studentId as string) || '';
  const model = studentId ? db.getLearnerModel(studentId) : null;
  const concepts = db.getConcepts();

  const nodes = concepts.map((c) => {
    const cm = model?.conceptMastery[c.id];
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      order: c.order,
      prerequisites: c.prerequisites,
      masteryScore: cm?.masteryScore ?? 0,
      status: cm?.status ?? 'weak',
      hasActiveMisconception: cm?.hasActiveMisconception ?? false,
      hasPrerequisiteGap: cm?.hasPrerequisiteGap ?? false,
      standardFormulas: c.standardFormulas,
      unit: c.unit,
      commonMisconceptions: c.commonMisconceptions,
      realWorldApplication: c.realWorldApplication,
    };
  });

  const edges: { source: string; target: string; isPrereqGap: boolean }[] = [];
  concepts.forEach((c) => {
    c.prerequisites.forEach((pId) => {
      const sourceScore = model?.conceptMastery[pId]?.masteryScore ?? 0;
      const targetScore = model?.conceptMastery[c.id]?.masteryScore ?? 0;
      const isPrereqGap = sourceScore < 50 && targetScore < 50 && !!model;

      edges.push({
        source: pId,
        target: c.id,
        isPrereqGap,
      });
    });
  });

  res.json({ nodes, edges });
});

// ---------------------------------------------------------------------
// 3. Diagnostic Assessment Endpoints
// ---------------------------------------------------------------------
app.get('/api/diagnostic', (_req, res) => {
  const questions = db.getDiagnosticQuestions();
  res.json({
    chapter: 'Class 10 Physics: Electricity',
    totalQuestions: questions.length,
    questions,
  });
});

app.post('/api/diagnostic/submit', (req, res) => {
  const { studentId, answers } = req.body;
  if (!studentId || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'studentId and answers array are required' });
  }

  const report = db.recordDiagnostic(studentId, answers);
  const updatedModel = db.getLearnerModel(studentId);

  // Identify weakest concept for immediate recommendation
  const entries = Object.entries(updatedModel.conceptMastery);
  entries.sort((a, b) => a[1].masteryScore - b[1].masteryScore);
  const weakest = entries[0]?.[1];

  res.json({
    report,
    updatedModel,
    recommendation: {
      weakestConcept: weakest ? weakest.conceptName : 'Series Circuits',
      conceptId: weakest ? weakest.conceptId : 'c6',
      suggestedAction: 'Launch Virtual Physics Laboratory to investigate circuit behavior.',
    },
  });
});

// ---------------------------------------------------------------------
// 4. Virtual Circuit Laboratory & Physics Engine
// ---------------------------------------------------------------------
app.post('/api/circuits/calculate', (req, res) => {
  const config = req.body;
  if (!config || !config.type) {
    return res.status(400).json({ error: 'Invalid circuit configuration payload' });
  }
  const result = calculateCircuit(config);
  res.json(result);
});

app.post('/api/circuits/experiments', async (req, res) => {
  const {
    studentId,
    circuitType,
    prediction,
    studentExplanation,
    confidence,
    circuitConfig,
    conceptName,
  } = req.body;

  if (!studentId || !circuitConfig) {
    return res.status(400).json({ error: 'studentId and circuitConfig are required' });
  }

  // 1. Calculate deterministic physics outcome
  const calculatedResult = calculateCircuit(circuitConfig);

  // 2. Evaluate student reasoning using ThinkTrace
  const expectedReasoning = calculatedResult.explanation;
  const diagnosis = await evaluateStudentReasoning({
    questionText: `Circuit Prediction for ${circuitType}: Student predicted "${prediction}"`,
    correctAnswer: `Observed: I = ${calculatedResult.totalCurrent} A, Req = ${calculatedResult.totalResistance} Ω`,
    studentAnswer: prediction || 'No prediction chosen',
    studentExplanation: studentExplanation || '',
    expectedReasoning,
    conceptName: conceptName || 'Electric Circuits',
  });

  // 3. Record experiment persistently
  const experiment = db.recordCircuitExperiment({
    studentId,
    circuitType,
    prediction,
    explanation: studentExplanation,
    confidence,
    calculatedResult,
    diagnosis,
  });

  // 4. If misconception identified, record in Misconception Memory
  if (diagnosis.possibleMisconception) {
    const conceptId = circuitType === 'series' ? 'c6' : circuitType === 'parallel' ? 'c7' : 'c5';
    db.recordMisconception({
      studentId,
      conceptId,
      conceptName: conceptName || 'Circuits',
      misconceptionTitle: diagnosis.possibleMisconception,
      misconceptionDescription: diagnosis.identifiedError || diagnosis.explanation,
      studentOriginalResponse: prediction,
      reasoningEvidence: studentExplanation || 'Observed in virtual lab prediction',
      status: 'under_verification',
      occurrences: 1,
      firstIdentifiedAt: new Date().toISOString(),
      lastTestedAt: new Date().toISOString(),
      verificationAttempts: [],
    });
  }

  res.json({
    experiment,
    calculatedResult,
    diagnosis,
  });
});

app.get('/api/circuits/experiments/:studentId', (req, res) => {
  const experiments = db.getCircuitExperiments(req.params.studentId);
  res.json({ experiments });
});

// Self-test route verifying the 4 mandatory Master Prompt test cases
app.get('/api/circuits/physics-test', (_req, res) => {
  const benchmark = verifyPhysicsBenchmarks();
  res.json(benchmark);
});

// ---------------------------------------------------------------------
// 5. ThinkTrace, Questions & Adaptive Practice
// ---------------------------------------------------------------------
app.get('/api/questions/next', async (req, res) => {
  const studentId = (req.query.studentId as string) || '';
  const conceptId = req.query.conceptId as string;
  const model = studentId ? db.getLearnerModel(studentId) : null;

  // Select target concept: specified, or weakest
  let targetConceptId = conceptId;
  if (!targetConceptId && model) {
    const sorted = Object.entries(model.conceptMastery).sort(
      (a, b) => a[1].masteryScore - b[1].masteryScore
    );
    targetConceptId = sorted[0]?.[0] || 'c1';
  } else if (!targetConceptId) {
    targetConceptId = 'c1';
  }

  const concept = db.getConceptById(targetConceptId) || CONCEPTS[0];
  const cm = model?.conceptMastery[targetConceptId];
  const difficulty: 'easy' | 'medium' | 'hard' =
    (cm?.masteryScore ?? 0) > 75 ? 'hard' : (cm?.masteryScore ?? 0) > 45 ? 'medium' : 'easy';
    (cm?.masteryScore ?? 0) > 75 ? 'hard' : (cm?.masteryScore ?? 0) > 45 ? 'medium' : 'easy';

  // Check if there is an unattempted question in pool
  const pool = db.getQuestions().filter((q) => q.conceptId === targetConceptId);
  const selected = pool[Math.floor(Math.random() * pool.length)];

  if (selected) {
    return res.json({ question: selected, source: 'curated_bank' });
  }

  // Generate adaptive question dynamically via AI
  const generated = await generateAdaptiveQuestion(
    concept.id,
    concept.name,
    difficulty,
    concept.commonMisconceptions[0]?.title
  );
  db.addQuestion(generated);

  res.json({ question: generated, source: 'ai_adaptive_generator' });
});

app.post('/api/attempts', async (req, res) => {
  const {
    studentId,
    questionId,
    answer,
    explanation,
    confidence,
  } = req.body;

  if (!studentId || !questionId) {
    return res.status(400).json({ error: 'studentId and questionId are required' });
  }

  const question = db.getQuestionById(questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  let isCorrect = false;
  if (question.type === 'numerical') {
    const numStudent = parseFloat(String(answer).trim());
    const numExpected = parseFloat(String(question.correctAnswer).trim());
    const tol = question.tolerance ?? 0.1;
    isCorrect = !isNaN(numStudent) && Math.abs(numStudent - numExpected) <= tol;
  } else {
    isCorrect = String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
  }

  // ThinkTrace reasoning diagnosis
  const diagnosis = await evaluateStudentReasoning({
    questionText: question.questionText,
    correctAnswer: question.correctAnswer,
    studentAnswer: String(answer),
    studentExplanation: explanation || '',
    expectedReasoning: question.expectedReasoning,
    conceptName: question.conceptName,
  });

  // Update learner model persistently
  const updatedModel = db.recordConceptAttempt(
    studentId,
    question.conceptId,
    isCorrect,
    diagnosis.reasoningQuality,
    confidence || 'somewhat_confident',
    question.difficulty
  );

  // If misconception identified, register in Misconception Memory
  if (diagnosis.possibleMisconception) {
    db.recordMisconception({
      studentId,
      conceptId: question.conceptId,
      conceptName: question.conceptName,
      misconceptionTitle: diagnosis.possibleMisconception,
      misconceptionDescription: diagnosis.identifiedError || diagnosis.explanation,
      studentOriginalResponse: String(answer),
      reasoningEvidence: explanation || 'Targeted attempt explanation',
      status: 'under_verification',
      occurrences: 1,
      firstIdentifiedAt: new Date().toISOString(),
      lastTestedAt: new Date().toISOString(),
      verificationAttempts: [
        {
          date: new Date().toISOString(),
          questionId,
          passed: isCorrect,
          reasoningQuality: diagnosis.reasoningQuality,
        },
      ],
    });
  }

  res.json({
    isCorrect,
    correctAnswer: question.correctAnswer,
    diagnosis,
    updatedMastery: updatedModel.conceptMastery[question.conceptId],
    overallMastery: updatedModel.overallMastery,
  });
});

app.post('/api/ai/evaluate-reasoning', async (req, res) => {
  const result = await evaluateStudentReasoning(req.body);
  res.json(result);
});

// ---------------------------------------------------------------------
// 6. Misconceptions & Recovery Activities
// ---------------------------------------------------------------------
app.get('/api/misconceptions/:studentId', (req, res) => {
  const misconceptions = db.getMisconceptions(req.params.studentId);
  res.json({ misconceptions });
});

app.post('/api/misconceptions/update-status', (req, res) => {
  const { id, status, verificationResult } = req.body;
  const updated = db.updateMisconceptionStatus(id, status, verificationResult);
  if (!updated) {
    return res.status(404).json({ error: 'Misconception record not found' });
  }
  res.json({ updated });
});

app.get('/api/recovery/:studentId', (req, res) => {
  const activities = db.getRecoveryActivities(req.params.studentId);
  res.json({ activities });
});

app.post('/api/recovery/start', (req, res) => {
  const { studentId, conceptId, misconceptionTitle } = req.body;
  const concept = db.getConceptById(conceptId) || CONCEPTS[0];

  const recovery = generateRecoveryJourney(
    studentId,
    concept.id,
    concept.name,
    misconceptionTitle
  );
  db.saveRecoveryActivity(recovery);

  res.json({ recovery });
});

app.post('/api/recovery/complete-step', (req, res) => {
  const { recoveryId, stepNumber, studentResponse, passed, studentId } = req.body;
  const activities = db.getRecoveryActivities(studentId);
  const activity = activities.find((a) => a.id === recoveryId);

  if (!activity) {
    return res.status(404).json({ error: 'Recovery activity not found' });
  }

  const step = activity.steps.find((s) => s.stepNumber === stepNumber);
  if (step) {
    step.completed = true;
    step.studentResponse = studentResponse;
  }

  const allDone = activity.steps.every((s) => s.completed);
  if (allDone) {
    activity.status = 'completed';
    activity.completedAt = new Date().toISOString();

    // Reward recovery mastery improvement
    const model = db.getLearnerModel(activity.studentId);
    model.recoveryActivitiesCompletedCount += 1;
    if (model.conceptMastery[activity.conceptId]) {
      model.conceptMastery[activity.conceptId].masteryScore = Math.min(
        100,
        model.conceptMastery[activity.conceptId].masteryScore + 18
      );
      if (model.conceptMastery[activity.conceptId].masteryScore >= 60) {
        model.conceptMastery[activity.conceptId].status = 'developing';
      }
    }
    db.updateLearnerModel(activity.studentId, model);
  }

  db.saveRecoveryActivity(activity);
  res.json({ activity, allDone });
});

// ---------------------------------------------------------------------
// 7. Spaced Repetition (Revision Planner)
// ---------------------------------------------------------------------
app.get('/api/revisions/:studentId', (req, res) => {
  const revisions = db.getRevisionSchedules(req.params.studentId);
  res.json({ revisions });
});

app.post('/api/revisions/complete', (req, res) => {
  const { revisionId } = req.body;
  const result = db.completeRevision(revisionId);
  if (!result) {
    return res.status(404).json({ error: 'Revision not found' });
  }
  res.json({ result });
});

// ---------------------------------------------------------------------
// 8. Learner Model Endpoints
// ---------------------------------------------------------------------
app.get('/api/learners/:id/mastery', (req, res) => {
  const model = db.getLearnerModel(req.params.id);
  res.json({ model });
});

app.get('/api/learners/:id/next-activity', (req, res) => {
  const model = db.getLearnerModel(req.params.id);
  const misconceptions = db.getMisconceptions(req.params.id).filter((m) => m.status !== 'resolved');

  if (misconceptions.length > 0) {
    return res.json({
      type: 'recovery',
      title: `Recovery: Address "${misconceptions[0].misconceptionTitle}"`,
      conceptId: misconceptions[0].conceptId,
      conceptName: misconceptions[0].conceptName,
      actionUrl: `/recovery?concept=${misconceptions[0].conceptId}`,
      reason: 'Active conceptual misunderstanding requires guided intervention before advanced practice.',
    });
  }

  if (!model.diagnosticCompleted) {
    return res.json({
      type: 'diagnostic',
      title: 'Class 10 Electricity Diagnostic Assessment',
      actionUrl: '/diagnostic',
      reason: 'Benchmark your conceptual baseline across all 8 Electricity topics.',
    });
  }

  const entries = Object.entries(model.conceptMastery).sort(
    (a, b) => a[1].masteryScore - b[1].masteryScore
  );
  const weakest = entries[0]?.[1];

  return res.json({
    type: 'virtual_lab',
    title: `Virtual Lab: Investigate ${weakest?.conceptName || 'Series Circuits'}`,
    conceptId: weakest?.conceptId || 'c6',
    conceptName: weakest?.conceptName || 'Series Circuits',
    actionUrl: `/lab?concept=${weakest?.conceptId || 'c6'}`,
    reason: `Current mastery is ${weakest?.masteryScore || 40}%. Visual experimentation reinforces foundational intuition.`,
  });
});

// ---------------------------------------------------------------------
// 9. Teacher Intelligence & Intervention Analytics
// ---------------------------------------------------------------------
app.get('/api/teachers/dashboard', (_req, res) => {
  const analytics = db.getTeacherAnalytics();
  res.json(analytics);
});

app.get('/api/teachers/students', (_req, res) => {
  const analytics = db.getTeacherAnalytics();
  res.json({ students: analytics.classStudents });
});

app.get('/api/teachers/misconceptions', (_req, res) => {
  const analytics = db.getTeacherAnalytics();
  res.json({ heatmap: analytics.misconceptionHeatmap });
});

app.get('/api/teachers/interventions', (_req, res) => {
  const analytics = db.getTeacherAnalytics();
  res.json({ recommendations: analytics.teacherRecommendations });
});

// ---------------------------------------------------------------------
// 10. Teacher-to-Student Messaging & Intervention Feedback
// ---------------------------------------------------------------------
app.post('/api/messages', (req, res) => {
  const { teacherId, teacherName, studentId, studentName, subject, message, testScoreInfo } = req.body;
  if (!teacherId || !studentId || !message) {
    return res.status(400).json({ error: 'teacherId, studentId, and message are required' });
  }

  const newMsg = db.sendMessage({
    teacherId,
    teacherName: teacherName || 'Teacher',
    studentId,
    studentName: studentName || 'Student',
    subject: subject || 'Test Feedback & Conceptual Support',
    message,
    testScoreInfo,
  });

  res.status(201).json({ message: newMsg });
});

app.get('/api/messages/student/:studentId', (req, res) => {
  const messages = db.getMessagesForStudent(req.params.studentId);
  res.json({ messages });
});

app.get('/api/messages/teacher/:teacherId', (req, res) => {
  const messages = db.getMessagesByTeacher(req.params.teacherId);
  res.json({ messages });
});

app.post('/api/messages/:id/read', (req, res) => {
  const updated = db.markMessageRead(req.params.id);
  if (!updated) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json({ message: updated });
});

// ---------------------------------------------------------------------
// 11. DAA Model Exam Program Execution & Testing
// ---------------------------------------------------------------------
const DAA_FILES: Record<number, string> = {
  1: '01_huffman_coding.py',
  2: '02_matrix_chain_multiplication.py',
  3: '03_longest_common_subsequence.py',
  4: '04_knapsack_memoization.py',
  5: '05_n_queens.py',
  6: '06_graph_coloring.py',
  7: '07_traveling_salesperson.py',
};

app.post('/api/daa/run', (req, res) => {
  const { programId, input, customCode } = req.body;
  const fileName = DAA_FILES[programId];

  if (!fileName && !customCode) {
    return res.status(400).json({ error: 'Invalid programId or code' });
  }

  const startTime = Date.now();
  const args = customCode ? ['-c', customCode] : [path.join(__dirname, 'daa_programs', fileName)];
  const child = spawn('python3', args);

  let stdout = '';
  let stderr = '';
  let finished = false;

  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      child.kill('SIGKILL');
      res.json({
        output: stdout,
        error: 'Execution timed out (5s limit)',
        executionTimeMs: 5000,
      });
    }
  }, 5000);

  if (input !== undefined && input !== null) {
    child.stdin.write(String(input).endsWith('\n') ? String(input) : String(input) + '\n');
  }
  child.stdin.end();

  child.stdout.on('data', (d) => {
    stdout += d.toString();
  });
  child.stderr.on('data', (d) => {
    stderr += d.toString();
  });

  child.on('close', (code) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    res.json({
      output: stdout,
      error: code !== 0 ? (stderr || `Exited with code ${code}`) : null,
      executionTimeMs: Date.now() - startTime,
    });
  });

  child.on('error', (err) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    res.status(500).json({ output: stdout, error: err.message, executionTimeMs: Date.now() - startTime });
  });
});

app.post('/api/daa/submit-practice', (req, res) => {
  const { studentId, programId, programTitle, passed } = req.body;
  const targetStudentId = studentId || 'jaiakash1826';
  
  // Record diagnostic attempt so teacher dashboard sees the attended test!
  const result = db.recordDiagnostic(targetStudentId, [
    {
      questionId: `daa-prog-${programId}`,
      answer: passed ? 'PASSED_SAMPLE_TESTS' : 'ATTEMPTED',
      confidence: 'very_confident',
      explanation: `Student verified dynamic input and executed DAA program: ${programTitle}`,
    },
  ]);

  res.json({ success: true, result });
});

// ---------------------------------------------------------------------
// Vite Dev Server / Static File Serving
// ---------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LearnIQ] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[LearnIQ] Failed to start server:', err);
});
