// Homepage noticeboard. Stored in noticeboard.json in this repo; posting needs the admin password.
import { checkAdminPassword } from './_lib/admin-auth.js';
import { readRepoJson, updateRepoJson, repoHandler } from './_lib/repo-json.js';

const DATA_FILE = 'noticeboard.json';

export default repoHandler(async (req, res) => {
  if (req.method === 'GET') {
    const { data } = await readRepoJson(DATA_FILE);
    return res.status(200).json(data || { message: '', updated: null });
  }

  const { password, message } = req.body || {};
  const denied = await checkAdminPassword(req, password);
  if (denied) return res.status(denied.status).json({ error: denied.error });

  const content = { message: String(message ?? ''), updated: new Date().toISOString() };
  await updateRepoJson(DATA_FILE, () => content, 'Update noticeboard');
  return res.status(200).json({ success: true, content });
});
