/**
 * Initializes smooth scrolling behavior for internal navigation links.
 */
export function initSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      
      // Ensure the href is an anchor link
      if (href && href.startsWith('#')) {
        event.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}
