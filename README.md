# SyllabiQ — Multi-Agent Question-Paper Generator & Curriculum Validator

**SyllabiQ** is a Multimodal Multi-Agent Academic Assessment Platform built with **React 19**, **Tailwind CSS**, **FastAPI (Google Colab compatible)**, and **Google Gemini (`gemini-3.8-flash`)**.

It ingests faculty course materials in **PDF, PPT/PPTX, JPEG, and PNG** formats, constructs a mathematically verified **Marks Distribution Blueprint**, generates university-grade **Examination Papers & Stepwise Marking Schemes**, and independently audits every question against the official **Syllabus Units** and **Course Learning Objectives (CO1–COn)**.

---

## Live Deployment on Standard GitHub Pages

This repository is pre-configured for automated **GitHub Pages** deployment via GitHub Actions:

- **`.github/workflows/deploy.yml`**: Automatically builds the React web application (`npm run build`) and deploys `./dist` to the `gh-pages` branch on every push to `main` or `master`.
- **Default Hosted URL**: `https://<your-github-username>.github.io/<repository-name>/`
- **`public/404.html` & `public/.nojekyll`**: Ensures clean single-page application (SPA) routing, relative subpath asset resolution, and bypasses Jekyll processing on GitHub Pages.
- **Client-Side Fallback Engine**: Enables full multimodal parsing and mock assessment generation directly in the browser if no remote backend is connected.

---

## Multi-Agent Pipeline Architecture

1. **Agent 01 — `IngestionAgent` (Multimodal Curriculum & Document Parser)**
   - Parses uploaded **PDF** handouts, **PPT/PPTX** lecture slides (including speaker notes and embedded slide images), **JPEG** whiteboard photos, and **PNG** technical diagrams.
2. **Agent 02 — `BlueprintArchitectAgent` (Marks Distribution & Bloom's Matrix)**
   - Synthesizes a question-by-question Assessment Specification Matrix matching section marks, internal `OR` choices, Course Outcome (`CO`) weights, and Bloom's Taxonomy targets (`L1: Remember` through `L6: Create`).
3. **Agent 03 — `QuestionGeneratorAgent` (University Exam & Stepwise Rubric Generator)**
   - Generates publication-ready examination questions, internal choices, model solutions, and stepwise grading schemes with 1-click export to **PDF** and **Microsoft Word (`.doc`)**.
4. **Agent 04 — `CurriculumValidatorAgent` (Syllabus & CO Auditor)**
   - Audits every generated question across 4 compliance gates (*Syllabus Fidelity*, *Course Outcome Alignment*, *Bloom's Calibration*, and *Marks Proportionality*) with 1-click **Auto-Remediation**.
