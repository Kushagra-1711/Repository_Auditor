// Global configuration namespace
window.AppConfig = {
  // n8n webhook for audit submission (direct flow — will be replaced by FastAPI in v1.1)
  WEBHOOK_URL: 'https://n8n-production-4d14.up.railway.app/webhook/0bb3e865-950f-4091-a44d-9e716b564108',

  // FastAPI backend base URL (no trailing slash)
  API_BASE_URL: 'http://localhost:8000',
};
