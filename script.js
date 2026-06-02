const WEBHOOK_URL = 'https://n8n-production-4d14.up.railway.app/webhook/0bb3e865-950f-4091-a44d-9e716b564108';

const auditForms = document.querySelectorAll('#auditForm, #auditFormSecondary');
auditForms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const repoUrl = form.querySelector('input[type="url"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const plan = form.querySelector('select')?.value || 'starter';
    const result = form.querySelector('.form-message');

    if (!repoUrl || !email) {
      result.textContent = 'Please enter a valid repository URL and email address.';
      result.style.color = '#dc2626';
      return;
    }

    result.style.color = '#0f172a';
    result.textContent = 'Starting audit…';
    form.querySelector('button[type="submit"]').disabled = true;

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, email, plan, source: 'website' }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Request failed.');
      }

      result.style.color = '#16a34a';
      result.textContent = 'Audit started successfully. A full report is on its way to your inbox.';
    } catch (error) {
      result.style.color = '#dc2626';
      result.textContent = error.message || 'There was an issue submitting your request.';
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });
});

const navLinks = document.querySelectorAll('.nav-links a');
navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
