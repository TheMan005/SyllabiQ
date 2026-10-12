import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Target,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  CourseOutcome,
  SyllabusUnit,
  MarksDistributionConfig,
  UploadedFacultyDocument,
  SectionMarksConfig,
} from '../types/assessment';
import { CoursePreset } from '../data/sampleCourses';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSubject: (newPreset: CoursePreset, runPipelineImmediately: boolean) => void;
  defaultInstitution: string;
}

interface QuickTemplate {
  name: string;
  code: string;
  title: string;
  department: string;
  semester: string;
  units: { unitNumber: string; title: string; topics: string }[];
  outcomes: { code: string; statement: string; weight: number }[];
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    name: 'Computer Networks (CS302)',
    code: 'CS302',
    title: 'Computer Networks & Distributed Protocols',
    department: 'Department of Computer Science & Engineering',
    semester: 'B.Tech Semester V',
    units: [
      {
        unitNumber: 'Unit I',
        title: 'Physical & Data Link Layer Protocols',
        topics: 'OSI & TCP/IP Reference Models, Framing, CRC Error Detection, Sliding Window Protocols (Go-Back-N, Selective Repeat), CSMA/CD & Ethernet 802.3',
      },
      {
        unitNumber: 'Unit II',
        title: 'Network Layer & Routing Algorithms',
        topics: 'IPv4 & IPv6 Addressing, CIDR Subnetting, Distance Vector (Bellman-Ford) vs Link State (Dijkstra OSPF) Routing, BGP Inter-Domain Routing, NAT & ICMP',
      },
      {
        unitNumber: 'Unit III',
        title: 'Transport Layer & Congestion Control',
        topics: 'UDP & TCP Segment Headers, 3-Way Handshake, Flow Control, TCP Congestion Control (Slow Start, AIMD, Fast Retransmit, Cubic), QUIC Protocol',
      },
      {
        unitNumber: 'Unit IV',
        title: 'Application Layer & Network Security',
        topics: 'DNS Hierarchy, HTTP/2 & HTTP/3, TLS 1.3 Handshake, Public Key Infrastructure, Firewalls & Software-Defined Networking (SDN)',
      },
    ],
    outcomes: [
      {
        code: 'CO1',
        statement: 'Analyze data link error recovery, CRC polynomials, and medium access control efficiency across shared channels.',
        weight: 25,
      },
      {
        code: 'CO2',
        statement: 'Design CIDR subnet allocations and evaluate convergence of Dijkstra Link-State and Bellman-Ford routing protocols.',
        weight: 25,
      },
      {
        code: 'CO3',
        statement: 'Model TCP congestion window dynamics under packet loss and compare transport reliability mechanisms.',
        weight: 25,
      },
      {
        code: 'CO4',
        statement: 'Evaluate application-layer protocol latency and cryptographic session establishment in TLS 1.3.',
        weight: 25,
      },
    ],
  },
  {
    name: 'Digital Signal Processing (EC304)',
    code: 'EC304',
    title: 'Digital Signal Processing & Filter Design',
    department: 'Department of Electronics & Communication Engineering',
    semester: 'B.Tech Semester VI',
    units: [
      {
        unitNumber: 'Unit I',
        title: 'Discrete-Time Signals, LTI Systems & Z-Transform',
        topics: 'Nyquist Sampling Theorem, Aliasing, Linear Convolution, Z-Transform Region of Convergence (ROC), Pole-Zero Stability Analysis',
      },
      {
        unitNumber: 'Unit II',
        title: 'Discrete Fourier Transform (DFT) & FFT Algorithms',
        topics: 'N-Point DFT Properties, Circular Convolution, Overlap-Add & Overlap-Save Methods, Radix-2 Decimation-in-Time (DIT) and Decimation-in-Frequency (DIF) FFT',
      },
      {
        unitNumber: 'Unit III',
        title: 'Infinite Impulse Response (IIR) Digital Filter Design',
        topics: 'Analog Butterworth & Chebyshev Prototypes, Impulse Invariance Method, Bilinear Transformation & Frequency Warping',
      },
      {
        unitNumber: 'Unit IV',
        title: 'Finite Impulse Response (FIR) Filters & Realization Structures',
        topics: 'Linear Phase FIR Conditions, Window Design (Hamming, Hanning, Kaiser), Direct Form I/II, Cascade & Lattice Filter Structures',
      },
    ],
    outcomes: [
      {
        code: 'CO1',
        statement: 'Characterize discrete-time LTI systems in the time and Z-domains using pole-zero locations and Region of Convergence.',
        weight: 25,
      },
      {
        code: 'CO2',
        statement: 'Compute N-point DFTs and analyze multiplicative complexity reductions in Radix-2 DIT/DIF Fast Fourier Transform algorithms.',
        weight: 25,
      },
      {
        code: 'CO3',
        statement: 'Design Butterworth and Chebyshev IIR digital filters using Bilinear Transformation with pre-warping compensation.',
        weight: 25,
      },
      {
        code: 'CO4',
        statement: 'Synthesize linear-phase FIR filters using Kaiser/Hamming windows and construct minimal-delay block realization structures.',
        weight: 25,
      },
    ],
  },
  {
    name: 'Molecular Biology & Genetics (BIO210)',
    code: 'BIO210',
    title: 'Cellular Signaling & Molecular Genetics',
    department: 'Department of Biotechnology & Life Sciences',
    semester: 'B.Sc / B.Tech Semester IV',
    units: [
      {
        unitNumber: 'Unit I',
        title: 'DNA Replication, Repair & Chromatin Architecture',
        topics: 'Prokaryotic & Eukaryotic Replisome Machinery, Leading vs Lagging Strand Okazaki Maturation, Mismatch & Nucleotide Excision Repair, Histone Epigenetic Modifications',
      },
      {
        unitNumber: 'Unit II',
        title: 'Transcription Regulation & RNA Processing',
        topics: 'RNA Polymerase Holoenzyme Promoters, Lac & Trp Operon Regulatory Logic, Eukaryotic 5-Prime Capping, Polyadenylation, Spliceosome Alternative Splicing',
      },
      {
        unitNumber: 'Unit III',
        title: 'Translation Ribosomal Mechanics & CRISPR Gene Editing',
        topics: 'Genetic Code Wobble Hypothesis, Aminoacyl-tRNA Synthetase Proofreading, Ribosomal A/P/E Site Translocation, CRISPR-Cas9 Guide RNA & HDR/NHEJ Repair',
      },
    ],
    outcomes: [
      {
        code: 'CO1',
        statement: 'Compare enzymatic mechanisms of prokaryotic and eukaryotic DNA replication fidelity and excision repair pathways.',
        weight: 30,
      },
      {
        code: 'CO2',
        statement: 'Analyze transcriptional control in bacterial operons and post-transcriptional alternative splicing diversity in eukaryotes.',
        weight: 35,
      },
      {
        code: 'CO3',
        statement: 'Design CRISPR-Cas9 sgRNA targeting strategies and evaluate translational proofreading energetics.',
        weight: 35,
      },
    ],
  },
];

