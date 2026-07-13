<p align="center">
  <h1 align="center">RepoAuditor</h1>
  <p align="center">
    AI-powered repository health audits — security insights, code quality metrics, and actionable recommendations delivered instantly.
  </p>
</p>

<p align="center">
  <a href="https://repository-auditor.vercel.app/">Live Site</a> ·
  <a href="#features">Features</a> ·
  <a href="#multi-agent-architecture">Architecture</a> ·
  <a href="#getting-started">Getting Started</a>
</p>

---

## About

RepoAuditor is an AI-powered SaaS platform that analyses GitHub repositories and generates detailed audit reports covering code quality, security, architecture, dependency health, and performance.

Users submit a repository URL through the web interface, and within minutes a comprehensive report appears on screen — powered by a **multi-agent AI pipeline** running on n8n (hosted on Microsoft Azure).

---

## Features

- 🔍 **Instant repository audits** — submit a GitHub URL and get a full report on screen
- 🤖 **Multi-agent AI analysis** — five specialised agents each analyse a different dimension
- 📊 **Risk score dashboard** — animated gauge with severity classification
- 🚨 **Prioritised action items** — critical, short-term, and long-term recommendations
- 🔐 **User authentication** — sign up, log in, password reset with email verification
- 💳 **Razorpay payments** — tiered plans (Starter / Growth / Enterprise) with secure checkout
- ⭐ **User reviews** — submit ratings and feedback with aggregated average scores
- 📬 **Contact form** — in-app query submission with email notifications
- 🖨️ **Print-friendly reports** — clean print layout for offline sharing
- 🛡️ **Security hardened** — rate limiting, CORS, JWT auth, bcrypt hashing, input validation

---

## Multi-Agent Architecture

