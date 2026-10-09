import { MarksDistributionConfig, CourseOutcome, SyllabusUnit } from '../types/assessment';

export function generateFastAPIPythonCode(
  config: MarksDistributionConfig,
  courseOutcomes: CourseOutcome[],
  syllabusUnits: SyllabusUnit[]
): string {
  return `"""
SyllabiQ — Multi-Agent Academic Question Paper Generator & Syllabus Validator
FastAPI Backend Service (Compatible with Google Colab & Local/Cloud Uvicorn)

Agents Implemented:
  1. IngestionAgent: Multimodal parser for PDF, PPTX, JPEG, and PNG faculty documents
  2. BlueprintArchitectAgent: Marks distribution & Bloom's taxonomy matrix planner
  3. QuestionGeneratorAgent: University examination paper & marking scheme creator
  4. CurriculumValidatorAgent: Syllabus fidelity & Course Outcome (CO) auditor
"""

import os
import io
import json
import base64
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

# Optional document parsers installed in Colab environment
try:
    import fitz  # PyMuPDF for PDF inspection
except ImportError:
    fitz = None

try:
    from pptx import Presentation  # python-pptx for PPT/PPTX slide extraction
except ImportError:
    Presentation = None

app = FastAPI(
    title="SyllabiQ Multi-Agent Assessment API",
    description="FastAPI Multi-Agent orchestrator for multimodal question paper generation and syllabus validation",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_gemini_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable not set.")
    return genai.Client(api_key=api_key)

def extract_pptx_content(file_bytes: bytes, filename: str) -> str:
    """Extracts structured slide titles, bullet points, and speaker notes from PPTX."""
    if Presentation is None:
        return f"[PPTX Document: {filename}]"
    prs = Presentation(io.BytesIO(file_bytes))
    slides_text = []
    for idx, slide in enumerate(prs.slides, start=1):
        slide_lines = [f"--- Slide {idx} ---"]
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    text = paragraph.text.strip()
                    if text:
                        slide_lines.append(text)
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
            notes = slide.notes_slide.notes_text_frame.text.strip()
            if notes:
                slide_lines.append(f"[Speaker Notes]: {notes}")
        slides_text.append("\\n".join(slide_lines))
    return "\\n\\n".join(slides_text)

class DocumentPayload(BaseModel):
    name: str
    format: str
    mimeType: str
    base64Data: Optional[str] = None
    extractedTextPreview: Optional[str] = None

class PipelineRequest(BaseModel):
    documents: List[DocumentPayload]
    syllabusUnits: List[Dict[str, Any]]
    courseOutcomes: List[Dict[str, Any]]
    marksConfig: Dict[str, Any]

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "engine": "FastAPI Multi-Agent Orchestrator",
        "model": "gemini-3.8-flash",
        "agents": ["IngestionAgent", "BlueprintArchitectAgent", "QuestionGeneratorAgent", "CurriculumValidatorAgent"]
    }

@app.post("/api/agents/run-pipeline")
async def run_multi_agent_pipeline(payload: PipelineRequest):
    client = get_gemini_client()
    multimodal_parts = []

    for doc in payload.documents:
        if doc.base64Data and doc.mimeType in ["application/pdf", "image/jpeg", "image/png", "image/webp"]:
            raw_bytes = base64.b64decode(doc.base64Data)
            multimodal_parts.append(
                types.Part.from_bytes(data=raw_bytes, mime_type=doc.mimeType)
            )
        elif doc.base64Data and ("presentation" in doc.mimeType or doc.name.endswith(".pptx")):
            raw_bytes = base64.b64decode(doc.base64Data)
            slide_text = extract_pptx_content(raw_bytes, doc.name)
            multimodal_parts.append(types.Part.from_text(text=f"PPTX Content ({doc.name}):\\n{slide_text}"))
        elif doc.extractedTextPreview:
            multimodal_parts.append(types.Part.from_text(text=f"Document ({doc.name}):\\n{doc.extractedTextPreview}"))

    # Agent 1: Multimodal Curriculum & Document Ingestion Agent
    agent1_prompt = f"""
    You are Agent 1 (Multimodal Document Ingestion & Concept Mapping Agent).
    Analyze the uploaded PDF, PPTX, JPEG, and PNG materials against the following Syllabus Units and Course Outcomes:
    Syllabus Units: {json.dumps(payload.syllabusUnits)}
    Course Outcomes: {json.dumps(payload.courseOutcomes)}
    Return a JSON object containing 'summary', 'totalDocumentsProcessed', 'extractedConcepts', 'coverageByUnit', and 'unmatchedSyllabusTopics'.
    """
    resp1 = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=[*multimodal_parts, types.Part.from_text(text=agent1_prompt)],
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.2)
    )
    ingestion_result = json.loads(resp1.text)

    # Agent 2: Assessment Blueprint & Marks Distribution Architect
    agent2_prompt = f"""
    You are Agent 2 (Assessment Blueprint & Marks Distribution Architect).
    Using the extracted knowledge digest from Agent 1: {json.dumps(ingestion_result)}
    And the Faculty Marks Distribution Configuration: {json.dumps(payload.marksConfig)}
    Construct an exact question-by-question Assessment Blueprint matrix.
    """
    resp2 = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=agent2_prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.2)
    )
    blueprint_result = json.loads(resp2.text)

    # Agent 3: Question Paper & Marking Scheme Generator
    agent3_prompt = f"""
    You are Agent 3 (Academic Question Paper & Stepwise Marking Scheme Generator).
    Draft rigorous university examination questions for every slot in Agent 2's blueprint:
    Blueprint: {json.dumps(blueprint_result)}
    Knowledge Digest: {json.dumps(ingestion_result)}
    Include detailed answer keys and stepwise marking schemes.
    """
    resp3 = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=[*multimodal_parts, types.Part.from_text(text=agent3_prompt)],
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.3)
    )
    questions_result = json.loads(resp3.text)

    # Agent 4: Syllabus & Learning Objectives Validator
    agent4_prompt = f"""
    You are Agent 4 (Syllabus & Learning Objectives Auditor Agent).
    Audit every generated question against the official syllabus and Course Outcomes (COs):
    Generated Questions: {json.dumps(questions_result)}
    Syllabus Units: {json.dumps(payload.syllabusUnits)}
    Course Outcomes: {json.dumps(payload.courseOutcomes)}
    Marks Configuration: {json.dumps(payload.marksConfig)}
    Verify syllabus fidelity, CO alignment, Bloom's taxonomy calibration, and exact marks sum.
    """
    resp4 = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=agent4_prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1)
    )
    validation_result = json.loads(resp4.text)

    return {
        "ingestion": ingestion_result,
        "blueprint": blueprint_result,
        "questions": questions_result,
        "validation": validation_result
    }
`;
}

