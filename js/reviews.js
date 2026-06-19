// Global reviews and rating feed namespace
window.AppReviews = (function() {

  /**
   * Fetches all reviews from the backend API.
   * @returns {Promise<Array<Object>>} List of review objects.
   */
  async function fetchReviews() {
    try {
      var url = window.AppConfig.API_BASE_URL + '/api/reviews';
      var response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      var data = await response.json();

      // Map backend field names to frontend field names
      return data.map(function(r) {
        return {
          id: r.id,
          name: r.user_name,
          rating: r.rating,
          comment: r.comment,
          date: r.created_at
        };
      });
    } catch (e) {
      console.error('Error fetching reviews:', e);
      return [];
    }
  }

  /**
   * Submits a new review to the backend API.
   * @param {string} name - Reviewer name.
   * @param {number} rating - Rating 1–5.
   * @param {string} comment - Review text.
   * @returns {Promise<Object|null>} The created review, or null on failure.
   */
  async function submitReview(name, rating, comment) {
    var url = window.AppConfig.API_BASE_URL + '/api/reviews';
    var response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: name,
        rating: rating,
        comment: comment
      })
    });

    if (!response.ok) {
      var errorData;
      try { errorData = await response.json(); } catch (e) { errorData = null; }
      throw new Error((errorData && errorData.detail) || 'Failed to submit review.');
    }

    var created = await response.json();
    return {
      id: created.id,
      name: created.user_name,
      rating: created.rating,
      comment: created.comment,
      date: created.created_at
    };
  }

  /**
   * Returns HTML string of SVG stars based on a rating value.
   * @param {number} rating - The rating out of 5.
   * @returns {string} HTML string containing 5 SVG stars.
   */
  function renderStars(rating) {
    var starsHtml = '';
    var roundedRating = Math.round(rating);
    for (var i = 1; i <= 5; i++) {
      var isFilled = i <= roundedRating;
      starsHtml += '<svg class="' + (isFilled ? 'filled' : '') + '" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
    }
    return starsHtml;
  }

  /**
   * Extracts initials from a user's name.
   * @param {string} name - Name to extract initials from.
   * @returns {string} The uppercase initials (max 2 characters).
   */
  function getInitials(name) {
    if (!name) return 'RA';
    var parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Updates the average rating summary card on the UI.
   * @param {Array<Object>} reviews - List of current reviews.
   */
  function updateSummaryCard(reviews) {
    var avgRatingNum = document.getElementById('avgRatingNum');
    var avgRatingStars = document.getElementById('avgRatingStars');
    var totalReviewsCount = document.getElementById('totalReviewsCount');

    if (!avgRatingNum || !avgRatingStars || !totalReviewsCount) return;

    var totalReviews = reviews.length;
    if (totalReviews === 0) {
      avgRatingNum.textContent = '0.0';
      avgRatingStars.innerHTML = renderStars(0);
      totalReviewsCount.textContent = 'Based on 0 reviews';
      return;
    }

    var sumRatings = reviews.reduce(function(sum, review) { return sum + review.rating; }, 0);
    var average = sumRatings / totalReviews;

    avgRatingNum.textContent = average.toFixed(1);
    avgRatingStars.innerHTML = renderStars(average);
    totalReviewsCount.textContent = 'Based on ' + totalReviews + ' review' + (totalReviews === 1 ? '' : 's');
  }

  /**
   * Formats an ISO date string into a readable format.
   * @param {string} isoString - ISO date string.
   * @returns {string} Formatted date (e.g. "June 4, 2026").
   */
  function formatDate(isoString) {
    var dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) return 'Recently';

    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Renders the reviews feed on the page.
   * @param {Array<Object>} reviews - List of reviews to display.
   */
  function renderReviewsList(reviews) {
    var listContainer = document.getElementById('reviewsList');
    if (!listContainer) return;

    if (reviews.length === 0) {
      listContainer.innerHTML =
        '<div class="no-reviews-placeholder">' +
          '<p>No reviews yet</p>' +
          '<p>Be the first to share your feedback using the form!</p>' +
        '</div>';
      return;
    }

    // Sort reviews newest first
    var sortedReviews = reviews.slice().sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    listContainer.innerHTML = sortedReviews.map(function(review) {
      var initials = getInitials(review.name);
      var dateStr = formatDate(review.date);
      var starsHtml = renderStars(review.rating);

      return (
        '<div class="review-item">' +
          '<div class="review-header">' +
            '<div class="review-avatar">' + initials + '</div>' +
            '<div class="review-user-info">' +
              '<span class="review-username">' + escapeHtml(review.name) + '</span>' +
              '<div class="review-meta">' +
                '<div class="review-stars">' + starsHtml + '</div>' +
                '<span class="review-date">' + dateStr + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="review-comment">' + escapeHtml(review.comment) + '</p>' +
        '</div>'
      );
    }).join('');
  }

  /**
   * Simple HTML escaping to protect against XSS when rendering user inputs.
   * @param {string} text - Unescaped user text.
   * @returns {string} Escaped safe text.
   */
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Sets up the star rating input click and hover behaviors.
   */
  function initStarRatingInput() {
    var starContainer = document.getElementById('starRatingInput');
    var ratingInput = document.getElementById('selectedRating');

    if (!starContainer || !ratingInput) return;

    var stars = starContainer.querySelectorAll('svg');

    // Set default visual state
    var defaultRating = parseInt(ratingInput.value) || 5;
    updateStarsVisualState(stars, defaultRating);

    stars.forEach(function(star) {
      // Hover Enter: highlight current star and all previous stars
      star.addEventListener('mouseenter', function() {
        var hoverVal = parseInt(star.getAttribute('data-rating'));
        stars.forEach(function(s) {
          var sVal = parseInt(s.getAttribute('data-rating'));
          if (sVal <= hoverVal) {
            s.classList.add('hovered');
          } else {
            s.classList.remove('hovered');
          }
        });
      });

      // Click: set rating value
      star.addEventListener('click', function() {
        var clickVal = parseInt(star.getAttribute('data-rating'));
        ratingInput.value = clickVal;
        updateStarsVisualState(stars, clickVal);
      });
    });

    // Hover Leave: remove hovered class, restoring active classes
    starContainer.addEventListener('mouseleave', function() {
      stars.forEach(function(s) { s.classList.remove('hovered'); });
    });
  }

  /**
   * Updates active classes on the star input.
   * @param {NodeListOf<SVGElement>} stars - List of star SVGs.
   * @param {number} rating - Selected rating value.
   */
  function updateStarsVisualState(stars, rating) {
    stars.forEach(function(s) {
      var sVal = parseInt(s.getAttribute('data-rating'));
      if (sVal <= rating) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  }

  /**
   * Initializes the reviews system — fetches reviews from the backend API,
   * renders them, and registers form submission to POST to the API.
   */
  function initReviewsSystem() {
    var listContainer = document.getElementById('reviewsList');

    // Show a loading indicator while fetching
    if (listContainer) {
      listContainer.innerHTML =
        '<div class="no-reviews-placeholder">' +
          '<p>Loading reviews…</p>' +
        '</div>';
    }

    // Initialize interactive star rating inputs
    initStarRatingInput();

    // Fetch reviews from the backend and render
    fetchReviews().then(function(reviews) {
      updateSummaryCard(reviews);
      renderReviewsList(reviews);
    });

    // Handle Form Submission — POST to backend API
    var reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
      reviewForm.addEventListener('submit', function(event) {
        event.preventDefault();

        var nameInput = document.getElementById('reviewName');
        var commentInput = document.getElementById('reviewComment');
        var ratingInput = document.getElementById('selectedRating');
        var formMessage = reviewForm.querySelector('.form-message');

        if (!nameInput || !commentInput || !ratingInput) return;

        var name = nameInput.value.trim();
        var comment = commentInput.value.trim();
        var rating = parseInt(ratingInput.value) || 5;

        if (!name || !comment) return;

        // Disable submit button while saving
        var submitBtn = reviewForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        submitReview(name, rating, comment)
          .then(function() {
            // Reset form controls
            reviewForm.reset();
            ratingInput.value = 5;
            var stars = document.getElementById('starRatingInput');
            if (stars) updateStarsVisualState(stars.querySelectorAll('svg'), 5);

            // Show success message
            if (formMessage) {
              formMessage.textContent = 'Thank you for your review!';
              formMessage.className = 'form-message success';
              setTimeout(function() { formMessage.textContent = ''; formMessage.className = 'form-message'; }, 3000);
            }

            // Re-fetch all reviews from the backend to refresh the list
            return fetchReviews();
          })
          .then(function(reviews) {
            updateSummaryCard(reviews);
            renderReviewsList(reviews);
          })
          .catch(function(err) {
            if (formMessage) {
              formMessage.textContent = err.message || 'Failed to submit review. Please try again.';
              formMessage.className = 'form-message error';
              setTimeout(function() { formMessage.textContent = ''; formMessage.className = 'form-message'; }, 5000);
            }
          })
          .finally(function() {
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }
  }

  return {
    initReviewsSystem: initReviewsSystem
  };
})();
