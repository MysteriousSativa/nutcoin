/**
 * $NUT Profiles — distinct IDs, profile URLs, clickable names
 */
(function () {
  const KEY_SLUG = 'nut_profile_slug_v1';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function anonName(sid) {
    const hex = String(sid || '').replace(/-/g, '').slice(-6);
    const num = (parseInt(hex, 16) % 9000) + 1000;
    return `Anon #${num}`;
  }

  /** Stable public nut id shown on passport (derived from session, never changes) */
  function nutDisplayId(sid) {
    if (!sid) return 'NUT-????????';
    return 'NUT-' + String(sid).replace(/-/g, '').slice(0, 8).toUpperCase();
  }

  /** Persistent slug stored locally for this device (same as session-derived id for sharing) */
  function ensureSlug(sessionId) {
    let slug = localStorage.getItem(KEY_SLUG);
    if (!slug && sessionId) {
      slug = String(sessionId).replace(/-/g, '').slice(0, 12).toLowerCase();
      localStorage.setItem(KEY_SLUG, slug);
    }
    return slug || '';
  }

  function profileUrl(sessionId) {
    if (!sessionId) return '/';
    const base = typeof SITE_URL !== 'undefined' ? SITE_URL : '';
    return `${base}/profile.html?p=${encodeURIComponent(sessionId)}`;
  }

  function nameHtml(sessionId, displayName, extraClass) {
    const name = displayName || anonName(sessionId);
    const cls = extraClass ? ` ${extraClass}` : '';
    return `<a class="nut-name-link${cls}" href="${profileUrl(sessionId)}" title="View profile">${esc(name)}</a>`;
  }

  function shareProfile(sessionId, displayName) {
    const url = profileUrl(sessionId);
    const name = displayName || anonName(sessionId);
    const id = nutDisplayId(sessionId);
    const text = `${name} · ${id} · $NUT profile\n${url}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    if (typeof showToast === 'function') showToast('Profile link copied ✦');
    if (navigator.share) {
      navigator.share({ title: '$NUT Profile', text, url }).catch(() => {});
    }
  }

  function parseProfileParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get('p') || params.get('profile') || '';
  }

  function redirectIndexToProfile() {
    const p = parseProfileParam();
    if (!p) return;
    const path = window.location.pathname || '/';
    if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
      window.location.replace(`/profile.html?p=${encodeURIComponent(p)}`);
    }
  }

  function init() {
    redirectIndexToProfile();
    if (typeof sessionId !== 'undefined' && sessionId) ensureSlug(sessionId);
  }

  window.NutProfiles = {
    init,
    profileUrl,
    nutDisplayId,
    ensureSlug,
    anonName,
    nameHtml,
    shareProfile,
    parseProfileParam,
  };
})();
