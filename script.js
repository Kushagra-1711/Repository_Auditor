(function() {
  'use strict';

  // ---- Auth-aware topbar ----
  updateTopbarAuth();

  // ---- Initialize UX interactions ----
  window.AppScroll.initSmoothScroll();
  window.AppPricing.initPricingSelectors();
  window.AppReviews.initReviewsSystem();

  // ---- Initialize audit submission forms ----
  var auditForms = document.querySelectorAll('#auditForm, #auditFormSecondary');
  auditForms.forEach(function(form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();

      var repoUrl = form.querySelector('input[type="url"]').value.trim();
      var email = form.querySelector('input[type="email"]').value.trim();
      var plan = form.querySelector('select') ? form.querySelector('select').value : 'starter';
      var resultElement = form.querySelector('.form-message');

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

  /**
   * Updates the topbar to show user badge + logout (logged in)
   * or Sign Up / Log In buttons (logged out).
   */
  function updateTopbarAuth() {
    var container = document.getElementById('topbarAuth');
    if (!container) return;

    if (window.AppAuth && window.AppAuth.isLoggedIn()) {
      var user = window.AppAuth.getCurrentUser();
      var initial = user.name ? user.name.charAt(0) : '?';

      container.innerHTML =
        '<div class="user-badge">' +
          '<span class="user-badge-avatar">' + initial + '</span>' +
          '<span>' + user.name + '</span>' +
        '</div>' +
        '<button class="btn-logout" id="logoutBtn">Log Out</button>';

      document.getElementById('logoutBtn').addEventListener('click', function() {
        window.AppAuth.logout();
        window.location.reload();
      });
    } else {
      container.innerHTML =
        '<a href="signup.html" class="button button-primary">Sign Up</a>' +
        '<a href="login.html" class="button button-secondary">Log In</a>';
    }
  }
})();
