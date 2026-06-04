/**
 * Displays status feedback messages to the user.
 * @param {HTMLElement} element - The DOM element where the message should be rendered.
 * @param {string} text - The text message to display.
 * @param {'error' | 'success' | 'loading' | 'default'} type - The type of status to style the message.
 */
export function showMessage(element, text, type = 'default') {
  if (!element) return;
  element.textContent = text;

  switch (type) {
    case 'error':
      element.style.color = '#dc2626'; // Red-600
      break;
    case 'success':
      element.style.color = '#16a34a'; // Green-600
      break;
    case 'loading':
      element.style.color = '#0f172a'; // Slate-900
      break;
    default:
      element.style.color = '#64748b'; // Slate-500
      break;
  }
}

/**
 * Toggles the disabled state of a form's submit button.
 * @param {HTMLFormElement} form - The form element containing the submit button.
 * @param {boolean} isDisabled - Whether the button should be disabled.
 */
export function setSubmitButtonState(form, isDisabled) {
  if (!form) return;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = isDisabled;
  }
}
