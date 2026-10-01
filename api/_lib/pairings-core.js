// Names are player identities in the board. Empty seats are deliberately not identities.
//
// A player can arrive or leave part-way through a session. `joined` is the first game
// (0-based) they are in and `left` is the first game they are no longer in; both are
// optional, and a player without them is in every game. Every game must contain exactly
// the players present for it, on court or sitting out, so a player can never be dropped
// or duplicated by accident.
export function validatePairings({ players, numCourts, numGames, generatedGames, activeGame }) {
  if (!Array.isArray(players) || players.some(p => !p || typeof p.name !== 'string')) {
    return 'The player list is invalid. Please reload and try again.';
  }
  const names = players.map(p => p.name.trim()).filter(Boolean);
  if (new Set(names).size !== names.length) return 'Give each player a different name, for example Alex P. and Alex R.';
  if (!Number.isInteger(numCourts) || numCourts < 1 || numCourts > 4 ||
      !Number.isInteger(numGames) || numGames < 1 || numGames > 50 || !Array.isArray(generatedGames)) {
    return 'The court or game settings are invalid.';
  }
  if (!Number.isInteger(activeGame) || activeGame < 0 ||
      (generatedGames.length ? activeGame >= generatedGames.length : activeGame !== 0)) return 'The selected game is invalid.';
  if (generatedGames.length && generatedGames.length !== numGames) return 'The number of saved games does not match the settings.';

  const total = generatedGames.length;
  for (const p of players) {
    if (!p.name.trim()) continue;
    const joined = p.joined ?? 0, left = p.left ?? null;
    if (!Number.isInteger(joined) || joined < 0 || (total ? joined >= total : joined !== 0) ||
        (left !== null && (!Number.isInteger(left) || left <= joined || left > total))) {
      return 'A player has an invalid arrival or departure game. Please reload and try again.';
    }
  }

  for (let gi = 0; gi < total; gi++) {
    const game = generatedGames[gi];
    // Courts may differ between games, so a court can be added part-way through a session
    // without rewriting games already played. Each court is two teams of two.
    if (!game || !Array.isArray(game.sitters) || !Array.isArray(game.courts) || game.courts.length < 1 || game.courts.length > 4 ||
        game.courts.some(c => !Array.isArray(c) || c.length !== 2 || c.some(t => !Array.isArray(t) || t.length !== 2))) {
      return 'Every court needs two teams of two, including empty seats.';
    }
    const slots = [...game.sitters, ...game.courts.flat(2)];
    if (slots.some(n => typeof n !== 'string')) return 'A game contains an invalid player.';
    const playing = slots.map(n => n.trim()).filter(Boolean);
    const present = players
      .filter(p => p.name.trim() && (p.joined ?? 0) <= gi && (p.left == null || gi < p.left))
      .map(p => p.name.trim());
    if (playing.length !== present.length || new Set(playing).size !== playing.length || playing.some(n => !present.includes(n))) {
      return 'Each named player must appear exactly once per game, including those sitting out. Correct the list and generate again.';
    }
  }
  return null;
}
