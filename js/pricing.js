// Global pricing selection handler namespace
window.AppPricing = (function() {
  /**
   * Binds event listeners to pricing select buttons.
   * When clicked, updates the selected plan in the primary audit form, 
   * focuses the repository URL input, and scrolls the form into view.
   */
  function initPricingSelectors() {
    const pricingButtons = document.querySelectorAll('.pricing-select');
    const planSelect = document.getElementById('plan');
    const repoUrlInput = document.getElementById('repoUrl');

    if (!planSelect || !repoUrlInput) return;

    pricingButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const plan = button.getAttribute('data-plan');
        if (plan) {
          planSelect.value = plan;
          repoUrlInput.focus();
          
          // Smoothly scroll the hero form panel into view for better user experience
          const formPanel = document.querySelector('.hero-panel');
          if (formPanel) {
            formPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    });
  }

  return {
    initPricingSelectors
  };
})();