function buildSectionsForMarks(totalMarks: number): SectionMarksConfig[] {
  if (totalMarks === 30) {
    return [
      {
        id: 'sec-a',
        sectionName: 'Section A — Core Concepts & Definitions',
        questionType: 'Short Answer',
        totalQuestionsToGenerate: 5,
        questionsToAttempt: 5,
        marksPerQuestion: 2,
        targetBloomsMix: ['L1: Remember', 'L2: Understand'],
        instructions: 'Attempt all five questions. Each question carries 2 marks.',
      },
      {
        id: 'sec-b',
        sectionName: 'Section B — Analytical & Problem Solving',
        questionType: 'Analytical / Derivation',
        totalQuestionsToGenerate: 2,
        questionsToAttempt: 2,
        marksPerQuestion: 5,
        targetBloomsMix: ['L3: Apply', 'L4: Analyze'],
        instructions: 'Attempt both questions. Show complete analytical steps.',
      },
      {
        id: 'sec-c',
        sectionName: 'Section C — System Design & Synthesis',
        questionType: 'Case Study / Long Answer',
        totalQuestionsToGenerate: 1,
        questionsToAttempt: 1,
        marksPerQuestion: 10,
        targetBloomsMix: ['L5: Evaluate', 'L6: Create'],
        instructions: 'Attempt the comprehensive synthesis question (internal choice provided).',
      },
    ];
  }

  if (totalMarks === 100) {
    return [
      {
        id: 'sec-a',
        sectionName: 'Section A — Conceptual Foundations',
        questionType: 'Short Answer',
        totalQuestionsToGenerate: 10,
        questionsToAttempt: 10,
        marksPerQuestion: 2,
        targetBloomsMix: ['L1: Remember', 'L2: Understand'],
        instructions: 'Attempt all ten short-answer questions (10 × 2 = 20 Marks).',
      },
      {
        id: 'sec-b',
        sectionName: 'Section B — Analytical Derivations & Numerical Problems',
        questionType: 'Analytical / Derivation',
        totalQuestionsToGenerate: 8,
        questionsToAttempt: 8,
        marksPerQuestion: 5,
        targetBloomsMix: ['L3: Apply', 'L4: Analyze'],
        instructions: 'Attempt all eight analytical problems (8 × 5 = 40 Marks).',
      },
      {
        id: 'sec-c',
        sectionName: 'Section C — Comprehensive Case Studies & Architecture',
        questionType: 'Case Study / Long Answer',
        totalQuestionsToGenerate: 4,
        questionsToAttempt: 4,
        marksPerQuestion: 10,
        targetBloomsMix: ['L5: Evaluate', 'L6: Create'],
        instructions: 'Attempt all four long-answer synthesis questions (4 × 10 = 40 Marks).',
      },
    ];
  }

  // Default 50 Marks
  return [
    {
      id: 'sec-a',
      sectionName: 'Section A — Conceptual & Mathematical Foundations',
      questionType: 'Short Answer',
      totalQuestionsToGenerate: 5,
      questionsToAttempt: 5,
      marksPerQuestion: 2,
      targetBloomsMix: ['L1: Remember', 'L2: Understand'],
      instructions: 'Attempt all five questions. Each question carries 2 marks.',
    },
    {
      id: 'sec-b',
      sectionName: 'Section B — Algorithmic Derivation & Analytical Problems',
      questionType: 'Analytical / Derivation',
      totalQuestionsToGenerate: 4,
      questionsToAttempt: 4,
      marksPerQuestion: 5,
      targetBloomsMix: ['L3: Apply', 'L4: Analyze'],
      instructions: 'Attempt all four analytical questions. Show complete derivations.',
    },
    {
      id: 'sec-c',
      sectionName: 'Section C — System Architecture & Case Study Synthesis',
      questionType: 'Case Study / Long Answer',
      totalQuestionsToGenerate: 2,
      questionsToAttempt: 2,
      marksPerQuestion: 10,
      targetBloomsMix: ['L5: Evaluate', 'L6: Create'],
      instructions: 'Attempt both comprehensive questions. Internal choice is provided.',
    },
  ];
}

