// Global API request namespace
window.AppAPI = (function() {

  /**
   * Build headers object, optionally including the JWT Bearer token.
   * @param {boolean} [auth=false] - Whether to include the Authorization header.
   * @returns {Object} Headers object.
   */
  function buildHeaders(auth) {
    var headers = { 'Content-Type': 'application/json' };
    if (auth && window.AppAuth) {
      var token = window.AppAuth.getToken();
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
    }
    return headers;
  }

  /**
   * Submits a repository audit request to the n8n webhook.
   * n8n responds via "Respond to Webhook" with the full report JSON.
   * @param {string} repoUrl - The URL of the GitHub repository.
   * @param {string} plan - The selected pricing plan.
   * @returns {Promise<Object>} Resolves with the parsed report data.
   */
  async function submitAuditRequest(repoUrl, plan) {
    var url = window.AppConfig.WEBHOOK_URL;
    var response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl: repoUrl, plan: plan, source: 'website' }),
    });

    if (!response.ok) {
      var errorText = await response.text();
      throw new Error(errorText || 'Audit request failed.');
    }

    var data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid response from audit service.');
    }

    return data;
  }

  /**
   * Submit a contact form message.
   * @param {{ name: string, email: string, subject: string, message: string }} data
   * @returns {Promise<Object>}
   */
  async function submitContactForm(data) {
    var url = window.AppConfig.API_BASE_URL + '/api/contact';
    var response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    var result;
    try { result = await response.json(); } catch (e) { result = null; }

    if (!response.ok) {
      throw new Error((result && result.detail) || 'Failed to send message.');
    }

    return result;
  }

  /**
   * Create a Razorpay payment order for the given plan.
   * Requires authentication.
   * @param {string} plan - The plan to purchase (e.g. 'growth').
   * @returns {Promise<{order_id: string, amount: number, currency: string, key_id: string}>}
   */
  async function createPaymentOrder(plan) {
    var url = window.AppConfig.API_BASE_URL + '/api/payments/create-order';
    var response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify({ plan: plan }),
    });

    var result;
    try { result = await response.json(); } catch (e) { result = null; }

    if (!response.ok) {
      throw new Error((result && result.detail) || 'Failed to create payment order.');
    }

    return result;
  }

  /**
   * Verify a completed Razorpay payment.
   * Requires authentication.
   * @param {{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }} data
   * @returns {Promise<Object>}
   */
  async function verifyPayment(data) {
    var url = window.AppConfig.API_BASE_URL + '/api/payments/verify';
    var response = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(data),
    });

    var result;
    try { result = await response.json(); } catch (e) { result = null; }

    if (!response.ok) {
      throw new Error((result && result.detail) || 'Payment verification failed.');
    }

    return result;
  }

  return {
    submitAuditRequest: submitAuditRequest,
    submitContactForm: submitContactForm,
    createPaymentOrder: createPaymentOrder,
    verifyPayment: verifyPayment,
    buildHeaders: buildHeaders,
  };
})();
