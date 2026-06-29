export default async function handler(req, res) {
  const ADMIN_PASSWORD = 'Fletchertennis909';
  const GITHUB_TOKEN = process.env.GIT_TOKEN;
  const GITHUB_USER = 'Edrits';
  const GITHUB_REPO = 'Fletcher-Moss-Tennis';
  const DATA_FILE = 'boxleague.json';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const githubUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${DATA_FILE}`;

  try {
    // GET - Fetch box league data
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
        const defaultData = { boxes: [] };
        return res.status(200).json(defaultData);
      } else {
        throw new Error('Failed to fetch from GitHub');
      }
    }

    // POST - Update box league data
    if (req.method === 'POST') {
      const { type, password, updatedBoxes, clearMatches, match } = req.body;

      let sha = null;
      let currentData = { boxes: [] };
      
      const getResponse = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getResponse.ok) {
        const getData = await getResponse.json();
        sha = getData.sha;
        const content = Buffer.from(getData.content, 'base64').toString('utf8');
        currentData = JSON.parse(content);
      }

      let dataToSave = currentData;

      if (type === 'admin_update_players') {
        if (password !== ADMIN_PASSWORD) {
          return res.status(401).json({ error: 'Incorrect password' });
        }

        updatedBoxes.forEach(ub => {
          const box = dataToSave.boxes.find(b => b.id === ub.id);
          if (box) {
            if (clearMatches) {
              box.matches = [];
            }

            // Map and update names cleanly
            box.players = ub.players.map((newName, idx) => {
              const cleanName = newName.trim() || `Player ${idx + 1}`;
              const oldPlayer = box.players[idx];

              // If name didn't change and we aren't clearing, preserve stats
              if (!clearMatches && oldPlayer && oldPlayer.name === cleanName) {
                return oldPlayer;
              } else {
                return { name: cleanName, played: 0, won: 0, points: 0 };
              }
            });
          }
        });

        // Recalculate remaining matches safely (discards matches of deleted/renamed players)
        if (!clearMatches) {
          dataToSave.boxes.forEach(box => {
            box.players.forEach(p => {
              p.played = 0;
              p.won = 0;
              p.points = 0;
            });

            if (box.matches) {
              box.matches = box.matches.filter(m => {
                const p1Exists = box.players.some(p => p.name === m.player1);
                const p2Exists = box.players.some(p => p.name === m.player2);
                return p1Exists && p2Exists;
              });

              box.matches.forEach(m => {
                const p1 = box.players.find(p => p.name === m.player1);
                const p2 = box.players.find(p => p.name === m.player2);

                if (p1 && p2) {
                  p1.played += 1;
                  p2.played += 1;

                  if (m.winner === m.player1) {
                    p1.won += 1;
                    p1.points += 3;
                    p2.points += 1;
                  } else if (m.winner === m.player2) {
                    p2.won += 1;
                    p2.points += 3;
                    p1.points += 1;
                  }
                }
              });
            }
            box.players.sort((a, b) => b.points - a.points || b.won - a.won);
          });
        }

      } else if (type === 'submit_score') {
        const { boxId, player1, player2, score, winner } = match;
        
        const box = dataToSave.boxes.find(b => b.id === boxId);
        if (!box) {
          return res.status(400).json({ error: 'Box group not found' });
        }

        if (!box.matches) box.matches = [];
        box.matches.push({
          player1,
          player2,
          score,
          winner,
          date: new Date().toISOString()
        });

        // Safe recalculation
        box.players.forEach(p => {
          p.played = 0;
          p.won = 0;
          p.points = 0;
        });

        box.matches.forEach(m => {
          const p1 = box.players.find(p => p.name === m.player1);
          const p2 = box.players.find(p => p.name === m.player2);

          if (p1 && p2) {
            p1.played += 1;
            p2.played += 1;

            if (m.winner === m.player1) {
              p1.won += 1;
              p1.points += 3;
              p2.points += 1;
            } else if (m.winner === m.player2) {
              p2.won += 1;
              p2.points += 3;
              p1.points += 1;
            }
          }
        });

        box.players.sort((a, b) => b.points - a.points || b.won - a.won);
      } else {
        return res.status(400).json({ error: 'Invalid update type' });
      }

      const encodedContent = Buffer.from(JSON.stringify(dataToSave, null, 2)).toString('base64');

      const saveResponse = await fetch(githubUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: type === 'admin_update_players' ? 'Admin updated players' : 'Submitted match score',
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
