import { submitAuditRequest } from './js/api.js';
import { showMessage, setSubmitButtonState } from './js/ui.js';
import { initSmoothScroll } from './js/scroll.js';
import { initPricingSelectors } from './js/pricing.js';

// Initialize UX interactions
initSmoothScroll();
initPricingSelectors();

// Initialize audit submission forms
const auditForms = document.querySelectorAll('#auditForm, #auditFormSecondary');
auditForms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const repoUrl = form.querySelector('input[type="url"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const plan = form.querySelector('select')?.value || 'starter';
    const resultElement = form.querySelector('.form-message');

    if (!repoUrl || !email) {
      showMessage(resultElement, 'Please enter a valid repository URL and email address.', 'error');
      return;
    }

    // Show loading state and disable submit button
    showMessage(resultElement, 'Starting audit…', 'loading');
    setSubmitButtonState(form, true);

    try {
      await submitAuditRequest(repoUrl, email, plan);
      showMessage(
        resultElement,
        'Audit started successfully. A full report is on its way to your inbox.',
        'success'
      );
    } catch (error) {
      showMessage(
        resultElement,
        error.message || 'There was an issue submitting your request.',
        'error'
      );
    } finally {
      setSubmitButtonState(form, false);
    }
  });
});
