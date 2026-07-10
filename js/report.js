/**
 * Report Dashboard — js/report.js
 *
 * Reads audit report data from sessionStorage and renders the
 * dashboard UI with animated risk gauge, action cards, and
 * final recommendation.
 */
(function () {
  'use strict';

  var REPORT_KEY = 'repoauditor_report';
  var REPORT_META_KEY = 'repoauditor_report_meta';

  /* ---- DOM refs ---- */
  var loadingEl = document.getElementById('reportLoading');
  var errorEl = document.getElementById('reportError');
  var dashboardEl = document.getElementById('reportDashboard');
  var errorMessageEl = document.getElementById('reportErrorMessage');

  /* ---- Initialize ---- */
  init();

  function init() {
    var raw = sessionStorage.getItem(REPORT_KEY);
    var meta = null;
    try { meta = JSON.parse(sessionStorage.getItem(REPORT_META_KEY)); } catch (e) { /* ignore */ }

    if (!raw) {
      showError('No report data found. Please run an audit from the home page.');
      return;
    }

    var report;
    try {
      report = JSON.parse(raw);
    } catch (e) {
      showError('Report data is corrupted. Please run a new audit.');
      return;
    }

    renderReport(report, meta);
  }

  /* ---- Render Functions ---- */

  function renderReport(report, meta) {
    // Show dashboard, hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';
    if (dashboardEl) dashboardEl.style.display = 'block';

    // Header
    var repoNameEl = document.getElementById('reportRepoName');
    var timestampEl = document.getElementById('reportTimestamp');
    if (repoNameEl && meta && meta.repoUrl) {
      var match = meta.repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
      repoNameEl.textContent = match ? match[1] : meta.repoUrl;
    } else if (repoNameEl) {
      repoNameEl.textContent = 'Repository Audit';
    }
    if (timestampEl) {
      var date = meta && meta.timestamp ? new Date(meta.timestamp) : new Date();
      timestampEl.textContent = 'Generated on ' + date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    }

    // Risk Score Gauge
    var score = typeof report.overallRiskScore === 'number' ? report.overallRiskScore : 0;
    animateGauge(score);

    // Severity Badge
    var severityBadge = document.getElementById('severityBadge');
    if (severityBadge) {
      var severity = getSeverity(score);
      severityBadge.textContent = severity.label;
      severityBadge.className = 'severity-badge severity-' + severity.level;
    }

    // Final Recommendation
    var recEl = document.getElementById('finalRecommendation');
    if (recEl) {
      recEl.textContent = report.finalRecommendation || 'No specific recommendation provided.';
    }

    // Action Lists
    renderActionList('criticalActionsList', 'criticalCount', report.criticalActions, 'critical');
    renderActionList('shortTermActionsList', 'shortTermCount', report.shortTermActions, 'warning');
    renderActionList('longTermActionsList', 'longTermCount', report.longTermActions, 'info');

    // Print button
    var printBtn = document.getElementById('printReportBtn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }
  }

  function animateGauge(score) {
    var gaugeNumber = document.getElementById('gaugeNumber');
    var gaugeFill = document.getElementById('gaugeFill');

    if (!gaugeFill || !gaugeNumber) return;

    // Calculate stroke dashoffset for the circular gauge
    var radius = 85;
    var circumference = 2 * Math.PI * radius;
    gaugeFill.style.strokeDasharray = circumference;
    gaugeFill.style.strokeDashoffset = circumference;

    // Set color based on score
    var severity = getSeverity(score);
    gaugeFill.style.stroke = severity.color;

    // Animate the fill
    var targetOffset = circumference - (score / 100) * circumference;

    requestAnimationFrame(function () {
      setTimeout(function () {
        gaugeFill.style.transition = 'stroke-dashoffset 1.5s ease-out';
        gaugeFill.style.strokeDashoffset = targetOffset;
      }, 100);
    });

    // Animate the number
    animateNumber(gaugeNumber, 0, score, 1500);
  }

  function animateNumber(element, start, end, duration) {
    var range = end - start;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      element.textContent = Math.round(start + range * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function getSeverity(score) {
    if (score >= 75) return { level: 'critical', label: 'Critical Risk', color: '#dc2626' };
    if (score >= 50) return { level: 'high', label: 'High Risk', color: '#ea580c' };
    if (score >= 25) return { level: 'medium', label: 'Medium Risk', color: '#d97706' };
    return { level: 'low', label: 'Low Risk', color: '#16a34a' };
  }

  function renderActionList(listId, countId, actions, type) {
    var listEl = document.getElementById(listId);
    var countEl = document.getElementById(countId);

    if (!listEl) return;

    if (!actions || actions.length === 0) {
      countEl && (countEl.textContent = '0');
      return; // Keep the "no actions" placeholder
    }

    countEl && (countEl.textContent = actions.length);
    listEl.innerHTML = '';

    actions.forEach(function (action, index) {
      var card = document.createElement('div');
      card.className = 'action-card action-card-' + type;
      card.style.animationDelay = (index * 0.08) + 's';

      var number = document.createElement('span');
      number.className = 'action-number';
      number.textContent = index + 1;

      var text = document.createElement('p');
      text.className = 'action-text';
      text.textContent = typeof action === 'string' ? action : JSON.stringify(action);

      card.appendChild(number);
      card.appendChild(text);
      listEl.appendChild(card);
    });
  }

  function showError(message) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (dashboardEl) dashboardEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'flex';
    if (errorMessageEl) errorMessageEl.textContent = message;
  }

  /* ---- Loading step animation (called from external) ---- */
  var stepIndex = 0;
  var stepInterval = null;

  window.AppReport = {
    /**
     * Show the loading overlay and animate through steps.
     */
    showLoading: function () {
      if (loadingEl) loadingEl.style.display = 'flex';
      if (dashboardEl) dashboardEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'none';

      stepIndex = 0;
      clearInterval(stepInterval);

      // Animate through loading steps
      stepInterval = setInterval(function () {
        stepIndex++;
        if (stepIndex > 6) {
          clearInterval(stepInterval);
          return;
        }
        var stepEl = document.getElementById('step' + stepIndex);
        if (stepEl) stepEl.classList.add('active');
      }, 8000); // ~8s per step to cover ~45s total
    },

    /**
     * Show the error state.
     */
    showError: showError,

    /**
     * Stop the loading animation.
     */
    stopLoading: function () {
      clearInterval(stepInterval);
    },
  };

})();
