// Read and write a root-level JSON file in this repo through the GitHub Contents API.
// This is the "database" for the noticeboard, league, pairings and court booking.
//
// GitHub accepts one PUT per file version. Two people saving at the same moment means
// the second PUT carries a stale sha and is rejected with 409, so updateRepoJson re-reads
// and re-applies the change rather than failing the request. The mutation is re-run on
// fresh data each attempt, so any check inside it (such as "already booked") always sees
// the latest state.
const GITHUB_USER = 'Edrits';
const GITHUB_REPO = 'Fletcher-Moss-Tennis';

function fileUrl(file) {
  return `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${file}`;
}

function headers() {
  return {
    Authorization: `token ${process.env.GIT_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  };
}

// An error that carries the HTTP status the handler should answer with.
export function httpError(status, message) {
  const err = new Error(message);
  err.httpStatus = status;
  return err;
}

// Returns { sha, data }. A missing file gives { sha: null, data: null }.
export async function readRepoJson(file) {
  const response = await fetch(fileUrl(file), { headers: headers() });
  if (response.status === 404) return { sha: null, data: null };
  if (!response.ok) throw new Error('Failed to fetch from GitHub');
  const json = await response.json();
  return { sha: json.sha, data: JSON.parse(Buffer.from(json.content, 'base64').toString('utf8')) };
}

// mutate(data) receives the current contents (null when the file does not exist yet) and
// returns the object to save. It may throw httpError() to reject the request.
export async function updateRepoJson(file, mutate, message) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { sha, data } = await readRepoJson(file);
    const next = mutate(data);
    const response = await fetch(fileUrl(file), {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(next, null, 2)).toString('base64'),
        sha
      })
    });
    if (response.ok) return next;
    if (response.status === 409) continue;
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to save');
  }
  throw httpError(503, 'Someone else saved at the same moment. Please try again.');
}

// The CORS preamble and error handling every repo-backed handler shares.
export function repoHandler(handle) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    try {
      if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return await handle(req, res);
    } catch (error) {
      if (error && error.httpStatus) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      console.error('Function error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };
}
