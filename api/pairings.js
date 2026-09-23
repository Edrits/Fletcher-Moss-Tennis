// Court pairings board. Stored in pairings.json in this repo; saving needs the admin password.
import { validatePairings } from './_lib/pairings-core.js';
import { checkAdminPassword } from './_lib/admin-auth.js';
import { readRepoJson, updateRepoJson, repoHandler } from './_lib/repo-json.js';

const DATA_FILE = 'pairings.json';

const defaultData = {
  players: ["Ed", "Sofia", "Will", "Adam", "Alex", "Adam B", "Daniel", "Kamal", "Emma B", "Will (10)", "Rhys", "Lucy", "Joe", "Michael"]
    .map((name, i, arr) => ({ name, sub: i >= arr.length - 2 })),
  numCourts: 3,
  numGames: 6,
  generatedGames: [],
  activeGame: 0,
  updated: null
};

export default repoHandler(async (req, res) => {
  if (req.method === 'GET') {
    const { data } = await readRepoJson(DATA_FILE);
    return res.status(200).json(data || defaultData);
  }

  const { action, password, players, numCourts, numGames, generatedGames, activeGame } = req.body || {};
  const denied = await checkAdminPassword(req, password);
  if (denied) return res.status(denied.status).json({ error: denied.error });

  // Lightweight check used by the "unlock to edit" prompt — confirms the
  // password without writing anything back to the repo.
  if (action === 'verify') {
    return res.status(200).json({ valid: true });
  }

  const invalid = validatePairings({ players, numCourts, numGames, generatedGames, activeGame });
  if (invalid) return res.status(400).json({ error: invalid });

  const dataToSave = {
    players: players.map(p => ({ ...p, name: p.name.trim() })),
    numCourts: numCourts || 3,
    numGames: numGames || 6,
    generatedGames: generatedGames.map(game => ({
      ...game,
      sitters: game.sitters.map(name => name.trim()),
      courts: game.courts.map(court => court.map(team => team.map(name => name.trim())))
    })),
    activeGame: activeGame || 0,
    updated: new Date().toISOString()
  };

  await updateRepoJson(DATA_FILE, () => dataToSave, 'Updated court pairings');
  return res.status(200).json({ success: true, data: dataToSave });
});
