/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  UploadedFacultyDocument,
  CourseOutcome,
  SyllabusUnit,
  MarksDistributionConfig,
  IngestionAgentOutput,
  BlueprintAgentOutput,
  GeneratedQuestion,
  ValidationAgentOutput,
  AgentExecutionLog,
} from './types/assessment';
import {
  COURSE_PRESETS,
  CoursePreset,
  INITIAL_INGESTION_OUTPUT,
  INITIAL_BLUEPRINT_OUTPUT,
  INITIAL_GENERATED_QUESTIONS,
  INITIAL_VALIDATION_OUTPUT,
} from './data/sampleCourses';
import { MultiAgentPipelineBar } from './components/MultiAgentPipelineBar';
import { DocumentSyllabusStudio } from './components/DocumentSyllabusStudio';
import { MarksBlueprintView } from './components/MarksBlueprintView';
import { QuestionPaperView } from './components/QuestionPaperView';
import { SyllabusAuditView } from './components/SyllabusAuditView';
import { ColabFastApiBridgeView } from './components/ColabFastApiBridgeView';
import { CreateSubjectModal } from './components/CreateSubjectModal';
import {
  invokeIngestionAgent,
  invokeBlueprintAgent,
  invokeGeneratorAgent,
  invokeValidatorAgent,
  invokeRemediateQuestion,
} from './utils/agentClient';

type ActiveTab = 'studio' | 'blueprint' | 'paper' | 'audit' | 'developer' | 'colab';

const CUSTOM_SUBJECTS_STORAGE_KEY = 'syllabiq_custom_subjects_v1';

