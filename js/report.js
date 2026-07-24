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
      // Raw might be plain text/HTML from n8n (not JSON)
      report = parseMarkdownReport(raw);
      renderReport(report, meta);
      return;
    }

    // Normalize: the n8n response may come in various shapes
    report = normalizeReport(report);

    renderReport(report, meta);
  }

  /**
   * Normalize any n8n response shape into the structured format the dashboard needs.
   * Handles: {report: "markdown"}, {html: "..."}, {overallRiskScore: ...}, etc.
   */
  function normalizeReport(data) {
    // Already structured with expected fields — use as-is
    if (typeof data.overallRiskScore === 'number' && Array.isArray(data.criticalActions)) {
      return data;
    }

    // Find the markdown/HTML text in whichever field n8n put it
    var text = data.report || data.html || data.output || data.result || data.response || '';

    if (typeof text === 'string' && text.length > 0) {
      return parseMarkdownReport(text);
    }

    // If data is deeply nested (e.g., { fullData: { body: { html: "..." } } })
    if (data.fullData && data.fullData.body && data.fullData.body.html) {
      return parseMarkdownReport(data.fullData.body.html);
    }

    // Fallback: return as-is (will show zeros)
    return data;
  }

  /**
   * Parse a Markdown/HTML audit report string into structured data.
   * Extracts risk score, actions, and recommendation from section headers.
   */
  function parseMarkdownReport(text) {
    // Strip HTML tags to get plain Markdown
    var md = text.replace(/<[^>]+>/g, '\n').replace(/&[a-z]+;/gi, ' ');

    var result = {
      overallRiskScore: 0,
      finalRecommendation: '',
      criticalActions: [],
      shortTermActions: [],
      longTermActions: [],
    };

    // Split into sections by ## headings
    var sections = md.split(/^##\s+/m);

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i].trim();
      var lowerSection = section.toLowerCase();

      // ── Overall Risk Score ──
      if (lowerSection.indexOf('overall risk score') === 0 || lowerSection.indexOf('risk score') === 0) {
        var scoreMatch = section.match(/(\d+)/);
        if (scoreMatch) {
          result.overallRiskScore = Math.min(parseInt(scoreMatch[1], 10), 100);
        }
      }

      // ── Critical Actions ──
      else if (lowerSection.indexOf('critical') === 0) {
        result.criticalActions = extractBulletItems(section);
      }

      // ── Short-Term Actions ──
      else if (lowerSection.indexOf('short') === 0) {
        result.shortTermActions = extractBulletItems(section);
      }

      // ── Long-Term Actions ──
      else if (lowerSection.indexOf('long') === 0) {
        result.longTermActions = extractBulletItems(section);
      }

      // ── Recommendation / Summary ──
      else if (lowerSection.indexOf('recommendation') === 0 || lowerSection.indexOf('final') === 0 || lowerSection.indexOf('summary') === 0) {
        // Everything after the heading line
        var lines = section.split('\n').slice(1).join('\n').trim();
        result.finalRecommendation = lines || '';
      }
    }

    // If no explicit recommendation section, generate one from the score
    if (!result.finalRecommendation) {
      if (result.overallRiskScore >= 75) {
        result.finalRecommendation = 'This repository has critical risk issues that require immediate attention.';
      } else if (result.overallRiskScore >= 50) {
        result.finalRecommendation = 'This repository has significant risks. Address critical and short-term actions promptly.';
      } else if (result.overallRiskScore >= 25) {
        result.finalRecommendation = 'This repository has moderate risks. Review the action items to improve code health.';
      } else {
        result.finalRecommendation = 'This repository is in good shape. Consider the suggested improvements for further hardening.';
      }
    }

    return result;
  }

  /**
   * Extract bullet-point items (- item) from a Markdown section string.
   */
  function extractBulletItems(section) {
    var items = [];
    var lines = section.split('\n');
    for (var j = 0; j < lines.length; j++) {
      var line = lines[j].trim();
      // Match lines starting with -, *, or numbered (1.)
      var match = line.match(/^[-*]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/);
      if (match) {
        var item = match[1].trim();
        if (item.length > 0) {
          items.push(item);
        }
      }
    }
    return items;
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