RepoAuditor uses a **multi-agent AI pipeline** orchestrated by [n8n](https://n8n.io/) running on **Microsoft Azure Container Apps**. When a user submits a repository URL, the following agents work together to produce a comprehensive audit:

```
  User submits repo URL + plan
           │
           ▼
     Frontend (Vercel)
           │
           ▼
     n8n Webhook (Azure)
           │
           ▼
  ┌─────────────────────┐
  │   GitHub Crawler     │  Extracts repo metadata, file tree,
  │                      │  dependency manifests, and key files
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │ Architecture Agent   │  Analyses project structure, tech stack,
  │  (Groq LLM)         │  build systems, and architectural patterns
  └─────────┬───────────┘
            │
     ┌──────┼──────┐         Three specialist agents run
     │      │      │         in parallel on the architecture
     ▼      ▼      ▼         analysis output
  ┌──────┐┌──────┐┌──────┐
  │ 🔒   ││ ⚡   ││ 📦   │
  │Secur-││Perf- ││Depen-│
  │ity   ││orma- ││dency │
  │Agent ││nce   ││Agent │
  │      ││Agent ││      │
  └──┬───┘└──┬───┘└──┬───┘
     │       │       │
     └───────┼───────┘
             │
             ▼
  ┌─────────────────────┐
  │  Final Recommender   │  Synthesises all findings into a
  │  Agent (Groq LLM)   │  prioritised roadmap with risk score
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  Respond to Webhook  │  Returns JSON report directly
  │                      │  to the frontend
  └─────────────────────┘
            │
            ▼
     Report Dashboard
     (rendered in browser)
```

### Agent Details

| Agent | Role | Output |
|---|---|---|
| **GitHub Crawler** | Fetches repo metadata, file tree, dependency manifests, and high-value files (README, Dockerfile, etc.) via the GitHub REST API | Repository context document |
| **Architecture Analyser** | Determines project purpose, business domain, tech stack, languages, architecture style, build/deploy systems, testing frameworks, and core modules | Structured architecture JSON |
| **Security Analyser** | Identifies supply-chain risks, dependency vulnerabilities, authentication/authorization gaps, secrets management issues, and build pipeline risks | Risk score + critical findings |
| **Performance Analyser** | Evaluates runtime bottlenecks, scalability concerns, memory issues, build performance, and rendering performance | Performance score + bottlenecks |
| **Dependency Specialist** | Assesses dependency complexity, upgrade difficulty, maintenance risk, and ecosystem health | Dependency health score + risks |
| **Final Recommender** | Resolves conflicts between agent findings, ranks risks, prioritises fixes, and creates an engineering roadmap | Overall risk score (0–100) + prioritised action plan |

All agents use **Groq LLMs** (Llama 3.3 70B) for fast inference. The entire pipeline completes in approximately 2–5 minutes.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| HTML5, CSS3, JavaScript | Core UI — no framework, fully static |
| Vercel | Frontend hosting with security headers |
| Razorpay Checkout.js | Client-side payment integration |

### Backend

| Technology | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | Python async API framework |
| [SQLAlchemy](https://www.sqlalchemy.org/) + asyncpg | Async ORM with PostgreSQL driver |
| [Supabase](https://supabase.com/) (PostgreSQL) | Managed database |
| [Resend](https://resend.com/) | Transactional email (password resets, contact) |
| [Razorpay](https://razorpay.com/) | Payment gateway (INR) |
| [Render](https://render.com/) | Backend API hosting |
| SlowAPI | Rate limiting middleware |
| python-jose + bcrypt | JWT authentication and password hashing |

### AI / Automation

| Technology | Purpose |
|---|---|
| [n8n](https://n8n.io/) | Workflow orchestration for the multi-agent pipeline |
| Microsoft Azure Container Apps | n8n hosting infrastructure |
| Groq LLMs (Llama 3.3 70B) | Fast inference for all AI agents |
| GitHub REST API | Repository data extraction |

---

## Report Dashboard

When an audit completes, the user is redirected to a premium report dashboard featuring:

- **Risk Score Gauge** — animated circular gauge with colour-coded severity (Low / Medium / High / Critical)
- **Critical Actions** — high-priority issues requiring immediate attention (red)
- **Short-Term Actions** — improvements for the next sprint cycle (amber)
- **Long-Term Actions** — strategic roadmap items (blue)
- **Final Recommendation** — synthesised summary from the Final Recommender agent
- **Print Support** — clean print layout for offline sharing

---

## Project Structure

```
repo-auditor-frontend/
├── index.html                  # Landing page (hero, features, pricing, reviews, FAQ, contact)
├── report.html                 # Audit report dashboard
├── login.html                  # Login page
├── signup.html                 # Registration page
├── forgot-password.html        # Password reset request
├── reset-password.html         # Password reset form
├── privacy-policy.html         # Privacy policy
├── terms-of-service.html       # Terms of service
├── styles.css                  # Global stylesheet
├── script.js                   # Main page logic (audit form, FAQ, contact)
├── vercel.json                 # Vercel deployment & security headers
│
├── js/                         # Modular frontend scripts
│   ├── config.js               # API URLs & webhook configuration
│   ├── auth.js                 # Authentication (login/signup/logout)
│   ├── api.js                  # API helper functions
│   ├── ui.js                   # UI utilities (messages, button states)
│   ├── scroll.js               # Smooth scroll behaviour
│   ├── pricing.js              # Razorpay payment integration
│   ├── reviews.js              # Review submission & display
│   └── report.js               # Report dashboard rendering & gauge animation
│
└── server/                     # FastAPI backend
    ├── main.py                 # App entry point, middleware, router mounting
    ├── config.py               # Environment variable loading & validation
    ├── schemas.py              # Pydantic request/response models
    ├── requirements.txt        # Python dependencies
    ├── Procfile                # Render deployment command
    ├── .env.example            # Environment variable template
    │
    ├── db/
    │   ├── database.py         # Async SQLAlchemy engine & session
    │   └── models.py           # ORM models (User, Audit, Review, Contact)
    │
    ├── routes/
    │   ├── auth.py             # /api/auth/* — register, login, password reset
    │   ├── audits.py           # /api/audits/* — create & manage audits
    │   ├── reports.py          # /api/reports/* — fetch audit reports
    │   ├── reviews.py          # /api/reviews/* — CRUD for user reviews
    │   ├── contact.py          # /api/contact — contact form submissions
    │   └── payments.py         # /api/payments/* — Razorpay order & verification
    │
    └── utils/
        ├── email.py            # Resend email helper
        └── security.py         # JWT creation/verification, password hashing
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- A [Supabase](https://supabase.com/) project (PostgreSQL)
- API keys for [Resend](https://resend.com/), [Razorpay](https://razorpay.com/)
- n8n instance (self-hosted or cloud)

### 1. Clone the repository

```bash
git clone https://github.com/Kushagra-1711/Repository_Auditor.git
cd Repository_Auditor
```

### 2. Set up the backend

```bash
cd server
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in your actual values
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | Random secret for signing JWTs (`openssl rand -hex 32`) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | Verified sender email address |
| `FRONTEND_URL` | Frontend origin for CORS and email links |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |

### 4. Run the backend

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at `/docs`.

### 5. Serve the frontend

Open `index.html` directly or use a local server:

```bash
# From the project root
python -m http.server 5500
```

Then visit `http://localhost:5500`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Log in and receive JWT |
| `POST` | `/api/auth/forgot-password` | Request password reset email |
| `POST` | `/api/auth/reset-password` | Reset password with token |
| `POST` | `/api/audits` | Create a new audit |
| `GET` | `/api/audits/{id}` | Get audit status |
| `GET` | `/api/reports/{audit_id}` | Fetch audit report |
| `GET` | `/api/reviews` | List all reviews |
| `POST` | `/api/reviews` | Submit a review |
| `POST` | `/api/contact` | Submit a contact query |
| `POST` | `/api/payments/create-order` | Create Razorpay order |
| `POST` | `/api/payments/verify` | Verify payment signature |

---

## Deployment

| Component | Platform |
|---|---|
| **Frontend** | [Vercel](https://vercel.com/) — static hosting with security headers via `vercel.json` |
| **Backend API** | [Render](https://render.com/) — FastAPI with `Procfile` |
| **Database** | [Supabase](https://supabase.com/) — managed PostgreSQL, auto-created tables |
| **n8n Pipeline** | [Microsoft Azure](https://azure.microsoft.com/) — Container Apps |
| **AI Inference** | [Groq](https://groq.com/) — Llama 3.3 70B |

---

## Pricing Plans

| Plan | Price | Includes |
|---|---|---|
| **Starter** | Free | 1 audit/day, basic insights |
| **Growth** | ₹49/mo | 10 audits/day, advanced security checks, team dashboards |
| **Enterprise** | Custom | Dedicated support, compliance reporting, SSO |

---

## Author

**Kushagra Dwivedi**

- GitHub: [@Kushagra-1711](https://github.com/Kushagra-1711)

---

## License

This project is proprietary. All rights reserved © 2026 RepoAuditor.
