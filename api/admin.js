// Checks the admin password and nothing else. admin-unlock.js calls this when someone signs
// in on any page, so a typo is caught at the sign-in box rather than on their first save.
// It goes through the same throttle as every other admin check.
import { checkAdminPassword } from './_lib/admin-auth.js';
import { repoHandler } from './_lib/repo-json.js';

export default repoHandler(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const denied = await checkAdminPassword(req, (req.body || {}).password);
  if (denied) return res.status(denied.status).json({ error: denied.error });
  return res.status(200).json({ valid: true });
});