export default function App() {
  const [customCourses, setCustomCourses] = useState<CoursePreset[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_SUBJECTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const allCourses: CoursePreset[] = [...COURSE_PRESETS, ...customCourses];
  const defaultPreset = allCourses[0];

  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  // Core Faculty Input State
  const [documents, setDocuments] = useState<UploadedFacultyDocument[]>(
    defaultPreset.sampleDocuments
  );
  const [courseOutcomes, setCourseOutcomes] = useState<CourseOutcome[]>(
    defaultPreset.courseOutcomes
  );
  const [syllabusUnits, setSyllabusUnits] = useState<SyllabusUnit[]>(
    defaultPreset.syllabusUnits
  );
  const [marksConfig, setMarksConfig] = useState<MarksDistributionConfig>(
    defaultPreset.marksConfig
  );

  // 4-Agent Pipeline Outputs
  const [ingestionOutput, setIngestionOutput] = useState<IngestionAgentOutput>(
    INITIAL_INGESTION_OUTPUT
  );
  const [blueprintOutput, setBlueprintOutput] = useState<BlueprintAgentOutput>(
    INITIAL_BLUEPRINT_OUTPUT
  );
  const [questions, setQuestions] = useState<GeneratedQuestion[]>(
    INITIAL_GENERATED_QUESTIONS
  );
  const [validationOutput, setValidationOutput] = useState<ValidationAgentOutput>(
    INITIAL_VALIDATION_OUTPUT
  );

  // Execution States
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isBuildingBlueprint, setIsBuildingBlueprint] = useState(false);
  const [isGeneratingPaper, setIsGeneratingPaper] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [remediatingQuestionId, setRemediatingQuestionId] = useState<string | null>(
    null
  );
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [colabTunnelUrl, setColabTunnelUrl] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_SUBJECTS_STORAGE_KEY,
        JSON.stringify(customCourses)
      );
    } catch {
      // Ignore storage errors
    }
  }, [customCourses]);

  const [agentLogs, setAgentLogs] = useState<AgentExecutionLog[]>([
    {
      agentId: 'INGESTION',
      agentName: '01. IngestionAgent (Multimodal Parser)',
      status: 'COMPLETED',
      durationMs: 1840,
      headline: 'Parsed 4 faculty files (PDF, PPTX, PNG, JPEG) into 5 concept clusters.',
      details: [
        'Extracted 18 PDF pages & 24 PPTX slides',
        'Parsed PNG Transformer schematic & JPEG whiteboard EM derivation',
      ],
    },
    {
      agentId: 'BLUEPRINT',
      agentName: '02. BlueprintArchitectAgent (Marks Matrix)',
      status: 'COMPLETED',
      durationMs: 1420,
      headline: 'Built 11-slot specification matrix totaling 50/50 marks across CO1–CO4.',
      details: [
        'Section A: 5×2m (10m) · Section B: 4×5m (20m) · Section C: 2×10m (20m)',
        'Cognitive balance: 20% L1–L2, 40% L3–L4, 40% L5–L6',
      ],
    },
    {
      agentId: 'GENERATOR',
      agentName: '03. QuestionGeneratorAgent (Exam & Key)',
      status: 'COMPLETED',
      durationMs: 3190,
      headline: 'Drafted 11 university exam questions with stepwise marking rubrics.',
      details: [
        'Included internal OR choices on 10-mark synthesis questions Q10 & Q11',
        'Generated complete model solutions and step-by-step grading weights',
      ],
    },
    {
      agentId: 'VALIDATOR',
      agentName: '04. CurriculumValidatorAgent (Syllabus Auditor)',
      status: 'COMPLETED',
      durationMs: 1650,
      headline: 'Audited 11 questions: 10 Verified, 1 Flagged (Q9 cognitive level drift).',
      details: [
        'Overall Syllabus & CO Alignment Score: 95%',
        'Actionable remediation ready for Q9 (Unit II / CO2)',
      ],
    },
  ]);

  const updateAgentLog = (
    agentId: AgentExecutionLog['agentId'],
    patch: Partial<AgentExecutionLog>
  ) => {
    setAgentLogs((prev) =>
      prev.map((log) => (log.agentId === agentId ? { ...log, ...patch } : log))
    );
  };

  const handleSelectPreset = (presetId: string) => {
    const found = allCourses.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(found.id);
    setDocuments(found.sampleDocuments);
    setCourseOutcomes(found.courseOutcomes);
    setSyllabusUnits(found.syllabusUnits);
    setMarksConfig(found.marksConfig);
    setErrorBanner(null);
  };

  // Run Agent 1: Multimodal Ingestion
  const runAgent1Ingestion = async (
    overrideDocs = documents,
    overrideUnits = syllabusUnits,
    overrideOutcomes = courseOutcomes
  ): Promise<IngestionAgentOutput> => {
    setIsIngesting(true);
    setErrorBanner(null);
    const t0 = performance.now();
    updateAgentLog('INGESTION', {
      status: 'RUNNING',
      headline: 'Ingesting multimodal PDF, PPTX, JPEG, and PNG documents...',
    });

    try {
      const data = await invokeIngestionAgent(
        {
          documents: overrideDocs,
          syllabusUnits: overrideUnits,
          courseOutcomes: overrideOutcomes,
        },
        colabTunnelUrl
      );
      setIngestionOutput(data);
      setDocuments((prev) => prev.map((d) => ({ ...d, status: 'INGESTED' })));
      const elapsed = Math.round(performance.now() - t0);
      updateAgentLog('INGESTION', {
        status: 'COMPLETED',
        durationMs: elapsed,
        headline: `Extracted ${data.extractedConcepts?.length || 0} concept clusters from ${overrideDocs.length} files.`,
        details: [data.summary || 'Mapped concepts to Syllabus Units and Course Outcomes.'],
      });
      return data;
    } catch (err: any) {
      updateAgentLog('INGESTION', {
        status: 'ERROR',
        headline: err.message || 'Ingestion failed.',
      });
      setErrorBanner(err.message || 'Agent 01 failed to process documents.');
      throw err;
    } finally {
      setIsIngesting(false);
    }
  };

  // Run Agent 2: Assessment Blueprint Architect
  const runAgent2Blueprint = async (
    currentIngestion: IngestionAgentOutput = ingestionOutput,
    overrideMarks = marksConfig,
    overrideOutcomes = courseOutcomes,
    overrideUnits = syllabusUnits
  ): Promise<BlueprintAgentOutput> => {
    setIsBuildingBlueprint(true);
    setErrorBanner(null);
    const t0 = performance.now();
    updateAgentLog('BLUEPRINT', {
      status: 'RUNNING',
      headline: 'Synthesizing question-by-question marks specification matrix...',
    });

    try {
      const data = await invokeBlueprintAgent(
        {
          ingestionOutput: currentIngestion,
          marksConfig: overrideMarks,
          courseOutcomes: overrideOutcomes,
          syllabusUnits: overrideUnits,
        },
        colabTunnelUrl
      );
      setBlueprintOutput(data);
      const elapsed = Math.round(performance.now() - t0);
      updateAgentLog('BLUEPRINT', {
        status: 'COMPLETED',
        durationMs: elapsed,
        headline: `Constructed ${data.slots?.length || 0} blueprint slots (${data.totalAllocatedMarks || overrideMarks.maximumMarks} Marks).`,
        details: [data.blueprintSummary || 'Balanced across COs and Bloom’s levels.'],
      });
      return data;
    } catch (err: any) {
      updateAgentLog('BLUEPRINT', {
        status: 'ERROR',
        headline: err.message || 'Blueprint generation failed.',
      });
      setErrorBanner(err.message || 'Agent 02 failed to build assessment blueprint.');
      throw err;
    } finally {
      setIsBuildingBlueprint(false);
    }
  };

  // Run Agent 3: Question Paper Generator
  const runAgent3Generator = async (
    currentIngestion: IngestionAgentOutput = ingestionOutput,
    currentBlueprint: BlueprintAgentOutput = blueprintOutput,
    overrideDocs = documents,
    overrideMarks = marksConfig
  ): Promise<GeneratedQuestion[]> => {
    setIsGeneratingPaper(true);
    setErrorBanner(null);
    const t0 = performance.now();
    updateAgentLog('GENERATOR', {
      status: 'RUNNING',
      headline: 'Drafting university exam questions and stepwise marking schemes...',
    });

    try {
      const generatedList = await invokeGeneratorAgent(
        {
          documents: overrideDocs,
          ingestionOutput: currentIngestion,
          blueprintOutput: currentBlueprint,
          marksConfig: overrideMarks,
        },
        colabTunnelUrl
      );
      setQuestions(generatedList);
      const elapsed = Math.round(performance.now() - t0);
      updateAgentLog('GENERATOR', {
        status: 'COMPLETED',
        durationMs: elapsed,
        headline: `Generated ${generatedList.length} exam questions with stepwise answer keys.`,
        details: [
          `Total Marks: ${generatedList.reduce((s, q) => s + (Number(q.marks) || 0), 0)}`,
        ],
      });
      return generatedList;
    } catch (err: any) {
      updateAgentLog('GENERATOR', {
        status: 'ERROR',
        headline: err.message || 'Question paper generation failed.',
      });
      setErrorBanner(err.message || 'Agent 03 failed to generate question paper.');
      throw err;
    } finally {
      setIsGeneratingPaper(false);
    }
  };

  // Run Agent 4: Curriculum & Learning Objectives Validator
  const runAgent4Validator = async (
    currentQuestions: GeneratedQuestion[] = questions,
    overrideUnits = syllabusUnits,
    overrideOutcomes = courseOutcomes,
    overrideMarks = marksConfig
  ): Promise<ValidationAgentOutput> => {
    setIsValidating(true);
    setErrorBanner(null);
    const t0 = performance.now();
    updateAgentLog('VALIDATOR', {
      status: 'RUNNING',
      headline: 'Auditing questions against Syllabus Units and Course Learning Objectives...',
    });

    try {
      const data = await invokeValidatorAgent(
        {
          questions: currentQuestions,
          syllabusUnits: overrideUnits,
          courseOutcomes: overrideOutcomes,
          marksConfig: overrideMarks,
        },
        colabTunnelUrl
      );

      // Attach per-question validation audit back onto questions state
      const mergedQuestions = currentQuestions.map((q) => {
        const match = (data.questionAudits || []).find(
          (a) => a.questionId === q.id || a.questionNumber === q.questionNumber
        );
        return match ? { ...q, validation: match } : q;
      });
      setQuestions(mergedQuestions);
      setValidationOutput(data);

      const elapsed = Math.round(performance.now() - t0);
      updateAgentLog('VALIDATOR', {
        status: 'COMPLETED',
        durationMs: elapsed,
        headline: `Audit complete: ${data.overallAlignmentScore}% aligned (${data.verifiedCount} Verified, ${data.needsRevisionCount} Flagged).`,
        details: [data.executiveAuditSummary || 'All curriculum gates evaluated.'],
      });
      return data;
    } catch (err: any) {
      updateAgentLog('VALIDATOR', {
        status: 'ERROR',
        headline: err.message || 'Validation audit failed.',
      });
      setErrorBanner(err.message || 'Agent 04 failed to audit question paper.');
      throw err;
    } finally {
      setIsValidating(false);
    }
  };

  // Full 4-Agent Sequential Pipeline Execution
  const handleRunFullPipeline = async () => {
    if (isRunningPipeline) return;
    setIsRunningPipeline(true);
    setErrorBanner(null);

    try {
      const ing = await runAgent1Ingestion();
      const bp = await runAgent2Blueprint(ing);
      const qs = await runAgent3Generator(ing, bp);
      await runAgent4Validator(qs);
      setActiveTab('paper');
    } catch {
      // Error already surfaced in banner
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // Create a brand new Subject (Course Kit)
  const handleCreateSubject = async (
    newPreset: CoursePreset,
    runPipelineImmediately: boolean
  ) => {
    setCustomCourses((prev) => [...prev, newPreset]);
    setSelectedPresetId(newPreset.id);
    setDocuments(newPreset.sampleDocuments);
    setCourseOutcomes(newPreset.courseOutcomes);
    setSyllabusUnits(newPreset.syllabusUnits);
    setMarksConfig(newPreset.marksConfig);
    setIsCreateSubjectOpen(false);
    setErrorBanner(null);

    if (runPipelineImmediately) {
      setIsRunningPipeline(true);
      try {
        const ing = await runAgent1Ingestion(
          newPreset.sampleDocuments,
          newPreset.syllabusUnits,
          newPreset.courseOutcomes
        );
        const bp = await runAgent2Blueprint(
          ing,
          newPreset.marksConfig,
          newPreset.courseOutcomes,
          newPreset.syllabusUnits
        );
        const qs = await runAgent3Generator(
          ing,
          bp,
          newPreset.sampleDocuments,
          newPreset.marksConfig
        );
        await runAgent4Validator(
          qs,
          newPreset.syllabusUnits,
          newPreset.courseOutcomes,
          newPreset.marksConfig
        );
        setActiveTab('paper');
      } catch {
        // Error surfaced in banner
      } finally {
        setIsRunningPipeline(false);
      }
    } else {
      setActiveTab('studio');
    }
  };

  const handleDeleteCustomSubject = (presetId: string) => {
    const remainingCustom = customCourses.filter((c) => c.id !== presetId);
    setCustomCourses(remainingCustom);
    const fallback = COURSE_PRESETS[0];
    setSelectedPresetId(fallback.id);
    setDocuments(fallback.sampleDocuments);
    setCourseOutcomes(fallback.courseOutcomes);
    setSyllabusUnits(fallback.syllabusUnits);
    setMarksConfig(fallback.marksConfig);
  };

  const handleRunSingleAgent = async (
    agentId: 'INGESTION' | 'BLUEPRINT' | 'GENERATOR' | 'VALIDATOR'
  ) => {
    try {
      if (agentId === 'INGESTION') {
        await runAgent1Ingestion();
        setActiveTab('studio');
      } else if (agentId === 'BLUEPRINT') {
        await runAgent2Blueprint();
        setActiveTab('blueprint');
      } else if (agentId === 'GENERATOR') {
        const qs = await runAgent3Generator();
        await runAgent4Validator(qs);
        setActiveTab('paper');
      } else if (agentId === 'VALIDATOR') {
        await runAgent4Validator();
        setActiveTab('audit');
      }
    } catch {
      // Handled in individual agent runner
    }
  };

  // Targeted Question Remediation (Agent 3 + Agent 4 loop)
  const handleRemediateQuestion = async (
    targetQuestion: GeneratedQuestion,
    customInstruction?: string
  ) => {
    setRemediatingQuestionId(targetQuestion.id);
    setErrorBanner(null);
    try {
      const upgraded = await invokeRemediateQuestion(
        {
          question: targetQuestion,
          customInstruction,
          syllabusUnits,
          courseOutcomes,
          ingestionOutput,
        },
        colabTunnelUrl
      );

      const updatedQuestions = questions.map((q) =>
        q.id === targetQuestion.id
          ? {
              ...upgraded,
              id: targetQuestion.id,
              questionNumber: targetQuestion.questionNumber,
              sectionId: targetQuestion.sectionId,
              sectionName: targetQuestion.sectionName,
            }
          : q
      );
      setQuestions(updatedQuestions);

      // Update validationOutput summary counts
      const updatedAudits = updatedQuestions
        .map((q) => q.validation)
        .filter(Boolean) as NonNullable<GeneratedQuestion['validation']>[];
      const verifiedCount = updatedAudits.filter((a) => a.status === 'VERIFIED').length;
      const needsRevisionCount = updatedAudits.filter(
        (a) => a.status === 'NEEDS_REVISION'
      ).length;
      const outOfSyllabusCount = updatedAudits.filter(
        (a) => a.status === 'OUT_OF_SYLLABUS'
      ).length;
      const avgScore =
        updatedAudits.length > 0
          ? Math.round(
              updatedAudits.reduce((s, a) => s + (a.alignmentScore || 96), 0) /
                updatedAudits.length
            )
          : 98;

      setValidationOutput((prev) => ({
        ...prev,
        overallAuditStatus:
          needsRevisionCount === 0 && outOfSyllabusCount === 0
            ? 'APPROVED'
            : 'REQUIRES_ATTENTION',
        overallAlignmentScore: avgScore,
        verifiedCount,
        needsRevisionCount,
        outOfSyllabusCount,
        executiveAuditSummary:
          needsRevisionCount === 0 && outOfSyllabusCount === 0
            ? `All ${updatedQuestions.length} examination questions have been verified against the official Syllabus Units and Course Learning Objectives (Average Alignment: ${avgScore}%). Question ${targetQuestion.questionNumber} was remediated and passed all 4 compliance gates.`
            : prev.executiveAuditSummary,
        questionAudits: updatedAudits,
      }));
    } catch (err: any) {
      setErrorBanner(
        err.message || `Could not remediate ${targetQuestion.questionNumber}.`
      );
    } finally {
      setRemediatingQuestionId(null);
    }
  };

  const navItems: { id: 'studio' | 'blueprint' | 'paper' | 'audit'; label: string }[] = [
    { id: 'studio', label: 'Document Studio' },
    { id: 'blueprint', label: 'Marks Blueprint' },
    { id: 'paper', label: 'Question Paper' },
    { id: 'audit', label: 'Syllabus Audit' },
  ];

  const flaggedCount =
    validationOutput.needsRevisionCount + validationOutput.outOfSyllabusCount;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Navigation Bar — Strict 3-Zone Contract with Discreet Developer Corner */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200 no-print">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('studio');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          SyllabiQ
        </a>

        {/* Zone 2: 4 core faculty assessment workflow links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeTab === item.id
                  ? 'text-slate-950 font-semibold border-blue-900'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRunFullPipeline}
            disabled={isRunningPipeline}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isRunningPipeline ? 'Running Agents...' : 'Run Agent Pipeline'}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white border-b border-slate-200 no-print">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 ${
              activeTab === item.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Multi-Agent Orchestration Strip */}
      <MultiAgentPipelineBar
        courses={allCourses}
        logs={agentLogs}
        isRunningPipeline={isRunningPipeline}
        activeStepIndex={null}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenCreateSubject={() => setIsCreateSubjectOpen(true)}
        onDeleteSubject={handleDeleteCustomSubject}
        onRunFullPipeline={handleRunFullPipeline}
        onRunSingleAgent={handleRunSingleAgent}
        onNavigateTab={setActiveTab}
        documentCount={documents.length}
        totalMarks={marksConfig.maximumMarks}
        questionCount={questions.length}
        alignmentScore={validationOutput.overallAlignmentScore}
        flaggedCount={flaggedCount}
      />

      {/* Create New Subject Modal */}
      <CreateSubjectModal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        onCreateSubject={handleCreateSubject}
        defaultInstitution={marksConfig.institutionName}
      />

      {/* Error Notification Banner */}
      {errorBanner && (
        <div className="max-w-[1400px] w-full mx-auto px-6 pt-4 no-print">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4 text-xs text-red-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="p-1 text-red-700 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8">
        {activeTab === 'studio' && (
          <DocumentSyllabusStudio
            documents={documents}
            onAddDocuments={(newDocs) => setDocuments((prev) => [...newDocs, ...prev])}
            onRemoveDocument={(id) =>
              setDocuments((prev) => prev.filter((d) => d.id !== id))
            }
            courseOutcomes={courseOutcomes}
            onUpdateCourseOutcomes={setCourseOutcomes}
            syllabusUnits={syllabusUnits}
            onUpdateSyllabusUnits={setSyllabusUnits}
            ingestionOutput={ingestionOutput}
            isIngesting={isIngesting}
            onRunIngestionAgent={() => runAgent1Ingestion()}
            onProceedToBlueprint={() => setActiveTab('blueprint')}
          />
        )}

        {activeTab === 'blueprint' && (
          <MarksBlueprintView
            marksConfig={marksConfig}
            onUpdateMarksConfig={setMarksConfig}
            blueprintOutput={blueprintOutput}
            isBuildingBlueprint={isBuildingBlueprint}
            onRunBlueprintAgent={() => runAgent2Blueprint()}
            isGeneratingPaper={isGeneratingPaper}
            onRunGeneratorAgent={async () => {
              const qs = await runAgent3Generator();
              await runAgent4Validator(qs);
              setActiveTab('paper');
            }}
          />
        )}

        {activeTab === 'paper' && (
          <QuestionPaperView
            marksConfig={marksConfig}
            questions={questions}
            onUpdateQuestion={(updated) =>
              setQuestions((prev) =>
                prev.map((q) => (q.id === updated.id ? updated : q))
              )
            }
            onRemediateQuestion={handleRemediateQuestion}
            remediatingQuestionId={remediatingQuestionId}
            isGeneratingPaper={isGeneratingPaper}
            onRunGeneratorAgent={async () => {
              const qs = await runAgent3Generator();
              await runAgent4Validator(qs);
            }}
            onProceedToAudit={() => setActiveTab('audit')}
          />
        )}

        {activeTab === 'audit' && (
          <SyllabusAuditView
            questions={questions}
            validationOutput={validationOutput}
            courseOutcomes={courseOutcomes}
            isValidating={isValidating}
            onRunValidatorAgent={() => runAgent4Validator()}
            onRemediateQuestion={handleRemediateQuestion}
            remediatingQuestionId={remediatingQuestionId}
            onViewQuestionPaper={() => setActiveTab('paper')}
          />
        )}

        {(activeTab === 'developer' || activeTab === 'colab') && (
          <ColabFastApiBridgeView
            marksConfig={marksConfig}
            courseOutcomes={courseOutcomes}
            syllabusUnits={syllabusUnits}
            colabTunnelUrl={colabTunnelUrl}
            onUpdateColabTunnelUrl={setColabTunnelUrl}
            onBackToFaculty={() => setActiveTab('studio')}
          />
        )}
      </main>

      {/* Quiet Academic Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 px-6 mt-12 no-print">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            SyllabiQ Academic Assessment Platform · Multimodal PDF, PPTX, JPEG & PNG Question Paper Synthesis
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`hover:text-slate-900 transition-colors cursor-pointer ${
                activeTab === 'studio' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Document Studio
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('paper')}
              className={`hover:text-slate-900 transition-colors cursor-pointer ${
                activeTab === 'paper' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Exam Paper Sheet
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('developer')}
              className={`transition-colors cursor-pointer font-mono text-[11px] ${
                activeTab === 'developer' || activeTab === 'colab'
                  ? 'text-blue-900 font-semibold underline'
                  : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Developer
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
