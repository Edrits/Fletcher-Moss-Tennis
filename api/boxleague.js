// FMST Singles League. Stored in boxleague.json in this repo.
// Players record results without a password; roster edits and deleting a match need it.
import { checkAdminPassword } from './_lib/admin-auth.js';
import { readRepoJson, updateRepoJson, repoHandler, httpError } from './_lib/repo-json.js';

const DATA_FILE = 'boxleague.json';

// Points: 3 for a win (including walkovers), 1 for showing up and losing, 0 for a no-show
function recalculateBox(box) {
  box.players.forEach(p => {
    p.played = 0;
    p.won = 0;
    p.points = 0;
  });

  box.matches = (box.matches || []).filter(m =>
    box.players.some(p => p.name === m.player1) &&
    box.players.some(p => p.name === m.player2)
  );

  box.matches.forEach(m => {
    const p1 = box.players.find(p => p.name === m.player1);
    const p2 = box.players.find(p => p.name === m.player2);

    p1.played += 1;
    p2.played += 1;

    const winner = m.winner === p1.name ? p1 : (m.winner === p2.name ? p2 : null);
    if (!winner) return;
    const loser = winner === p1 ? p2 : p1;

    winner.won += 1;
    winner.points += 3;
    if (m.noShow !== loser.name) {
      loser.points += 1;
    }
  });

  box.players.sort((a, b) => b.points - a.points || b.won - a.won);
}

function findBox(data, id) {
  const box = data.boxes.find(b => b.id === id);
  if (!box) throw httpError(400, 'League not found');
  return box;
}

export default repoHandler(async (req, res) => {
  if (req.method === 'GET') {
    const { data } = await readRepoJson(DATA_FILE);
    return res.status(200).json(data || { boxes: [] });
  }

  const { type, password, updatedBoxes, clearMatches, match, boxId, matchIndex } = req.body || {};

  if (type === 'admin_update_players' || type === 'delete_match') {
    const denied = await checkAdminPassword(req, password);
    if (denied) return res.status(denied.status).json({ error: denied.error });
  }

  let mutate, message;

  if (type === 'admin_update_players') {
    // Each player is { name, was }: was is the name the row was loaded with, so a rename
    // can carry that player's results across. A bare string is a row with no history.
    const rows = Array.isArray(updatedBoxes) && updatedBoxes.map(ub => ub && Array.isArray(ub.players) && ub.players.map(p =>
      typeof p === 'string' ? { name: p, was: '' } : p));
    if (!rows || rows.some(r => !r || r.some(p => !p || typeof p.name !== 'string' || typeof (p.was ?? '') !== 'string'))) {
      return res.status(400).json({ error: 'The player list is invalid. Please reload and try again.' });
    }
    for (const r of rows) {
      const names = r.map(p => p.name.trim()).filter(Boolean);
      // Standings and results match players by name, so two of the same would merge.
      if (new Set(names).size !== names.length) {
        return res.status(400).json({ error: 'Give each player a different name, for example Alex P. and Alex R.' });
      }
    }
    message = 'Admin updated players';
    mutate = data => {
      updatedBoxes.forEach((ub, i) => {
        const box = data.boxes.find(b => b.id === ub.id);
        if (!box) return;
        if (clearMatches) box.matches = [];
        // Leagues can have any number of players; blank rows are dropped
        const kept = rows[i].map(p => ({ name: p.name.trim(), was: (p.was || '').trim() })).filter(p => p.name);
        const renamed = new Map(kept.filter(p => p.was && p.was !== p.name).map(p => [p.was, p.name]));
        const rename = n => renamed.get(n) ?? n;
        (box.matches || []).forEach(m => {
          m.player1 = rename(m.player1);
          m.player2 = rename(m.player2);
          m.winner = rename(m.winner);
          if (m.noShow) m.noShow = rename(m.noShow);
        });
        box.players = kept.map(p => ({ name: p.name, played: 0, won: 0, points: 0 }));
      });
      data.boxes.forEach(recalculateBox);
      return data;
    };

  } else if (type === 'delete_match') {
    // A missing index used to reach splice(undefined, 1), which deletes the FIRST match.
    if (!Number.isInteger(matchIndex) || matchIndex < 0) {
      return res.status(400).json({ error: 'Match not found' });
    }
    message = 'Admin deleted match';
    mutate = data => {
      const box = findBox(data, boxId);
      if (!box.matches || matchIndex >= box.matches.length) throw httpError(400, 'Match not found');
      box.matches.splice(matchIndex, 1);
      recalculateBox(box);
      return data;
    };

  } else if (type === 'submit_score') {
    const { boxId: matchBoxId, player1, player2, winner, noShow } = match || {};
    message = 'Submitted match score';
    mutate = data => {
      const box = findBox(data, matchBoxId);
      const p1Exists = box.players.some(p => p.name === player1);
      const p2Exists = box.players.some(p => p.name === player2);
      if (!p1Exists || !p2Exists || player1 === player2) {
        throw httpError(400, 'Invalid players for this league');
      }
      if (winner !== player1 && winner !== player2) {
        throw httpError(400, 'Winner must be one of the two players');
      }
      if (noShow && (noShow === winner || (noShow !== player1 && noShow !== player2))) {
        throw httpError(400, 'No-show must be the non-attending player');
      }
      if (!box.matches) box.matches = [];
      box.matches.push({
        player1,
        player2,
        winner,
        noShow: noShow || null,
        date: new Date().toISOString()
      });
      recalculateBox(box);
      return data;
    };

  } else {
    return res.status(400).json({ error: 'Invalid update type' });
  }

  const saved = await updateRepoJson(DATA_FILE, data => mutate(data || { boxes: [] }), message);
  return res.status(200).json({ success: true, data: saved });
});
