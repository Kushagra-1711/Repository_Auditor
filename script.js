(function() {
  // Initialize UX interactions
  window.AppScroll.initSmoothScroll();
  window.AppPricing.initPricingSelectors();
  window.AppReviews.initReviewsSystem();

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
        window.AppUI.showMessage(resultElement, 'Please enter a valid repository URL and email address.', 'error');
        return;
      }

      // Show loading state and disable submit button
      window.AppUI.showMessage(resultElement, 'Starting audit…', 'loading');
      window.AppUI.setSubmitButtonState(form, true);

      try {
        await window.AppAPI.submitAuditRequest(repoUrl, email, plan);
        window.AppUI.showMessage(
          resultElement,
          'Audit started successfully. A full report is on its way to your inbox.',
          'success'
        );
      } catch (error) {
        window.AppUI.showMessage(
          resultElement,
          error.message || 'There was an issue submitting your request.',
          'error'
        );
      } finally {
        window.AppUI.setSubmitButtonState(form, false);
      }
    });
  });
})();
