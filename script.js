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

  // ---- Initialize contact form ----
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      var name = document.getElementById('contactName').value.trim();
      var email = document.getElementById('contactEmail').value.trim();
      var subject = document.getElementById('contactSubject').value.trim();
      var message = document.getElementById('contactMessage').value.trim();
      var resultElement = document.getElementById('contactResult');

      if (!name || !email || !subject || !message) {
        window.AppUI.showMessage(resultElement, 'Please fill in all fields.', 'error');
        return;
      }

      window.AppUI.showMessage(resultElement, 'Sending…', 'loading');
      window.AppUI.setSubmitButtonState(contactForm, true);

      try {
        var result = await window.AppAPI.submitContactForm({ name: name, email: email, subject: subject, message: message });
        window.AppUI.showMessage(resultElement, result.message || 'Message sent!', 'success');
        contactForm.reset();
      } catch (error) {
        window.AppUI.showMessage(resultElement, error.message || 'Failed to send. Please try again.', 'error');
      } finally {
        window.AppUI.setSubmitButtonState(contactForm, false);
      }
    });
  }

  // ---- FAQ accordion ----
  var faqItems = document.querySelectorAll('.faq-question');
  faqItems.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = btn.parentElement;
      var isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item').forEach(function(el) {
        el.classList.remove('open');
      });

      // Toggle clicked
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // ---- Mobile hamburger menu ----
  var hamburger = document.getElementById('hamburgerBtn');
  var navLinks = document.querySelector('.topbar .nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('nav-open');
      hamburger.classList.toggle('active');
    });
  }

  /**
   * Updates the topbar to show user badge + logout (logged in)
   * or Sign Up / Log In buttons (logged out).
   */
  function updateTopbarAuth() {
    var container = document.getElementById('topbarAuth');
    if (!container) return;

    if (window.AppAuth && window.AppAuth.isLoggedIn()) {
      var user = window.AppAuth.getCurrentUser();
      var initial = user && user.name ? user.name.charAt(0) : '?';
      var displayName = user && user.name ? user.name : 'User';

      container.innerHTML =
        '<div class="user-badge">' +
          '<span class="user-badge-avatar">' + initial + '</span>' +
          '<span>' + displayName + '</span>' +
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
