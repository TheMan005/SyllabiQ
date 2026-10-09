export type DocumentFormat = 'PDF' | 'PPTX' | 'JPEG' | 'PNG';

export type BloomsLevel =
  | 'L1: Remember'
  | 'L2: Understand'
  | 'L3: Apply'
  | 'L4: Analyze'
  | 'L5: Evaluate'
  | 'L6: Create';

export interface UploadedFacultyDocument {
  id: string;
  name: string;
  format: DocumentFormat;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  base64Data?: string;
  extractedTextPreview?: string;
  pageOrSlideCount?: number;
  previewImageUrl?: string;
  status: 'READY' | 'PARSING' | 'INGESTED' | 'ERROR';
}

export interface CourseOutcome {
  code: string; // e.g. "CO1"
  statement: string;
  targetBlooms: BloomsLevel[];
  syllabusUnits: string[];
  weightagePercent: number;
}

export interface SyllabusUnit {
  unitNumber: string; // e.g. "Unit I"
  title: string;
  topics: string[];
  contactHours: number;
  mappedCOs: string[];
}

export interface SectionMarksConfig {
  id: string;
  sectionName: string; // e.g. "Part A — Foundational Concepts"
  questionType: 'MCQ' | 'Short Answer' | 'Analytical / Derivation' | 'Case Study / Long Answer';
  totalQuestionsToGenerate: number;
  questionsToAttempt: number; // Supports internal choice e.g. Attempt 4 out of 5
  marksPerQuestion: number;
  targetBloomsMix: BloomsLevel[];
  instructions: string;
}

export interface MarksDistributionConfig {
  examTitle: string;
  institutionName: string;
  departmentName: string;
  courseCode: string;
  courseTitle: string;
  semester: string;
  durationMinutes: number;
  maximumMarks: number;
  bloomsTargetPercentages: {
    rememberUnderstand: number; // L1-L2 %
    applyAnalyze: number; // L3-L4 %
    evaluateCreate: number; // L5-L6 %
  };
  sections: SectionMarksConfig[];
}

// Agent 1 Output: Multimodal Ingestion & Knowledge Extraction
export interface ExtractedConceptNode {
  id: string;
  topicTitle: string;
  syllabusUnit: string;
  mappedCO: string;
  sourceDocumentName: string;
  sourceLocation: string; // e.g. "Slides 8-12" or "Page 4, Fig 2.1"
  keyConcepts: string[];
  formulasOrDiagrams: string[];
  suggestedCognitiveLevels: BloomsLevel[];
}

export interface IngestionAgentOutput {
  summary: string;
  totalDocumentsProcessed: number;
  extractedConcepts: ExtractedConceptNode[];
  coverageByUnit: {
    unitNumber: string;
    conceptCount: number;
    sourceFiles: string[];
  }[];
  unmatchedSyllabusTopics: string[];
}

// Agent 2 Output: Assessment Blueprint & Marks Specification Matrix
export interface BlueprintSlot {
  slotId: string;
  questionNumber: string; // e.g. "Q1", "Q6(a)"
  sectionId: string;
  sectionName: string;
  questionType: string;
  marks: number;
  isInternalChoice: boolean;
  targetCO: string;
  targetUnit: string;
  targetBlooms: BloomsLevel;
  assignedTopic: string;
  sourceDocumentRef: string;
  rationale: string;
}

export interface BlueprintAgentOutput {
  blueprintSummary: string;
  totalAllocatedMarks: number;
  totalQuestionsCount: number;
  coDistribution: {
    coCode: string;
    allocatedMarks: number;
    percentage: number;
  }[];
  bloomsDistribution: {
    level: string;
    allocatedMarks: number;
    percentage: number;
  }[];
  slots: BlueprintSlot[];
}

// Agent 3 Output: Generated Question Paper & Marking Scheme
export interface SubQuestionItem {
  label: string; // e.g. "(a)", "(b)"
  prompt: string;
  marks: number;
  bloomsLevel: BloomsLevel;
  coCode: string;
}

export interface GeneratedQuestion {
  id: string;
  questionNumber: string;
  sectionId: string;
  sectionName: string;
  questionType: string;
  stem: string;
  options?: string[]; // For MCQ
  subQuestions?: SubQuestionItem[];
  alternativeQuestionStem?: string; // If internal 'OR' choice applies
  alternativeAnswerKey?: string;
  marks: number;
  coCode: string;
  syllabusUnit: string;
  bloomsLevel: BloomsLevel;
  sourceDocumentName: string;
  sourceLocation: string;
  expectedTimeMinutes: number;
  answerKey: string;
  markingSchemeSteps: {
    stepDescription: string;
    marksAwarded: number;
  }[];
  validation?: QuestionValidationAudit;
}

// Agent 4 Output: Syllabus & Learning Objectives Validator
export type ValidationStatus = 'VERIFIED' | 'NEEDS_REVISION' | 'OUT_OF_SYLLABUS';

export interface QuestionValidationAudit {
  questionId: string;
  questionNumber: string;
  status: ValidationStatus;
  alignmentScore: number; // 0 - 100
  syllabusFidelityPass: boolean;
  coAlignmentPass: boolean;
  bloomsCalibrationPass: boolean;
  marksProportionalityPass: boolean;
  verifiedBloomsLevel: BloomsLevel;
  matchedSyllabusTopic: string;
  matchedLearningObjectiveQuote: string;
  auditorFindings: string;
  remediationSuggestion?: string;
}

export interface ValidationAgentOutput {
  overallAuditStatus: 'APPROVED' | 'REQUIRES_ATTENTION';
  overallAlignmentScore: number;
  syllabusCoveragePercentage: number;
  exactMarksSumVerified: boolean;
  computedTotalMarks: number;
  targetTotalMarks: number;
  verifiedCount: number;
  needsRevisionCount: number;
  outOfSyllabusCount: number;
  executiveAuditSummary: string;
  coAttainmentAudit: {
    coCode: string;
    targetWeightPercent: number;
    actualWeightPercent: number;
    status: 'BALANCED' | 'UNDER_REPRESENTED' | 'OVER_REPRESENTED';
  }[];
  questionAudits: QuestionValidationAudit[];
}

export interface AgentExecutionLog {
  agentId: 'INGESTION' | 'BLUEPRINT' | 'GENERATOR' | 'VALIDATOR';
  agentName: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  headline: string;
  details: string[];
}
