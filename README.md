<p align="center">
  <h1 align="center">RepoAuditor</h1>
  <p align="center">
    AI-powered repository health audits — security insights, code quality metrics, and actionable recommendations delivered to your inbox.
  </p>
</p>

<p align="center">
  <a href="https://repo-auditor-frontend.vercel.app">Live Site</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#getting-started">Getting Started</a>
</p>

---

## About

RepoAuditor is an AI-powered SaaS platform that analyses GitHub repositories and generates detailed audit reports covering code quality, security, architecture, dependency health, and performance. Users submit a repository URL through the web interface and receive a comprehensive report delivered via email.

The platform uses a **multi-agent AI architecture** — specialised agents each analyse a different aspect of the repository, and a final recommender agent synthesises everything into a prioritised improvement roadmap with an overall risk score (1–10).

---

## Features

### Repository Crawling

- Extracts repository metadata via the GitHub REST API
- Collects README content and documentation quality signals
- Analyses repository structure and project configuration
- Reviews dependency manifests (package.json, requirements.txt, etc.)

### Multi-Agent Analysis

| Agent | Responsibilities |
|---|---|
| **Architecture Analyser** | Project purpose, business domain, tech stack, architectural style, core modules, testing strategy, deployment patterns |
| **Security Analyser** | Security risks, exposed secrets, unsafe coding patterns, missing security practices, potential vulnerabilities |
| **Performance Analyser** | Performance bottlenecks, scalability concerns, resource-intensive components, optimisation opportunities |
| **Package Specialist** | Dependency health, package maintenance status, outdated libraries, dependency risks, ecosystem recommendations |
| **Final Recommender** | Overall repository assessment, risk summary, actionable recommendations, priority-based improvement roadmap |

### Platform Features

- 🔐 **User authentication** — sign up, log in, password reset with email verification
- 💳 **Razorpay payments** — tiered plans (Starter / Growth / Enterprise) with secure checkout
- ⭐ **User reviews** — submit ratings and feedback, aggregated average scores
- 📧 **Email delivery** — audit reports delivered via Resend transactional email
- 📬 **Contact form** — in-app query submission with email notifications
- 🛡️ **Security hardened** — rate limiting, CORS, JWT auth, bcrypt password hashing, input validation

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
| [Resend](https://resend.com/) | Transactional email delivery |
| [Razorpay](https://razorpay.com/) | Payment gateway (INR) |
| [Render](https://render.com/) | Backend hosting |
| SlowAPI | Rate limiting middleware |
| python-jose + bcrypt | JWT authentication and password hashing |

### AI / Automation

| Technology | Purpose |
|---|---|
| n8n | Workflow orchestration for multi-agent pipeline |
| Groq LLMs | Fast inference for AI agents |
| GitHub REST API | Repository data extraction |

---

## Project Structure

```
repo-auditor-frontend/
├── index.html                  # Landing page (hero, features, pricing, reviews, FAQ, contact)
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
│   ├── config.js               # API base URL configuration
│   ├── auth.js                 # Authentication (login/signup/logout)
│   ├── api.js                  # API helper functions
│   ├── ui.js                   # UI utilities (hamburger menu, etc.)
│   ├── scroll.js               # Smooth scroll behaviour
│   ├── pricing.js              # Razorpay payment integration
│   └── reviews.js              # Review submission & display
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
| `WEBHOOK_SECRET` | Shared secret for n8n webhook callbacks |
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
| `POST` | `/api/audits/{id}/complete` | Webhook callback (n8n) |
| `GET` | `/api/reports/{audit_id}` | Fetch audit report |
| `GET` | `/api/reviews` | List all reviews |
| `POST` | `/api/reviews` | Submit a review |
| `POST` | `/api/contact` | Submit a contact query |
| `POST` | `/api/payments/create-order` | Create Razorpay order |
| `POST` | `/api/payments/verify` | Verify payment signature |

---

## Deployment

### Frontend → Vercel

The frontend is a static site deployed on Vercel. Security headers and URL rewrites are configured in [`vercel.json`](vercel.json).

### Backend → Render

The FastAPI backend is deployed on Render using the [`Procfile`](server/Procfile). Environment variables are set in the Render dashboard.

### Database → Supabase

PostgreSQL is hosted on Supabase. Tables are auto-created on first startup via SQLAlchemy's `create_all()`.

---

## Workflow

```
User submits repo URL + email + plan
         │
         ▼
   Frontend (Vercel)
         │
         ▼
   FastAPI Backend (Render)
         │
         ├── Creates audit record in Supabase
         ├── Triggers n8n webhook
         │
         ▼
   n8n Workflow (Multi-Agent Pipeline)
         │
         ├── GitHub Crawler → extracts repo data
         ├── Architecture Analyser Agent
         ├── Security Analyser Agent
         ├── Performance Analyser Agent
         ├── Package Specialist Agent
         └── Final Recommender Agent
                  │
                  ▼
         Audit report delivered via Resend email
```

---

## Pricing Plans

| Plan | Price | Includes |
|---|---|---|
| **Starter** | Free | 1 audit/day, email delivery, basic insights |
| **Growth** | ₹49/mo | 10 audits/day, advanced security checks, team dashboards |
| **Enterprise** | Custom | Dedicated support, compliance reporting, SSO |

---

## Author

**Kushagra Dwivedi**

- GitHub: [@Kushagra-1711](https://github.com/Kushagra-1711)

---

## License

This project is proprietary. All rights reserved © 2026 RepoAuditor.
