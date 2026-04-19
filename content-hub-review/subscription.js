const TD_SUBSCRIBER_CONFIG = window.TD_SUBSCRIBER_CONFIG || {};
const SUBSCRIBER_API_BASE = String(TD_SUBSCRIBER_CONFIG.apiBase || 'http://127.0.0.1:8793/api/v1/subscribers').replace(/\/+$/, '');

(function () {
  const subscribeForm = document.getElementById('subscriber-form');
  const subscribeStatus = document.getElementById('subscribe-status');
  const confirmPanel = document.getElementById('confirm-panel');
  const confirmButton = document.getElementById('confirm-subscription-button');
  const confirmStatus = document.getElementById('confirm-status');
  const welcomePanel = document.getElementById('welcome-panel');
  const welcomeCopy = document.getElementById('welcome-copy');
  const welcomeStatus = document.getElementById('welcome-status');
  const accessRequestForm = document.getElementById('access-request-form');
  const accessRequestStatus = document.getElementById('access-request-status');
  const portalShell = document.getElementById('subscriber-portal');
  const portalForm = document.getElementById('portal-form');
  const portalStatus = document.getElementById('portal-status');
  const portalHeading = document.getElementById('portal-heading');
  const portalEmailNote = document.getElementById('portal-email-note');
  const portalFocusStatus = document.getElementById('portal-focus-status');
  const portalFocusActions = document.getElementById('portal-focus-actions');
  const portalFocusButton = document.getElementById('portal-focus-button');
  const unsubscribeButton = document.getElementById('unsubscribe-button');
  const query = new URLSearchParams(window.location.search);

  const FOCUS_META = {
    articleNotifications: {
      label: 'article notifications',
      buttonLabel: 'Turn off article notifications',
      focusMessage: 'This page is focused on article notifications. You can turn just those off here or use the full portal below.',
    },
    newsletters: {
      label: 'newsletters',
      buttonLabel: 'Pause newsletters',
      focusMessage: 'This page is focused on newsletters. You can pause just those here or use the full portal below.',
    },
    offers: {
      label: 'offer updates',
      buttonLabel: 'Turn off offer updates',
      focusMessage: 'This page is focused on offer updates. You can turn just those off here or use the full portal below.',
    },
  };

  let pendingConfirmToken = query.get('confirm') || '';
  let activePortalToken = query.get('token') || '';
  let portalTokenPurpose = '';

  function currentPageBaseUrl() {
    const url = new URL(window.location.href);
    const path = url.pathname.replace(/[^/]*$/, '').replace(/\/+$/, '');
    return `${url.origin}${path}`;
  }

  function parseTokenFromUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.searchParams.get('confirm') || parsed.searchParams.get('token') || '';
    } catch {
      return '';
    }
  }

  function focusedPreferenceKey() {
    const focus = String(query.get('focus') || '').trim();
    return Object.prototype.hasOwnProperty.call(FOCUS_META, focus) ? focus : '';
  }

  function focusedPreferenceMeta() {
    return FOCUS_META[focusedPreferenceKey()] || null;
  }

  function focusedPreferenceIntent() {
    return String(query.get('intent') || '').trim().toLowerCase();
  }

  function formState(form) {
    const data = new FormData(form);
    return {
      email: String(data.get('email') || '').trim(),
      name: String(data.get('name') || '').trim(),
      articleNotifications: data.get('articleNotifications') === 'on',
      newsletters: data.get('newsletters') === 'on',
      offers: data.get('offers') === 'on',
      consentAccepted: data.get('consentAccepted') === 'on',
      consentText: 'I agree to receive the Thriving Dancer email updates I selected, and I understand I can manage preferences or unsubscribe at any time.',
      sourcePage: window.location.pathname.replace(/^\//, '') || 'content-hub-review/public-hub.html',
      baseUrl: currentPageBaseUrl(),
      sendConfirmationEmail: true,
    };
  }

  function setStatus(target, tone, message) {
    if (!target) return;
    target.hidden = !message;
    target.className = `status-banner${tone ? ` ${tone}` : ''}`;
    target.textContent = message || '';
  }

  function showWelcome(message, tone = 'success') {
    if (!welcomePanel) return;
    welcomePanel.hidden = false;
    if (message && welcomeCopy) welcomeCopy.textContent = message;
    setStatus(welcomeStatus, tone, message);
  }

  async function postJson(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Request failed.');
    }
    return payload;
  }

  function updateFocusedPreferenceUi(subscriber) {
    const meta = focusedPreferenceMeta();
    if (!portalFocusStatus || !portalFocusActions || !portalFocusButton || !meta || !subscriber) {
      if (portalFocusStatus) portalFocusStatus.hidden = true;
      if (portalFocusActions) portalFocusActions.hidden = true;
      return;
    }
    const focusKey = focusedPreferenceKey();
    const currentlyOn = Boolean(subscriber[focusKey]);
    portalFocusActions.hidden = false;
    portalFocusButton.hidden = false;
    portalFocusButton.disabled = !currentlyOn;
    portalFocusButton.textContent = currentlyOn ? meta.buttonLabel : `${meta.label[0].toUpperCase()}${meta.label.slice(1)} already off`;
    const intent = focusedPreferenceIntent();
    if (intent === 'disable') {
      setStatus(
        portalFocusStatus,
        currentlyOn ? 'warn' : 'success',
        currentlyOn ? meta.focusMessage : `${meta.label[0].toUpperCase()}${meta.label.slice(1)} are already turned off.`
      );
    } else {
      setStatus(portalFocusStatus, '', `This page is focused on ${meta.label}. Adjust that checkbox below or use the focused action here.`);
    }
  }

  function fillPortal(subscriber, tokenPurpose) {
    if (!portalShell || !portalForm || !subscriber) return;
    portalShell.hidden = false;
    portalHeading.textContent = tokenPurpose === 'unsubscribe' ? 'Confirm or adjust your unsubscribe choice' : 'Manage your email preferences';
    portalEmailNote.textContent = `Managing updates for ${subscriber.emailMasked || subscriber.email}. Status: ${subscriber.status}.`;
    portalForm.elements.name.value = subscriber.name || '';
    document.getElementById('portal-articleNotifications').checked = Boolean(subscriber.articleNotifications);
    document.getElementById('portal-newsletters').checked = Boolean(subscriber.newsletters);
    document.getElementById('portal-offers').checked = Boolean(subscriber.offers);
    if (unsubscribeButton) {
      unsubscribeButton.textContent = subscriber.status === 'unsubscribed' ? 'Already unsubscribed' : 'Unsubscribe from all emails';
      unsubscribeButton.disabled = subscriber.status === 'unsubscribed';
    }
    updateFocusedPreferenceUi(subscriber);
  }

  async function loadPortal(token) {
    if (!token) return;
    try {
      const response = await fetch(`${SUBSCRIBER_API_BASE}/portal?token=${encodeURIComponent(token)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to load preferences.');
      activePortalToken = token;
      portalTokenPurpose = payload.tokenPurpose || '';
      fillPortal(payload.subscriber, portalTokenPurpose);
      if (query.get('view') === 'unsubscribe') {
        setStatus(portalStatus, 'warn', 'This link can unsubscribe you from every Thriving Dancer email, or you can adjust preferences instead.');
      }
    } catch (error) {
      setStatus(portalStatus, 'error', error.message || 'Unable to load preferences.');
      if (portalShell) portalShell.hidden = false;
    }
  }

  async function confirmSubscription(token) {
    if (!token) return;
    try {
      if (confirmButton) confirmButton.disabled = true;
      setStatus(confirmStatus, '', 'Confirming your subscription...');
      const payload = await postJson(`${SUBSCRIBER_API_BASE}/confirm`, { token, baseUrl: currentPageBaseUrl() });
      pendingConfirmToken = '';
      activePortalToken = parseTokenFromUrl(payload.access?.manageUrl);
      setStatus(confirmStatus, 'success', 'Subscription confirmed. Your preferences portal is ready below.');
      fillPortal(payload.subscriber, 'manage');
      if (payload.emailDelivery?.welcome?.sent) {
        showWelcome('Your subscription is active and your Thriving Dancer welcome email has been sent.', 'success');
      } else if (payload.emailDelivery?.welcome?.error) {
        showWelcome(`Your subscription is active. The welcome email did not send automatically, but your portal is ready here. ${payload.emailDelivery.welcome.error}`, 'warn');
      } else {
        showWelcome('Your subscription is active. Your portal is ready below.', 'success');
      }
      setStatus(portalStatus, 'success', 'Preferences loaded. Bookmark your manage or unsubscribe link if you want to keep direct access.');
      if (payload.access?.manageUrl) {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('confirm');
        if (activePortalToken) nextUrl.searchParams.set('token', activePortalToken);
        window.history.replaceState({}, '', nextUrl.toString());
      }
    } catch (error) {
      setStatus(confirmStatus, 'error', error.message || 'Unable to confirm your subscription.');
    } finally {
      if (confirmButton) confirmButton.disabled = false;
    }
  }

  async function disableFocusedPreference() {
    const focusKey = focusedPreferenceKey();
    const meta = focusedPreferenceMeta();
    if (!focusKey || !meta || !activePortalToken || !portalForm) return;
    try {
      const payload = {
        token: activePortalToken,
        name: String(portalForm.elements.name.value || '').trim(),
        articleNotifications: document.getElementById('portal-articleNotifications').checked,
        newsletters: document.getElementById('portal-newsletters').checked,
        offers: document.getElementById('portal-offers').checked,
      };
      payload[focusKey] = false;
      const response = await postJson(`${SUBSCRIBER_API_BASE}/preferences`, payload);
      fillPortal(response.subscriber, portalTokenPurpose || 'manage');
      setStatus(portalStatus, 'success', `${meta.label[0].toUpperCase()}${meta.label.slice(1)} turned off.`);
      setStatus(portalFocusStatus, 'success', `${meta.label[0].toUpperCase()}${meta.label.slice(1)} turned off. The rest of your subscription stayed the same.`);
    } catch (error) {
      setStatus(portalFocusStatus, 'error', error.message || `Unable to update ${meta.label}.`);
    }
  }

  if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        const payload = await postJson(`${SUBSCRIBER_API_BASE}/subscribe`, formState(subscribeForm));
        pendingConfirmToken = parseTokenFromUrl(payload.confirmation?.confirmUrl);
        const confirmationSent = Boolean(payload.emailDelivery?.confirmation?.sent);
        setStatus(
          subscribeStatus,
          'success',
          confirmationSent
            ? 'Preferences saved. A Thriving Dancer confirmation email is on the way.'
            : 'Preferences saved. Confirm the subscription to activate it.'
        );
        if (confirmPanel) confirmPanel.hidden = false;
        if (payload.emailDelivery?.confirmation?.sent) {
          setStatus(confirmStatus, 'success', 'Confirmation email sent. This button is just the fallback path.');
        } else if (payload.emailDelivery?.confirmation?.error) {
          setStatus(confirmStatus, 'warn', `Confirmation email was not sent automatically. You can still confirm here. ${payload.emailDelivery.confirmation.error}`);
        }
        if (pendingConfirmToken) {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set('confirm', pendingConfirmToken);
          window.history.replaceState({}, '', nextUrl.toString());
        }
      } catch (error) {
        setStatus(subscribeStatus, 'error', error.message || 'Unable to save your subscription. Make sure the Thriving Dancer local platform is running on this machine.');
      }
    });
  }

  if (confirmButton) {
    confirmButton.addEventListener('click', async () => {
      await confirmSubscription(pendingConfirmToken);
    });
  }

  if (accessRequestForm) {
    accessRequestForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = String(new FormData(accessRequestForm).get('email') || '').trim();
      try {
        const payload = await postJson(`${SUBSCRIBER_API_BASE}/request-access`, { email, baseUrl: currentPageBaseUrl() });
        let message = payload.message || 'If the address is active, a fresh access link can be prepared.';
        if (payload.sendPreparation?.manageUrl && !payload.emailDelivery?.access?.sent) {
          message += ` Local operator preview: ${payload.sendPreparation.manageUrl}`;
        }
        if (payload.emailDelivery?.access?.sent) {
          message += ' Check your inbox for the fresh Thriving Dancer preferences email.';
        }
        setStatus(accessRequestStatus, 'success', message);
      } catch (error) {
        setStatus(accessRequestStatus, 'error', error.message || 'Unable to request access.');
      }
    });
  }

  if (portalForm) {
    portalForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activePortalToken) {
        setStatus(portalStatus, 'error', 'Open this page from a valid manage-preferences link first.');
        return;
      }
      try {
        const data = new FormData(portalForm);
        const payload = await postJson(`${SUBSCRIBER_API_BASE}/preferences`, {
          token: activePortalToken,
          name: String(data.get('name') || '').trim(),
          articleNotifications: data.get('articleNotifications') === 'on',
          newsletters: data.get('newsletters') === 'on',
          offers: data.get('offers') === 'on',
        });
        fillPortal(payload.subscriber, portalTokenPurpose || 'manage');
        setStatus(portalStatus, 'success', payload.message || 'Preferences updated.');
      } catch (error) {
        setStatus(portalStatus, 'error', error.message || 'Unable to update preferences.');
      }
    });
  }

  if (unsubscribeButton) {
    unsubscribeButton.addEventListener('click', async () => {
      if (!activePortalToken) {
        setStatus(portalStatus, 'error', 'Open this page from a valid unsubscribe or preferences link first.');
        return;
      }
      try {
        const payload = await postJson(`${SUBSCRIBER_API_BASE}/unsubscribe`, { token: activePortalToken });
        fillPortal(payload.subscriber, 'unsubscribe');
        setStatus(portalStatus, 'success', payload.message || 'You have been unsubscribed.');
      } catch (error) {
        setStatus(portalStatus, 'error', error.message || 'Unable to unsubscribe.');
      }
    });
  }

  if (portalFocusButton) {
    portalFocusButton.addEventListener('click', async () => {
      await disableFocusedPreference();
    });
  }

  if (pendingConfirmToken && confirmPanel) {
    confirmPanel.hidden = false;
  }
  if (query.get('confirm')) {
    confirmSubscription(query.get('confirm'));
  }
  if (activePortalToken) {
    loadPortal(activePortalToken);
  }
})();