export function generateColabNotebookJson(
  config: MarksDistributionConfig,
  courseOutcomes: CourseOutcome[],
  syllabusUnits: SyllabusUnit[]
): string {
  const fastApiCode = generateFastAPIPythonCode(config, courseOutcomes, syllabusUnits);

  const notebook = {
    nbformat: 4,
    nbformat_minor: 0,
    metadata: {
      colab: {
        provenance: [],
        name: `SyllabiQ_MultiAgent_${config.courseCode}_Colab.ipynb`,
      },
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
      },
      language_info: {
        name: 'python',
      },
    },
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          `# SyllabiQ — Multi-Agent Question-Paper Generator & Syllabus Validator\n`,
          `### Configured for **${config.courseCode}: ${config.courseTitle}** (${config.maximumMarks} Marks)\n\n`,
          `This Google Colab notebook provisions the **4-Agent Academic Assessment Pipeline** powered by **FastAPI** and **Google Gemini (\`gemini-3.8-flash\`)**.\n\n`,
          `- **Agent 1 (` + '`IngestionAgent`' + `)**: Multimodal ingestion of **PDF, PPT/PPTX, JPEG, and PNG** course materials.\n`,
          `- **Agent 2 (` + '`BlueprintArchitectAgent`' + `)**: Marks distribution and Bloom's taxonomy specification matrix builder.\n`,
          `- **Agent 3 (` + '`QuestionGeneratorAgent`' + `)**: University exam question paper and stepwise marking scheme generator.\n`,
          `- **Agent 4 (` + '`CurriculumValidatorAgent`' + `)**: Automated audit against official syllabus units and Course Learning Objectives (COs).`,
        ],
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step 1: Install FastAPI, Google GenAI SDK, and Multimodal Document Parsers (PDF, PPTX, Images)\n`,
          `!pip install -q fastapi uvicorn pyngrok python-multipart google-genai pymupdf python-pptx pillow nest_asyncio`,
        ],
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step 2: Configure your Gemini API Key in Google Colab Secrets or environment\n`,
          `import os\n`,
          `from google.colab import userdata\n\n`,
          `try:\n`,
          `    os.environ["GEMINI_API_KEY"] = userdata.get("GEMINI_API_KEY")\n`,
          `    print("Loaded GEMINI_API_KEY from Colab Secrets.")\n`,
          `except Exception:\n`,
          `    # Or set your key in Colab Secrets under 'GEMINI_API_KEY'\n`,
          `    print("Please add GEMINI_API_KEY to your Google Colab Secrets panel on the left sidebar.")`,
        ],
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step 3: Write the FastAPI Multi-Agent Backend (fastapi_main.py)\n`,
          `%%writefile fastapi_main.py\n`,
          fastApiCode,
        ],
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step 4: Direct Interactive File Upload in Google Colab (Optional Standalone Execution)\n`,
          `from google.colab import files\n`,
          `import base64, json\n`,
          `from fastapi_main import PipelineRequest, DocumentPayload, run_multi_agent_pipeline\n\n`,
          `print("Upload your course PDF, PPTX, JPEG, or PNG files:")\n`,
          `uploaded = files.upload()\n\n`,
          `docs = []\n`,
          `for fname, content in uploaded.items():\n`,
          `    ext = fname.lower().split('.')[-1]\n`,
          `    mime = "application/pdf" if ext == "pdf" else ("image/png" if ext == "png" else ("image/jpeg" if ext in ["jpg", "jpeg"] else "application/vnd.openxmlformats-officedocument.presentationml.presentation"))\n`,
          `    docs.append(DocumentPayload(\n`,
          `        name=fname,\n`,
          `        format=ext.upper(),\n`,
          `        mimeType=mime,\n`,
          `        base64Data=base64.b64encode(content).decode("utf-8")\n`,
          `    ))\n`,
          `print(f"Prepared {len(docs)} multimodal faculty documents for Agent 1.")`,
        ],
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          `# Step 5: Launch FastAPI Server & Expose Public Tunnel URL for the React Dashboard\n`,
          `import nest_asyncio\n`,
          `import uvicorn\n`,
          `from threading import Thread\n\n`,
          `nest_asyncio.apply()\n\n`,
          `def run_server():\n`,
          `    uvicorn.run("fastapi_main:app", host="0.0.0.0", port=8000, log_level="info")\n\n`,
          `server_thread = Thread(target=run_server, daemon=True)\n`,
          `server_thread.start()\n`,
          `print("FastAPI Multi-Agent Server listening on port 8000.")`,
        ],
      },
    ],
  };

  return JSON.stringify(notebook, null, 2);
}