export const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({
  isOpen,
  onClose,
  onCreateSubject,
  defaultInstitution,
}) => {
  const [courseCode, setCourseCode] = useState('CS402');
  const [courseTitle, setCourseTitle] = useState('Natural Language Processing & Sequence Models');
  const [departmentName, setDepartmentName] = useState(
    'Department of Computer Science & Engineering'
  );
  const [institutionName, setInstitutionName] = useState(defaultInstitution);
  const [semester, setSemester] = useState('B.Tech Semester VI');
  const [examTitle, setExamTitle] = useState(
    'End-Semester University Examination — Autumn 2026'
  );
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [marksPreset, setMarksPreset] = useState<30 | 50 | 100>(50);
  const [includeStarterDoc, setIncludeStarterDoc] = useState(true);
  const [runImmediately, setRunImmediately] = useState(false);

  const [units, setUnits] = useState<
    { unitNumber: string; title: string; topics: string }[]
  >([
    {
      unitNumber: 'Unit I',
      title: 'Subword Tokenization, Language Modeling & Perplexity',
      topics:
        'Byte-Pair Encoding (BPE), WordPiece, N-Gram Markov Assumptions, Laplace & Kneser-Ney Smoothing, Cross-Entropy & Perplexity Evaluation',
    },
    {
      unitNumber: 'Unit II',
      title: 'Distributed Word Representations & Sequence Labeling',
      topics:
        'Word2Vec Skip-Gram with Negative Sampling (SGNS), GloVe Co-occurrence Matrix Factorization, Hidden Markov Models (HMM) & Viterbi Decoding, Linear-Chain CRFs',
    },
    {
      unitNumber: 'Unit III',
      title: 'Encoder-Decoder Transformers & Pre-trained Language Models',
      topics:
        'Causal vs Masked Self-Attention, RoPE Positional Embeddings, KV-Cache Inference Memory Footprint, Fine-Tuning via LoRA (Low-Rank Adaptation)',
    },
  ]);

  const [outcomes, setOutcomes] = useState<
    { code: string; statement: string; weight: number }[]
  >([
    {
      code: 'CO1',
      statement:
        'Evaluate subword tokenization algorithms and compute N-gram language model perplexity under smoothing constraints.',
      weight: 30,
    },
    {
      code: 'CO2',
      statement:
        'Derive Skip-Gram negative sampling gradients and apply Viterbi dynamic programming for sequence tagging.',
      weight: 35,
    },
    {
      code: 'CO3',
      statement:
        'Analyze Transformer KV-cache memory scaling and parameter-efficient Low-Rank Adaptation (LoRA) matrices.',
      weight: 35,
    },
  ]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: QuickTemplate) => {
    setCourseCode(tpl.code);
    setCourseTitle(tpl.title);
    setDepartmentName(tpl.department);
    setSemester(tpl.semester);
    setUnits(tpl.units);
    setOutcomes(tpl.outcomes);
  };

  const handleClearBlank = () => {
    setCourseCode('');
    setCourseTitle('');
    setUnits([
      {
        unitNumber: 'Unit I',
        title: '',
        topics: '',
      },
      {
        unitNumber: 'Unit II',
        title: '',
        topics: '',
      },
    ]);
    setOutcomes([
      {
        code: 'CO1',
        statement: '',
        weight: 50,
      },
      {
        code: 'CO2',
        statement: '',
        weight: 50,
      },
    ]);
  };

  const handleAddUnitRow = () => {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const nextNum = roman[units.length] || `${units.length + 1}`;
    setUnits([
      ...units,
      {
        unitNumber: `Unit ${nextNum}`,
        title: '',
        topics: '',
      },
    ]);
  };

  const handleRemoveUnitRow = (idx: number) => {
    if (units.length <= 1) return;
    setUnits(units.filter((_, i) => i !== idx));
  };

  const handleAddOutcomeRow = () => {
    setOutcomes([
      ...outcomes,
      {
        code: `CO${outcomes.length + 1}`,
        statement: '',
        weight: 25,
      },
    ]);
  };

  const handleRemoveOutcomeRow = (idx: number) => {
    if (outcomes.length <= 1) return;
    setOutcomes(outcomes.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = (courseCode.trim() || 'SUB101').toUpperCase();
    const cleanTitle = courseTitle.trim() || 'Custom University Subject';

    const structuredOutcomes: CourseOutcome[] = outcomes
      .filter((o) => o.code.trim() || o.statement.trim())
      .map((o, idx) => ({
        code: o.code.trim().toUpperCase() || `CO${idx + 1}`,
        statement:
          o.statement.trim() ||
          `Master core concepts and analytical applications of ${cleanTitle} (Outcome ${idx + 1}).`,
        targetBlooms:
          idx === 0
            ? ['L2: Understand', 'L3: Apply']
            : idx === outcomes.length - 1
            ? ['L4: Analyze', 'L5: Evaluate']
            : ['L3: Apply', 'L4: Analyze'],
        syllabusUnits: [`Unit ${['I', 'II', 'III', 'IV', 'V'][idx] || 'I'}`],
        weightagePercent: Number(o.weight) || Math.round(100 / Math.max(1, outcomes.length)),
      }));

    const structuredUnits: SyllabusUnit[] = units
      .filter((u) => u.unitNumber.trim() || u.title.trim() || u.topics.trim())
      .map((u, idx) => {
        const parsedTopics = u.topics
          .split(/,|·|\n/)
          .map((t) => t.trim())
          .filter(Boolean);
        const mappedCo =
          structuredOutcomes[idx % Math.max(1, structuredOutcomes.length)]?.code || 'CO1';
        return {
          unitNumber: u.unitNumber.trim() || `Unit ${idx + 1}`,
          title: u.title.trim() || `Module ${idx + 1}`,
          topics:
            parsedTopics.length > 0
              ? parsedTopics
              : [u.title.trim() || `Core Principles of ${cleanTitle}`],
          contactHours: 10,
          mappedCOs: [mappedCo],
        };
      });

    const starterDocs: UploadedFacultyDocument[] = includeStarterDoc
      ? [
          {
            id: `doc-${cleanCode.toLowerCase()}-${Date.now()}`,
            name: `${cleanCode}_Lecture_Notes_and_Formulations.pdf`,
            format: 'PDF',
            mimeType: 'application/pdf',
            sizeBytes: 1140200,
            uploadedAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            pageOrSlideCount: 14,
            status: 'INGESTED',
            extractedTextPreview: structuredUnits
              .map(
                (u) =>
                  `${u.unitNumber.toUpperCase()}: ${u.title.toUpperCase()}\nKey Topics & Formulations: ${u.topics.join(
                    ' · '
                  )}\nMapped Course Outcome: ${u.mappedCOs.join(', ')}`
              )
              .join('\n\n'),
          },
          {
            id: `doc-slides-${cleanCode.toLowerCase()}-${Date.now() + 1}`,
            name: `${cleanCode}_Faculty_Slide_Deck.pptx`,
            format: 'PPTX',
            mimeType:
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            sizeBytes: 2380000,
            uploadedAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            pageOrSlideCount: 20,
            status: 'INGESTED',
            extractedTextPreview: structuredOutcomes
              .map(
                (co, i) =>
                  `--- Slide ${i * 5 + 1}: ${co.code} Assessment Focus ---\nObjective: ${
                    co.statement
                  }\nTarget Bloom's Levels: ${co.targetBlooms.join(', ')}`
              )
              .join('\n\n'),
          },
        ]
      : [];

    const marksConfig: MarksDistributionConfig = {
      examTitle: examTitle.trim() || 'End-Semester University Examination',
      institutionName: institutionName.trim() || defaultInstitution,
      departmentName: departmentName.trim() || 'Department of Academic Studies',
      courseCode: cleanCode,
      courseTitle: cleanTitle,
      semester: semester.trim() || 'Semester V',
      durationMinutes: Number(durationMinutes) || 180,
      maximumMarks: marksPreset,
      bloomsTargetPercentages: {
        rememberUnderstand: 20,
        applyAnalyze: 50,
        evaluateCreate: 30,
      },
      sections: buildSectionsForMarks(marksPreset),
    };

    const newPreset: CoursePreset = {
      id: `custom-${cleanCode.toLowerCase()}-${Date.now()}`,
      label: `${cleanCode}: ${cleanTitle}`,
      department: marksConfig.departmentName,
      marksConfig,
      courseOutcomes: structuredOutcomes,
      syllabusUnits: structuredUnits,
      sampleDocuments: starterDocs,
    };

    onCreateSubject(newPreset, runImmediately);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div>
            <p className="text-xs font-semibold text-blue-900">
              New Academic Subject & Curriculum Kit
            </p>
            <h2 className="text-lg font-bold text-slate-900">
              Create New Subject for Question-Paper Generation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Starter Templates Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">
              Quick-Fill Subject Template:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.code}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  {tpl.name}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearBlank}
                className="px-2.5 py-1 text-xs font-medium text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
              >
                Clear Fields (Blank)
              </button>
            </div>
          </div>

          {/* 1. Subject Identity & Exam Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS402"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Natural Language Processing & Sequence Models"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester / Term
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech Semester VI"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Name
              </label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Total Marks
              </label>
              <select
                value={marksPreset}
                onChange={(e) => setMarksPreset(Number(e.target.value) as 30 | 50 | 100)}
                className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value={30}>30 Marks (Mid-Semester)</option>
                <option value={50}>50 Marks (Standard Exam)</option>
                <option value={100}>100 Marks (Comprehensive)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exam Duration (Min)
              </label>
              <input
                type="number"
                min={30}
                max={240}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) || 180)}
                className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* 2. Syllabus Units Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-900" />
                <span>Syllabus Units & Topics ({units.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddUnitRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Unit</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {units.map((u, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3 items-start"
                >
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Unit I"
                      value={u.unitNumber}
                      onChange={(e) => {
                        const next = [...units];
                        next[idx] = { ...u, unitNumber: e.target.value };
                        setUnits(next);
                      }}
                      className="w-full text-xs font-mono-tabular font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Unit Title"
                      value={u.title}
                      onChange={(e) => {
                        const next = [...units];
                        next[idx] = { ...u, title: e.target.value };
                        setUnits(next);
                      }}
                      className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Comma-separated syllabus topics..."
                      value={u.topics}
                      onChange={(e) => {
                        const next = [...units];
                        next[idx] = { ...u, topics: e.target.value };
                        setUnits(next);
                      }}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveUnitRow(idx)}
                      disabled={units.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Course Learning Objectives (COs) Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-900" />
                <span>Course Learning Objectives / Outcomes ({outcomes.length} COs)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddOutcomeRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add CO</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {outcomes.map((o, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3 items-center"
                >
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="CO1"
                      value={o.code}
                      onChange={(e) => {
                        const next = [...outcomes];
                        next[idx] = { ...o, code: e.target.value };
                        setOutcomes(next);
                      }}
                      className="w-full text-xs font-mono-tabular font-bold text-blue-900 px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      placeholder="Learning objective statement..."
                      value={o.statement}
                      onChange={(e) => {
                        const next = [...outcomes];
                        next[idx] = { ...o, statement: e.target.value };
                        setOutcomes(next);
                      }}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={o.weight}
                      onChange={(e) => {
                        const next = [...outcomes];
                        next[idx] = { ...o, weight: Number(e.target.value) || 25 };
                        setOutcomes(next);
                      }}
                      className="w-full text-xs font-mono-tabular text-right px-2 py-1.5 bg-white border border-slate-300 rounded"
                    />
                    <span className="text-xs text-slate-500 font-mono-tabular">%</span>
                  </div>
                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveOutcomeRow(idx)}
                      disabled={outcomes.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Options Checkboxes */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStarterDoc}
                onChange={(e) => setIncludeStarterDoc(e.target.checked)}
                className="rounded border-slate-300 text-blue-900"
              />
              <span>
                Pre-populate starter PDF & PPTX course notes from syllabus units (you can also upload additional PDF/PPT/JPEG/PNG files)
              </span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-blue-900 cursor-pointer">
              <input
                type="checkbox"
                checked={runImmediately}
                onChange={(e) => setRunImmediately(e.target.checked)}
                className="rounded border-slate-300 text-blue-900"
              />
              <span>Run 4-Agent Pipeline immediately upon creation</span>
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              {runImmediately ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Subject & Execute 4 Agents</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Create Subject</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
