// Global pricing selection handler namespace
window.AppPricing = (function() {

  // Plans that require Razorpay payment
  var PAID_PLANS = ['growth'];

  /**
   * Binds event listeners to pricing select buttons.
   * - Free plans (starter): scroll to the audit form
   * - Paid plans (growth): initiate Razorpay checkout
   * - Enterprise: scroll to the contact form
   */
  function initPricingSelectors() {
    var pricingButtons = document.querySelectorAll('.pricing-select');
    var planSelect = document.getElementById('plan');
    var repoUrlInput = document.getElementById('repoUrl');

    pricingButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        var plan = button.getAttribute('data-plan');
        if (!plan) return;

        if (plan === 'enterprise') {
          // Enterprise: scroll to contact section
          var contactSection = document.getElementById('contact');
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;
        }

        if (PAID_PLANS.indexOf(plan) !== -1) {
          // Paid plan: initiate Razorpay checkout
          handlePaidPlan(plan, button);
          return;
        }

        // Free plan (starter): update form and scroll to it
        if (planSelect) planSelect.value = plan;
        if (repoUrlInput) repoUrlInput.focus();

        var formPanel = document.querySelector('.hero-panel');
        if (formPanel) {
          formPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }


  /**
   * Handle a paid plan selection:
   * 1. Check login status
   * 2. Create a Razorpay order via the backend
   * 3. Open Razorpay Checkout.js modal
   * 4. Verify payment on success
   */
  async function handlePaidPlan(plan, button) {
    // Must be logged in to purchase
    if (!window.AppAuth || !window.AppAuth.isLoggedIn()) {
      alert('Please log in or sign up first to subscribe to the ' + plan.charAt(0).toUpperCase() + plan.slice(1) + ' plan.');
      window.location.href = 'login.html';
      return;
    }

    // Disable button while processing
    var originalText = button.textContent;
    button.textContent = 'Processing…';
    button.disabled = true;

    try {
      // 1. Create order on the backend
      var order = await window.AppAPI.createPaymentOrder(plan);

      // 2. Open Razorpay Checkout modal
      openRazorpayCheckout(order, plan, button, originalText);

    } catch (error) {
      alert('Error: ' + (error.message || 'Could not create payment order.'));
      button.textContent = originalText;
      button.disabled = false;
    }
  }


  /**
   * Opens the Razorpay Checkout.js modal with the given order details.
   */
  function openRazorpayCheckout(order, plan, button, originalText) {
    var user = window.AppAuth.getCurrentUser();

    var options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'RepoAuditor',
      description: plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan Subscription',
      order_id: order.order_id,
      prefill: {
        name: user ? user.name : '',
        email: user ? user.email : '',
      },
      theme: {
        color: '#2563eb',
      },
      handler: function(response) {
        // Payment succeeded — verify on backend
        verifyAndConfirm(response, plan, button, originalText);
      },
      modal: {
        ondismiss: function() {
          // User closed the modal without paying
          button.textContent = originalText;
          button.disabled = false;
        },
      },
    };

    var rzp = new Razorpay(options);

    rzp.on('payment.failed', function(response) {
      alert('Payment failed: ' + (response.error.description || 'Please try again.'));
      button.textContent = originalText;
      button.disabled = false;
    });

    rzp.open();
  }


  /**
   * Verify the payment signature with the backend and show confirmation.
   */
  async function verifyAndConfirm(response, plan, button, originalText) {
    try {
      await window.AppAPI.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      // Success!
      button.textContent = '✓ Subscribed';
      button.disabled = true;
      button.classList.add('button-success');

      alert('Payment successful! You are now subscribed to the ' + plan.charAt(0).toUpperCase() + plan.slice(1) + ' plan.');

    } catch (error) {
      alert('Payment was received but verification failed. Please contact support.');
      button.textContent = originalText;
      button.disabled = false;
    }
  }


  return {
    initPricingSelectors: initPricingSelectors,
  };
})();
