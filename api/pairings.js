export default async function handler(req, res) {
  const ADMIN_PASSWORD = 'Fletchertennis909';
  const GITHUB_TOKEN = process.env.GIT_TOKEN;
  const GITHUB_USER = 'Edrits';
  const GITHUB_REPO = 'Fletcher-Moss-Tennis';
  const DATA_FILE = 'pairings.json';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const githubUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_FILE}`;

  const defaultData = {
    players: ["Ed", "Sofia", "Will", "Adam", "Alex", "Adam B", "Daniel", "Kamal", "Emma B", "Will (10)", "Rhys", "Lucy", "Joe", "Michael"]
      .map((name, i, arr) => ({ name, sub: i >= arr.length - 2 })),
    numCourts: 3,
    numGames: 6,
    seed: null,
    generatedGames: [],
    activeGame: 0,
    updated: null
  };

  try {
    // GET - Fetch the current pairings session
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
        return res.status(200).json(defaultData);
      } else {
        throw new Error('Failed to fetch from GitHub');
      }
    }

    // POST - Save the current pairings session (requires admin password)
    if (req.method === 'POST') {
      const { action, password, players, numCourts, numGames, seed, generatedGames, activeGame } = req.body;

      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Incorrect password' });
      }

      // Lightweight check used by the "unlock to edit" prompt — confirms the
      // password without writing anything back to the repo.
      if (action === 'verify') {
        return res.status(200).json({ valid: true });
      }

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

      const dataToSave = {
        players: players || [],
        numCourts: numCourts || 3,
        numGames: numGames || 6,
        seed: seed ?? null,
        generatedGames: generatedGames || [],
        activeGame: activeGame || 0,
        updated: new Date().toISOString()
      };

      const encodedContent = Buffer.from(JSON.stringify(dataToSave, null, 2)).toString('base64');

      const saveResponse = await fetch(githubUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Updated court pairings',
          content: encodedContent,
          sha: sha
        })
      });

      if (saveResponse.ok) {
        return res.status(200).json({ success: true, data: dataToSave });
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
