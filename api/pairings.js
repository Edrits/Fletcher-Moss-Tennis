// Court pairings board. Stored in pairings.json in this repo; saving needs the admin password.
import { validatePairings } from './_lib/pairings-core.js';
import { checkAdminPassword } from './_lib/admin-auth.js';
import { readRepoJson, updateRepoJson, repoHandler, httpError } from './_lib/repo-json.js';
import { planSignupSync, readSignupPlayers, PAIRINGS_FILE } from './_lib/pairings-sync.js';

const DATA_FILE = PAIRINGS_FILE;

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

  const { action, password, players, numCourts, numGames, generatedGames, activeGame, signupSession, from, expect } = req.body || {};
  const denied = await checkAdminPassword(req, password);
  if (denied) return res.status(denied.status).json({ error: denied.error });

  // Lightweight check used by the "unlock to edit" prompt — confirms the
  // password without writing anything back to the repo.
  if (action === 'verify') {
    return res.status(200).json({ valid: true });
  }

  // "Update from sign-up": the sign-up's promotion rule applied to the saved board, from
  // game `from` onwards. The preview says what would change; applying recomputes it on the
  // freshest board and sign-up, and refuses if the result is not what the organiser saw.
  if (action === 'sync_preview' || action === 'sync') {
    const signup = await readSignupPlayers();
    if (!signup.date) return res.status(400).json({ error: 'No session is open on the sign-up.' });
    const start = Number.isInteger(from) ? from : 0;
    if (action === 'sync_preview') {
      const { data } = await readRepoJson(DATA_FILE);
      const plan = planSignupSync(data || defaultData, signup.signed, start);
      return res.status(200).json({
        status: plan.status, message: plan.message, summary: plan.summary, map: plan.map,
        sameSession: !!(data && data.signupSession && data.signupSession.id === signup.id)
      });
    }
    const wanted = JSON.stringify(expect || null);
    const saved = await updateRepoJson(DATA_FILE, current => {
      const plan = planSignupSync(current || defaultData, signup.signed, start);
      if (plan.status !== 'apply' || JSON.stringify(plan.map) !== wanted) {
        throw httpError(409, 'The sign-up or the board changed while you were checking. Tap Update from sign-up again.');
      }
      const { autoNote, ...board } = plan.board;
      // Pressing the button ties the board to this sign-up session, so later dropouts
      // before the session starts are handled automatically.
      return { ...board, signupSession: { id: signup.id, date: signup.date }, updated: new Date().toISOString() };
    }, 'Updated court pairings from the sign-up');
    return res.status(200).json({ success: true, data: saved });
  }

  const invalid = validatePairings({ players, numCourts, numGames, generatedGames, activeGame });
  if (invalid) return res.status(400).json({ error: invalid });

  const dataToSave = {
    // Only the known fields are stored. joined/left mark a late arrival or early leaver.
    players: players.map(p => ({
      name: p.name.trim(),
      sub: !!p.sub,
      ...(Number.isInteger(p.joined) && p.joined > 0 ? { joined: p.joined } : {}),
      ...(Number.isInteger(p.left) ? { left: p.left } : {})
    })),
    numCourts: numCourts || 3,
    numGames: numGames || 6,
    generatedGames: generatedGames.map(game => ({
      ...game,
      sitters: game.sitters.map(name => name.trim()),
      courts: game.courts.map(court => court.map(team => team.map(name => name.trim())))
    })),
    activeGame: activeGame || 0,
    // Which sign-up session the board was made from, so it can follow that sign-up
    // automatically. Dropped if it is not a plain { id, date }.
    ...(signupSession && typeof signupSession.id === 'string' && signupSession.id.length <= 100 &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(signupSession.date)) ? { signupSession: { id: signupSession.id, date: signupSession.date } } : {}),
    updated: new Date().toISOString()
  };

  await updateRepoJson(DATA_FILE, () => dataToSave, 'Updated court pairings');
  return res.status(200).json({ success: true, data: dataToSave });
});
