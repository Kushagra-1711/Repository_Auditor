// Global configuration namespace
window.AppConfig = (function () {
  // Detect environment: use localhost in dev, production URL otherwise
  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return {
    // n8n webhook for audit submission (uses Respond to Webhook to return report JSON)
    WEBHOOK_URL: 'https://n8n.jollyhill-570c4ac8.australiaeast.azurecontainerapps.io/webhook/0bb3e865-950f-4091-a44d-9e716b564108',

    // FastAPI backend base URL (no trailing slash)
    API_BASE_URL: 'https://repository-auditor.onrender.com',

    // Razorpay public key (safe to expose in frontend)
    // This is populated dynamically from the backend create-order response,
    // but we keep a fallback here for the Checkout.js initialization.
    RAZORPAY_KEY_ID: 'rzp_test_T0Qh0onavj2lQ5',
  };
})();


