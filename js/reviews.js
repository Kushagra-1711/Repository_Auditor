// Key for LocalStorage reviews persistence
const LOCAL_STORAGE_KEY = 'repo_auditor_reviews';

// Default mock reviews to seed the page on first load (empty by default)
const DEFAULT_REVIEWS = [];

/**
 * Gets reviews from local storage or loads defaults if empty.
 * @returns {Array<Object>} List of review objects.
 */
function getReviews() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  let reviews = [];
  if (!stored) {
    reviews = DEFAULT_REVIEWS;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reviews));
  } else {
    try {
      reviews = JSON.parse(stored);
    } catch (e) {
      reviews = DEFAULT_REVIEWS;
    }
  }

  // Purge any legacy default mock reviews
  const originalLength = reviews.length;
  reviews = reviews.filter((r) => r && r.id && !r.id.startsWith('default-'));
  if (reviews.length !== originalLength) {
    saveReviews(reviews);
  }

  return reviews;
}

/**
 * Saves reviews to local storage.
 * @param {Array<Object>} reviews - List of review objects to persist.
 */
function saveReviews(reviews) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reviews));
}

/**
 * Returns HTML string of SVG stars based on a rating value.
 * @param {number} rating - The rating out of 5.
 * @returns {string} HTML string containing 5 SVG stars.
 */
function renderStars(rating) {
  let starsHtml = '';
  const roundedRating = Math.round(rating);
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= roundedRating;
    starsHtml += `<svg class="${isFilled ? 'filled' : ''}" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
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
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Updates the average rating summary card on the UI.
 * @param {Array<Object>} reviews - List of current reviews.
 */
function updateSummaryCard(reviews) {
  const avgRatingNum = document.getElementById('avgRatingNum');
  const avgRatingStars = document.getElementById('avgRatingStars');
  const totalReviewsCount = document.getElementById('totalReviewsCount');

  if (!avgRatingNum || !avgRatingStars || !totalReviewsCount) return;

  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    avgRatingNum.textContent = '0.0';
    avgRatingStars.innerHTML = renderStars(0);
    totalReviewsCount.textContent = 'Based on 0 reviews';
    return;
  }

  const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = sumRatings / totalReviews;

  // Format to 1 decimal place
  avgRatingNum.textContent = average.toFixed(1);
  avgRatingStars.innerHTML = renderStars(average);
  totalReviewsCount.textContent = `Based on ${totalReviews} review${totalReviews === 1 ? '' : 's'}`;
}

/**
 * Formats a ISO date string into a readable format.
 * @param {string} isoString - ISO date string.
 * @returns {string} Formatted date (e.g. "June 4, 2026").
 */
function formatDate(isoString) {
  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) return 'Recently';

  // Format e.g., "June 4, 2026"
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
  const listContainer = document.getElementById('reviewsList');
  if (!listContainer) return;

  if (reviews.length === 0) {
    listContainer.innerHTML = `
      <div class="no-reviews-placeholder" style="text-align: center; padding: 3rem; background: #fff; border-radius: 24px; border: 1px solid rgba(15, 23, 42, 0.06); box-shadow: 0 20px 45px -35px rgba(15, 23, 42, 0.15);">
        <p style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #0f172a;">No reviews yet</p>
        <p style="margin: 0.5rem 0 0; font-size: 0.95rem; color: #64748b;">Be the first to share your feedback using the form below!</p>
      </div>
    `;
    return;
  }

  // Sort reviews newest first
  const sortedReviews = [...reviews].sort((a, b) => new Date(b.date) - new Date(a.date));

  listContainer.innerHTML = sortedReviews.map((review) => {
    const initials = getInitials(review.name);
    const dateStr = formatDate(review.date);
    const starsHtml = renderStars(review.rating);

    return `
      <div class="review-item">
        <div class="review-header">
          <div class="review-avatar">${initials}</div>
          <div class="review-user-info">
            <span class="review-username">${escapeHtml(review.name)}</span>
            <div class="review-meta">
              <div class="review-stars">${starsHtml}</div>
              <span class="review-date">${dateStr}</span>
            </div>
          </div>
        </div>
        <p class="review-comment">${escapeHtml(review.comment)}</p>
      </div>
    `;
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
  const starContainer = document.getElementById('starRatingInput');
  const ratingInput = document.getElementById('selectedRating');

  if (!starContainer || !ratingInput) return;

  const stars = starContainer.querySelectorAll('svg');
  
  // Set default visual state
  const defaultRating = parseInt(ratingInput.value) || 5;
  updateStarsVisualState(stars, defaultRating);

  stars.forEach((star) => {
    // Hover Enter: highlight current star and all previous stars
    star.addEventListener('mouseenter', () => {
      const hoverVal = parseInt(star.getAttribute('data-rating'));
      stars.forEach((s) => {
        const sVal = parseInt(s.getAttribute('data-rating'));
        if (sVal <= hoverVal) {
          s.classList.add('hovered');
        } else {
          s.classList.remove('hovered');
        }
      });
    });

    // Click: set rating value
    star.addEventListener('click', () => {
      const clickVal = parseInt(star.getAttribute('data-rating'));
      ratingInput.value = clickVal;
      updateStarsVisualState(stars, clickVal);
    });
  });

  // Hover Leave: remove hovered class, restoring active classes
  starContainer.addEventListener('mouseleave', () => {
    stars.forEach((s) => s.classList.remove('hovered'));
  });
}

/**
 * Updates active classes on the star input.
 * @param {NodeListOf<SVGElement>} stars - List of star SVGs.
 * @param {number} rating - Selected rating value.
 */
function updateStarsVisualState(stars, rating) {
  stars.forEach((s) => {
    const sVal = parseInt(s.getAttribute('data-rating'));
    if (sVal <= rating) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });
}

/**
 * Initializes the reviews system logic, loading reviews, registering event listeners,
 * and handling review form submission.
 */
export function initReviewsSystem() {
  const reviews = getReviews();

  // Render initial reviews lists and stats
  updateSummaryCard(reviews);
  renderReviewsList(reviews);

  // Initialize interactive star rating inputs
  initStarRatingInput();

  // Handle Form Submission
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const nameInput = document.getElementById('reviewName');
      const commentInput = document.getElementById('reviewComment');
      const ratingInput = document.getElementById('selectedRating');

      if (!nameInput || !commentInput || !ratingInput) return;

      const name = nameInput.value.trim();
      const comment = commentInput.value.trim();
      const rating = parseInt(ratingInput.value) || 5;

      if (!name || !comment) return;

      // Create new review object
      const newReview = {
        id: 'user-' + Date.now(),
        name: name,
        rating: rating,
        comment: comment,
        date: new Date().toISOString()
      };

      // Load existing reviews, add new one, save and re-render
      const currentReviews = getReviews();
      currentReviews.push(newReview);
      saveReviews(currentReviews);

      // Reset form controls
      reviewForm.reset();

      // Reset rating selection to default of 5 stars
      ratingInput.value = 5;
      const stars = document.getElementById('starRatingInput')?.querySelectorAll('svg');
      if (stars) {
        updateStarsVisualState(stars, 5);
      }

      // Refresh UI components
      updateSummaryCard(currentReviews);
      renderReviewsList(currentReviews);
    });
  }
}
