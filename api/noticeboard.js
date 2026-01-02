// Save this as: api/noticeboard.js (for Vercel)

export default async function handler(req, res) {
  const ADMIN_PASSWORD = 'Fletchertennis909';
  const GITHUB_TOKEN = process.env.GIT_TOKEN;
  const GITHUB_USER = 'Edrits';
  const GITHUB_REPO = 'Fletcher-Moss-Tennis';
  const NOTICE_FILE = 'noticeboard.json';

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const githubUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${NOTICE_FILE}`;

  try {
    // GET - Fetch noticeboard
    if (req.method === 'GET') {
      const response = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return res.status(200).json(JSON.parse(content));
      } else if (response.status === 404) {
        return res.status(200).json({ message: '', updated: null });
      } else {
        throw new Error('Failed to fetch from GitHub');
      }
    }

    // POST - Update noticeboard
    if (req.method === 'POST') {
      const { password, message } = req.body;

      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Get current SHA
      let sha = null;
      const getResponse = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getResponse.ok) {
        const getData = await getResponse.json();
        sha = getData.sha;
      }

      // Save to GitHub
      const content = {
        message: message,
        updated: new Date().toISOString()
      };

      const encodedContent = Buffer.from(JSON.stringify(content)).toString('base64');

      const saveResponse = await fetch(githubUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update noticeboard',
          content: encodedContent,
          sha: sha
        })
      });

      if (saveResponse.ok) {
        return res.status(200).json({ success: true, content });
      } else {
        const error = await saveResponse.json();
        throw new Error(error.message || 'Failed to save');
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
