# SyllabiQ — Multi-Agent Question-Paper Generator & Curriculum Validator

**SyllabiQ** is a Multimodal Multi-Agent Academic Assessment Platform built with **React 19**, **Tailwind CSS**, **FastAPI (Google Colab compatible)**, and **Google Gemini (`gemini-3.8-flash`)**.

It ingests faculty course materials in **PDF, PPT/PPTX, JPEG, and PNG** formats, constructs a mathematically verified **Marks Distribution Blueprint**, generates university-grade **Examination Papers & Stepwise Marking Schemes**, and independently audits every question against the official **Syllabus Units** and **Course Learning Objectives (CO1–COn)**.

---

## Live Deployment on GitHub Pages (`syllabiq.com`)

This repository is pre-configured for **GitHub Pages** with automated GitHub Actions CI/CD and custom domain routing for **`syllabiq.com`**:

- **`.github/workflows/deploy.yml`**: Automatically builds the React web application (`npm run build`) and deploys `./dist` to GitHub Pages on every push to `main`.
- **`public/CNAME`**: Pre-configured with `syllabiq.com` so GitHub Pages binds your custom domain automatically.
- **`public/404.html` & `public/.nojekyll`**: Ensures clean single-page application (SPA) routing and asset delivery on GitHub Pages.

### Custom Domain DNS Setup (`syllabiq.com`)

To point **`syllabiq.com`** to your GitHub Pages deployment, add the following DNS records at your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy, Google Domains):

| Type | Host / Name | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| `A` | `@` | `185.199.108.153` | Automatic / 3600 |
| `A` | `@` | `185.199.109.153` | Automatic / 3600 |
| `A` | `@` | `185.199.110.153` | Automatic / 3600 |
| `A` | `@` | `185.199.111.153` | Automatic / 3600 |
| `CNAME` | `www` | `<your-github-username>.github.io` | Automatic / 3600 |

After DNS propagation, enable **Enforce HTTPS** under **Repository Settings → Pages → Custom domain (`syllabiq.com`)**.

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
