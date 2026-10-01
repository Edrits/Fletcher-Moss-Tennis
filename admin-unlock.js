// Admin sign-in, shared by every page with admin controls (noticeboard, league, court
// booking, pairings, sign-up). Load it with <script src="/admin-unlock.js"></script> before
// the page's own script. This is the one piece of front-end code the pages share rather
// than each carrying its own copy: five pages had grown five different ways of asking for
// the password, and only one of them told people about the fifteen minute lockout.
//
// Signing in on one page signs you in on all of them for the rest of the tab, because the
// password sits in sessionStorage under one key. Storage can throw where site data is
// blocked, so every access is guarded and falls back to page memory.
//
//   FMSTAdmin.signIn()          shows the sign-in box. Resolves with the server's reply on
//                               success, or null if cancelled. Resolves at once if already
//                               signed in. Pass { verify } to check against another endpoint.
//   FMSTAdmin.post(url, body)   sends an admin request with the password added. A rejected
//                               password signs out everywhere on the page and says why.
//                               Resolves with { ok, status, data }.
//   FMSTAdmin.signOut()         forgets the password.
//   FMSTAdmin.onChange(fn)      fn(signedIn) runs after every sign in or sign out.
//   FMSTAdmin.isSignedIn()
(function () {
  const KEY = 'pw';
  let memory = '';
  const listeners = [];

  function read() {
    try { return sessionStorage.getItem(KEY) || memory; } catch (err) { return memory; }
  }
  function remember(pw) {
    memory = pw;
    try { sessionStorage.setItem(KEY, pw); } catch (err) { /* page memory only */ }
  }
  function forget() {
    memory = '';
    try { sessionStorage.removeItem(KEY); } catch (err) { /* nothing stored */ }
  }
  function notify(on) {
    listeners.forEach(fn => { try { fn(on); } catch (err) { console.error(err); } });
  }

  async function postJson(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  // 401 and 429 come back with the server's own wording, which counts down the tries left
  // and names the fifteen minute wait. Saying only "try again" on a lockout invited the
  // retry that keeps it in place.
  function rejection(status, data) {
    if (status === 401) return data.error || 'Incorrect password.';
    if (status === 429) return data.error || 'Too many incorrect passwords. Wait fifteen minutes and try again.';
    return null;
  }

  const CSS = `
    .fmst-admin-dialog { margin: auto; border: none; border-radius: 16px; padding: 24px; width: min(360px, calc(100vw - 32px));
      background: #fff; color: var(--ink-900, #1d2a1f); font-family: var(--font-body, system-ui, sans-serif);
      box-shadow: var(--shadow-lg, 0 12px 40px rgba(20, 30, 20, .18)); }
    .fmst-admin-dialog::backdrop { background: rgba(10, 20, 12, .45); }
    .fmst-admin-dialog h2 { font-family: var(--font-display, Georgia, serif); font-size: 1.35rem; margin: 0 0 16px; }
    .fmst-admin-dialog label { display: block; font-weight: 600; font-size: .9rem; margin-bottom: 6px; }
    .fmst-admin-dialog input { width: 100%; box-sizing: border-box; padding: 11px 12px; font: inherit; font-size: 16px;
      border: 1px solid var(--border-strong, #c9cfc4); border-radius: var(--radius-sm, 8px); }
    .fmst-admin-dialog input:focus { outline: 2px solid var(--green-400, #6fa35a); outline-offset: 1px; }
    .fmst-admin-msg { min-height: 1.3em; margin: 10px 0 0; font-size: .875rem; color: var(--color-alert, #b3261e); }
    .fmst-admin-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .fmst-admin-actions button { font: inherit; font-weight: 600; padding: 10px 18px; border-radius: var(--radius-sm, 8px);
      cursor: pointer; border: 1px solid var(--border-strong, #c9cfc4); background: #fff; color: inherit; }
    .fmst-admin-actions button[type="submit"] { background: var(--green-700, #2d5016); border-color: transparent; color: #fff; }
    .fmst-admin-actions button:disabled { opacity: .6; cursor: default; }
  `;

  let dialog, pending = null;

  function build() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    dialog = document.createElement('dialog');
    dialog.className = 'fmst-admin-dialog';
    dialog.setAttribute('aria-labelledby', 'fmst-admin-title');
    dialog.innerHTML = `
      <form>
        <h2 id="fmst-admin-title">Admin sign in</h2>
        <label for="fmst-admin-password">Admin password</label>
        <input id="fmst-admin-password" type="password" autocomplete="current-password" required>
        <p class="fmst-admin-msg" role="status" aria-live="polite"></p>
        <div class="fmst-admin-actions">
          <button type="button" data-cancel>Cancel</button>
          <button type="submit">Sign in</button>
        </div>
      </form>`;
    document.body.appendChild(dialog);
  }

  function signIn(options = {}) {
    if (read()) return Promise.resolve({});
    if (pending) return pending;
    if (!dialog) build();
    const verify = options.verify || (pw => postJson('/api/admin', { password: pw }));
    const form = dialog.querySelector('form');
    const input = dialog.querySelector('input');
    const msg = dialog.querySelector('.fmst-admin-msg');
    const submit = dialog.querySelector('button[type="submit"]');
    input.value = '';
    msg.textContent = '';

    pending = new Promise(resolve => {
      const finish = result => {
        form.onsubmit = null;
        dialog.onclose = null;
        dialog.querySelector('[data-cancel]').onclick = null;
        if (dialog.open) dialog.close();
        input.value = '';
        pending = null;
        resolve(result);
      };
      dialog.querySelector('[data-cancel]').onclick = () => finish(null);
      dialog.onclose = () => finish(null);   // Esc
      form.onsubmit = async e => {
        e.preventDefault();
        const pw = input.value;
        if (!pw || submit.disabled) return;
        submit.disabled = true;
        submit.textContent = 'Signing in…';
        msg.textContent = '';
        try {
          const result = await verify(pw);
          const refused = rejection(result.status, result.data || {});
          if (refused || !result.ok) {
            msg.textContent = refused || 'Could not sign in. Please try again.';
            input.select();
            return;
          }
          remember(pw);
          finish(result.data || {});
          notify(true);
        } catch (err) {
          console.error('Admin sign-in failed:', err);
          msg.textContent = 'Could not connect. Please try again.';
        } finally {
          submit.disabled = false;
          submit.textContent = 'Sign in';
        }
      };
    });
    dialog.showModal();
    input.focus();
    return pending;
  }

  async function post(url, body) {
    const pw = read();
    if (!pw) {
      const signedIn = await signIn();
      if (!signedIn) return { ok: false, status: 0, data: {}, cancelled: true };
    }
    const result = await postJson(url, Object.assign({}, body, { password: read() }));
    const refused = rejection(result.status, result.data);
    if (refused) {
      forget();
      notify(false);
      alert(refused);
    }
    return result;
  }

  window.FMSTAdmin = {
    signIn,
    post,
    signOut() { forget(); notify(false); },
    onChange(fn) { listeners.push(fn); },
    isSignedIn() { return !!read(); },
    password: read
  };
})();
