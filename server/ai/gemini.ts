import { GoogleGenAI } from '@google/genai';
import { ThinkTraceEvaluation, Question, RecoveryActivity } from '../types.js';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  try {
    aiInstance = new GoogleGenAI();
    return aiInstance;
  } catch (err) {
    console.warn('[LearnIQ AI] Could not initialize GoogleGenAI client:', err);
    return null;
  }
}

/**
 * ThinkTrace: Evaluates student reasoning and diagnoses conceptual misconceptions.
 */
export async function evaluateStudentReasoning(params: {
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  studentExplanation: string;
  expectedReasoning: string;
  conceptName: string;
  prerequisites?: string[];
}): Promise<ThinkTraceEvaluation> {
  const {
    questionText,
    correctAnswer,
    studentAnswer,
    studentExplanation,
    expectedReasoning,
    conceptName,
  } = params;

  const ai = getAIClient();

  // If Gemini API is available, request structured diagnostic JSON
  if (ai) {
    try {
      const prompt = `You are ThinkTrace, an expert Class 10 Physics pedagogical reasoning evaluator.
Evaluate the student's thinking, not just their final answer.

CONTEXT:
Concept: ${conceptName}
Question: ${questionText}
Correct Answer: ${correctAnswer}
Expected Scientific Reasoning: ${expectedReasoning}

STUDENT INPUT:
Student's Chosen Answer: ${studentAnswer}
Student's Written Explanation: "${studentExplanation || 'No explanation provided'}"

EVALUATION RUBRIC:
1. answerCorrect: boolean. Is student's answer correct?
2. reasoningQuality: "sound" (valid scientific logic) | "partially_sound" (some correct logic but incomplete) | "flawed" (erroneous physics assumption) | "memorized_guess" (correct answer with trivial or absent reasoning)
3. reasoningCategory: short category title (e.g., "Current Conservation", "Ohmic Proportionality", "Parallel Resistance Addition", "Series Current Attenuation Fallacy")
4. identifiedError: clear sentence detailing where their reasoning first diverged from valid physics, or null if sound.
5. possibleMisconception: explicit common Class 10 misconception detected (e.g., "Current is consumed as it passes through successive bulbs", "Adding resistors in parallel increases resistance"), or null if none.
6. confidenceOfDiagnosis: float between 0.0 and 1.0.
7. explanation: compassionate, encouraging, pedagogical explanation addressing the student directly.
8. correctScientificExplanation: clear, concise scientific explanation of why the correct answer is true.
9. recommendedNextAction: "recovery_activity" | "verification" | "prerequisite_revisit" | "advance"
10. insufficientEvidence: boolean (true if explanation is too brief to evaluate).
11. evidenceQuote: direct quote or phrase from student explanation showing the flaw, or null.

Respond ONLY with a valid JSON object matching the requested schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '';
      const parsed = JSON.parse(text);

      return {
        answerCorrect: Boolean(parsed.answerCorrect ?? parsed.answer_correct),
        reasoningQuality: parsed.reasoningQuality || parsed.reasoning_quality || 'partially_sound',
        reasoningCategory: parsed.reasoningCategory || parsed.reasoning_category || 'Circuit Analysis',
        identifiedError: parsed.identifiedError || parsed.identified_error,
        possibleMisconception: parsed.possibleMisconception || parsed.possible_misconception,
        confidenceOfDiagnosis: Number(parsed.confidenceOfDiagnosis ?? parsed.confidence_of_diagnosis ?? 0.85),
        explanation: parsed.explanation || 'Reasoning analyzed against Class 10 physics principles.',
        correctScientificExplanation: parsed.correctScientificExplanation || parsed.correct_scientific_explanation || expectedReasoning,
        recommendedNextAction: parsed.recommendedNextAction || parsed.recommended_next_action || 'recovery_activity',
        insufficientEvidence: Boolean(parsed.insufficientEvidence ?? parsed.insufficient_evidence),
        evidenceQuote: parsed.evidenceQuote || parsed.evidence_quote,
      };
    } catch (err) {
      console.warn('[LearnIQ AI] Gemini evaluation call failed, falling back to rule-based evaluator:', err);
    }
  }

  // Robust Domain Rule-based Fallback Evaluator (ensures 100% reliability offline/demo)
  return fallbackEvaluateReasoning(params);
}

function fallbackEvaluateReasoning(params: {
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  studentExplanation: string;
  expectedReasoning: string;
  conceptName: string;
}): ThinkTraceEvaluation {
  const normCorrect = String(params.correctAnswer).trim().toLowerCase();
  const normStudent = String(params.studentAnswer).trim().toLowerCase();
  const explanation = (params.studentExplanation || '').toLowerCase();

  const isCorrect = normCorrect === normStudent || normStudent.includes(normCorrect);
  const hasExplanation = explanation.trim().length > 10;

  // Detect common misconceptions from keywords
  let possibleMisconception: string | undefined;
  let identifiedError: string | undefined;
  let reasoningCategory = 'Conceptual Analysis';

  if (explanation.includes('consumed') || explanation.includes('used up') || explanation.includes('first bulb gets more')) {
    possibleMisconception = 'Current is consumed or used up sequentially as it passes through components';
    identifiedError = 'Assumed electric charges get used up or diminished as current passes through resistors.';
    reasoningCategory = 'Conservation of Charge';
  } else if (explanation.includes('more resistors') && (explanation.includes('increase') || explanation.includes('higher resistance'))) {
    possibleMisconception = 'Adding more resistors in parallel increases equivalent resistance';
    identifiedError = 'Treated parallel branches as cumulative obstacles rather than alternative parallel pathways.';
    reasoningCategory = 'Parallel Equivalent Resistance';
  } else if (explanation.includes('voltage flows') || explanation.includes('volts flowing')) {
    possibleMisconception = 'Voltage flows through wires like a fluid rather than existing across terminals';
    identifiedError = 'Confused potential difference (driving pressure) with current (rate of charge flow).';
    reasoningCategory = 'Potential Difference vs Current';
  } else if (explanation.includes('fat wire') || explanation.includes('thicker') && explanation.includes('more resistance')) {
    possibleMisconception = 'Thicker wire has higher resistance due to more atoms';
    identifiedError = 'Ignored that cross-sectional area increases parallel paths for electron conduction (R ∝ 1/A).';
    reasoningCategory = 'Factors Affecting Resistance';
  }

  let reasoningQuality: 'sound' | 'partially_sound' | 'flawed' | 'memorized_guess' = 'sound';
  if (isCorrect && !hasExplanation) {
    reasoningQuality = 'memorized_guess';
  } else if (isCorrect && possibleMisconception) {
    reasoningQuality = 'flawed'; // Correct answer arrived at through wrong reasoning!
  } else if (!isCorrect && possibleMisconception) {
    reasoningQuality = 'flawed';
  } else if (!isCorrect) {
    reasoningQuality = 'partially_sound';
    identifiedError = 'Answer did not match the expected scientific calculation.';
  }

  const recommendedNextAction =
    !isCorrect || possibleMisconception
      ? 'recovery_activity'
      : reasoningQuality === 'memorized_guess'
      ? 'verification'
      : 'advance';

  return {
    answerCorrect: isCorrect,
    reasoningQuality,
    reasoningCategory,
    identifiedError,
    possibleMisconception,
    confidenceOfDiagnosis: 0.88,
    explanation: isCorrect
      ? possibleMisconception
        ? `While your final selection was marked correct, your explanation reveals a common misunderstanding: "${possibleMisconception}". In Physics, arriving at the right answer through flawed logic will cause problems in unfamiliar circuits.`
        : 'Excellent scientific reasoning! Your explanation demonstrates a solid understanding of the governing principles.'
      : possibleMisconception
      ? `Notice where your thinking diverged: ${identifiedError} Let's explore this in the Virtual Lab to see what actually happens!`
      : 'Your answer did not match the expected result. Review the relationship between the quantities involved.',
    correctScientificExplanation: params.expectedReasoning,
    recommendedNextAction,
    insufficientEvidence: !hasExplanation,
    evidenceQuote: hasExplanation ? params.studentExplanation.slice(0, 100) : undefined,
  };
}

/**
 * Generates an adaptive question targeted at a specific concept and difficulty.
 */
export async function generateAdaptiveQuestion(
  conceptId: string,
  conceptName: string,
  difficulty: 'easy' | 'medium' | 'hard',
  misconceptionToTarget?: string
): Promise<Question> {
  const ai = getAIClient();

  if (ai) {
    try {
      const prompt = `Generate a rigorous Class 10 Physics question for the concept "${conceptName}".
Difficulty: ${difficulty}
Target misconception to challenge: ${misconceptionToTarget || 'General conceptual depth'}

Requirements:
- Scientifically accurate Class 10 Physics (Electricity chapter).
- Must have a clear deterministic correct answer.
- If numerical, provide the exact number for correctAnswer.
- If multiple choice, provide 4 distinct options with one unambiguously correct answer.

Respond ONLY with valid JSON:
{
  "title": "Short title",
  "questionText": "Clear question text",
  "type": "multiple_choice" or "numerical",
  "difficulty": "${difficulty}",
  "options": [{"id": "a", "text": "..."}, {"id": "b", "text": "..."}, {"id": "c", "text": "..."}, {"id": "d", "text": "..."}],
  "correctAnswer": "id of correct option or number string",
  "unit": "unit if numerical",
  "expectedReasoning": "Step-by-step scientific justification",
  "hint": "helpful hint without giving away the answer"
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(res.text?.trim() || '{}');
      return {
        id: `gen-${Date.now()}`,
        conceptId,
        conceptName,
        title: parsed.title || `${conceptName} Challenge`,
        questionText: parsed.questionText,
        type: parsed.type || 'multiple_choice',
        difficulty,
        options: parsed.options,
        correctAnswer: String(parsed.correctAnswer),
        unit: parsed.unit,
        expectedReasoning: parsed.expectedReasoning,
        hint: parsed.hint,
        misconceptionTested: misconceptionToTarget,
      };
    } catch (err) {
      console.warn('[LearnIQ AI] Adaptive question generation via Gemini failed, generating deterministic question:', err);
    }
  }

  // Deterministic fallback generator
  const idNum = Math.floor(Math.random() * 5) + 2;
  const vVal = idNum * 4;
  const rVal = idNum * 2;
  const iExpected = vVal / rVal;

  return {
    id: `adp-${Date.now()}`,
    conceptId,
    conceptName,
    title: `${conceptName} Targeted Problem`,
    questionText: `A battery of ${vVal} V is connected across an ohmic resistor of ${rVal} Ω. Calculate the current flowing through the resistor in Amperes.`,
    type: 'numerical',
    difficulty,
    correctAnswer: String(iExpected),
    tolerance: 0.05,
    unit: 'Amperes (A)',
    expectedReasoning: `Using Ohm's law: I = V / R = ${vVal} V / ${rVal} Ω = ${iExpected} A.`,
    hint: 'Apply Ohm’s law formula I = V / R.',
  };
}

/**
 * Generates a targeted 6-7 step personalized recovery journey.
 */
export function generateRecoveryJourney(
  studentId: string,
  conceptId: string,
  conceptName: string,
  misconceptionTitle?: string
): RecoveryActivity {
  const isSeriesMisconception =
    misconceptionTitle?.toLowerCase().includes('consumed') || conceptId === 'c6';
  const isParallelMisconception =
    misconceptionTitle?.toLowerCase().includes('parallel') || conceptId === 'c7';

  return {
    id: `recov-${Date.now()}`,
    studentId,
    conceptId,
    conceptName,
    misconceptionAddressed: misconceptionTitle || `Mastery reinforcement for ${conceptName}`,
    title: `Targeted Recovery: ${conceptName}`,
    status: 'assigned',
    createdAt: new Date().toISOString(),
    steps: [
      {
        stepNumber: 1,
        title: 'Step 1: Identify the Learning Gap',
        type: 'identify_gap',
        content: isSeriesMisconception
          ? 'You demonstrated the common misconception that electric current is "consumed" or used up by the first bulb in a series circuit. Let us dismantle this misconception and see what physics reveals.'
          : isParallelMisconception
          ? 'You expected adding parallel branches to increase overall resistance. In reality, adding parallel paths increases conductivity and LOWERS equivalent resistance.'
          : `Let us address the gap identified in ${conceptName}. Building a concrete mental model ensures you can solve any circuit problem with confidence.`,
        completed: false,
      },
      {
        stepNumber: 2,
        title: 'Step 2: Core Scientific Principle in Simple Language',
        type: 'concept_explainer',
        content: isSeriesMisconception
          ? 'Electric current is the rate of flow of electrons (I = Q / t). Metal wires are already completely packed with mobile conduction electrons. When the battery provides a potential difference, all electrons in the continuous loop move together like water circulating in a closed pipe. The number of electrons entering a bulb per second must strictly equal the number exiting it. Electrical energy is converted to light and heat, but CHARGE IS CONSERVED.'
          : isParallelMisconception
          ? 'Imagine a toll plaza on a highway. If one toll gate is open, cars face high congestion. If a second toll gate is opened in parallel, does the traffic face more resistance or less? LESS! Even though the second gate is an obstacle, it opens an extra pathway. Similarly, adding a resistor in parallel provides an additional path for electrons, reducing total equivalent resistance: 1/Req = 1/R1 + 1/R2.'
          : `Recall the governing equation: for ${conceptName}, verify that the physical quantities and their direct or inverse relationships are maintained.`,
        completed: false,
      },
      {
        stepNumber: 3,
        title: 'Step 3: Visual Investigation in the Virtual Lab',
        type: 'visual_simulation',
        content: isSeriesMisconception
          ? 'Launch the Series Circuit in the Virtual Lab. Look at the ammeters placed before Bulb 1, between Bulb 1 and Bulb 2, and after Bulb 2. Notice that every meter reads the EXACT same current (e.g. 1.0 A). Neither bulb "eats" the current!'
          : 'In the Virtual Lab, switch on Branch 2 in a parallel circuit. Observe that the total battery current immediately increases, and equivalent resistance drops from 6 Ω to 3 Ω.',
        circuitPreset: {
          type: isSeriesMisconception ? 'series' : 'parallel',
          name: isSeriesMisconception ? 'Series Current Conservation Lab' : 'Parallel Branch Demonstration',
          description: 'Notice the meter values across all points.',
          voltage: 12,
          resistors: [
            { id: 'r1', name: isSeriesMisconception ? 'Bulb 1' : 'Branch 1 Resistor', resistance: 6, isBulb: true },
            { id: 'r2', name: isSeriesMisconception ? 'Bulb 2' : 'Branch 2 Resistor', resistance: 6, isBulb: true },
          ],
          switches: [{ id: 's1', name: 'Main Key', isOpen: false }],
          meters: { ammeterConnected: true, voltmeterConnected: true },
        },
        completed: false,
      },
      {
        stepNumber: 4,
        title: 'Step 4: Guided Practice',
        type: 'guided_practice',
        content: 'Apply the verified principle to this guided scenario:',
        question: {
          id: `gp-${Date.now()}`,
          conceptId,
          conceptName,
          title: 'Guided Checkpoint',
          questionText: isSeriesMisconception
            ? 'If a series string of 3 identical bulbs draws 1.5 A from a battery, what is the current passing through the third bulb in the chain?'
            : 'Two 10 Ω resistors are connected in parallel. What is their combined equivalent resistance?',
          type: 'numerical',
          difficulty: 'easy',
          correctAnswer: isSeriesMisconception ? '1.5' : '5',
          unit: isSeriesMisconception ? 'A' : 'Ω',
          expectedReasoning: isSeriesMisconception
            ? 'In a series circuit, current is identical at every point. Hence I3 = 1.5 A.'
            : '1/Req = 1/10 + 1/10 = 2/10 = 1/5 => Req = 5 Ω.',
        },
        completed: false,
      },
      {
        stepNumber: 5,
        title: 'Step 5: Independent Verification Challenge',
        type: 'verification',
        content: 'Now demonstrate mastery with an unfamiliar transfer problem with different values:',
        question: {
          id: `verif-${Date.now()}`,
          conceptId,
          conceptName,
          title: 'Mastery Verification',
          questionText: isSeriesMisconception
            ? 'A 24 V battery is connected to a 4 Ω resistor and an 8 Ω resistor in series. If an ammeter is placed between the two resistors, what current will it display?'
            : 'Three 12 Ω resistors are connected in parallel across a 12 V battery. What is the total equivalent resistance of the three resistors?',
          type: 'numerical',
          difficulty: 'medium',
          correctAnswer: isSeriesMisconception ? '2' : '4',
          unit: isSeriesMisconception ? 'A' : 'Ω',
          expectedReasoning: isSeriesMisconception
            ? 'Req = 4 + 8 = 12 Ω. Current throughout entire series circuit I = V / Req = 24 / 12 = 2 A.'
            : 'For 3 identical 12 Ω resistors in parallel: Req = 12 / 3 = 4 Ω.',
        },
        completed: false,
      },
    ],
  };
}
