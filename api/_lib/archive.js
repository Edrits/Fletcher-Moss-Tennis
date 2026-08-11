// Writes a finished sign-up list into the repo as a permanent record.
//
// Redis holds the live race because it can absorb everyone tapping at once. Git holds the
// history, because a Redis account can lapse and a repo does not. The important part is
// that this runs ONCE per session, when the list is reset for the next one, rather than on
// every tap. One commit and one redeploy per session instead of thirty.
const GITHUB_USER = 'Edrits';
const GITHUB_REPO = 'Fletcher-Moss-Tennis';

export async function archiveSession({ date, label, capacity, entries }) {
  const token = process.env.GIT_TOKEN;
  if (!token) return { ok: false, error: 'Server is missing GIT_TOKEN configuration' };
  if (!date) return { ok: false, error: 'Nothing to archive' };

  const path = `signups/${date}.json`;
  const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };

  // Tokens are cancel credentials, not data. They must never reach the repo, which is public.
  const record = {
    date,
    label: label || null,
    capacity: capacity || null,
    archivedAt: new Date().toISOString(),
    players: entries.map((e, i) => ({ position: i + 1, name: e.name, at: e.at || null }))
  };

  let sha = null;
  const existing = await fetch(url, { headers });
  if (existing.ok) {
    sha = (await existing.json()).sha;      // re-archiving the same date overwrites
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Sign-up list for ${date}`,
      content: Buffer.from(JSON.stringify(record, null, 2)).toString('base64'),
      ...(sha ? { sha } : {})
    })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message || `Archive failed with ${res.status}` };
  }
  return { ok: true, path };
}
