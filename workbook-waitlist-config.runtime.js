// Thriving Dancer workbook waitlist runtime config
// Chosen first provider: Formspree
// Official pattern: form POST to https://formspree.io/f/{FORM_ID}
// Leave submitMode='placeholder' until a real Formspree form endpoint is created.
window.__THRIVING_DANCER_WORKBOOK_WAITLIST__ = window.__THRIVING_DANCER_WORKBOOK_WAITLIST__ || {
  provider: 'formspree',
  submitMode: 'native-post',
  endpoint: 'https://formspree.io/f/xvzvyddo',
  endpointTemplate: 'https://formspree.io/f/xvzvyddo',
  successMode: 'inline-success',
  redirectUrl: 'https://origin4124.github.io/thriving-dancer-review-pages/workbook-waitlist-thank-you.html',
  toolLabel: 'Formspree',
  privacyPolicyUrl: 'https://origin4124.github.io/thriving-dancer-review-pages/workbook-waitlist-privacy.html',
  successMessage: 'Thanks — you’re on the list. We’ll let you know when the workbook is ready and when preview or release details are available.',
  notes: ['Activated with a real Formspree endpoint and ready for a real submission test.']
};
