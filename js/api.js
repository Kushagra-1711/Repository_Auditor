// Global API request namespace
window.AppAPI = (function() {
  /**
   * Submits a repository audit request to the webhook.
   * @param {string} repoUrl - The URL of the GitHub repository.
   * @param {string} email - The email address to send the report to.
   * @param {string} plan - The selected pricing plan.
   * @returns {Promise<Response>} Resolves with the fetch response if successful.
   */
  async function submitAuditRequest(repoUrl, email, plan) {
    const url = window.AppConfig.WEBHOOK_URL;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl, email, plan, source: 'website' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Request failed.');
    }

    return response;
  }

  return {
    submitAuditRequest
  };
})();
