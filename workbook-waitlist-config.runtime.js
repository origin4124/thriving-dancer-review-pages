// Thriving Dancer workbook waitlist runtime config
// Chosen first provider: Formspree
// Official pattern: form POST to https://formspree.io/f/{FORM_ID}
// Leave submitMode='placeholder' until a real Formspree form endpoint is created.
window.__THRIVING_DANCER_WORKBOOK_WAITLIST__ = window.__THRIVING_DANCER_WORKBOOK_WAITLIST__ || {
  provider: 'formspree',
  submitMode: 'placeholder',
  endpoint: '',
  endpointTemplate: 'https://formspree.io/f/REPLACE_WITH_FORM_ID',
  successMode: 'inline-success',
  redirectUrl: '',
  toolLabel: 'Formspree',
  privacyPolicyUrl: '',
  successMessage: 'Thanks — you’re on the list. We’ll let you know when the workbook is ready and when preview or release details are available.',
  notes: [
    'Create a Formspree form and copy its endpoint from the dashboard.',
    'Replace endpoint with the real https://formspree.io/f/{FORM_ID} value.',
    'Switch submitMode from placeholder to native-post once the endpoint is real.'
  ]
};
