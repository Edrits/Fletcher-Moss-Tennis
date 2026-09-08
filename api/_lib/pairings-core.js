// Names are player identities in the board. Empty seats are deliberately not identities.
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
  for (const game of generatedGames) {
    if (!game || !Array.isArray(game.sitters) || !Array.isArray(game.courts) || game.courts.length !== numCourts ||
        game.courts.some(c => !Array.isArray(c) || c.length !== 2 || c.some(t => !Array.isArray(t) || t.length !== 2))) {
      return 'Every court needs two teams of two, including empty seats.';
    }
    const slots = [...game.sitters, ...game.courts.flat(2)];
    if (slots.some(n => typeof n !== 'string')) return 'A game contains an invalid player.';
    const playing = slots.map(n => n.trim()).filter(Boolean);
    if (playing.length !== names.length || new Set(playing).size !== playing.length || playing.some(n => !names.includes(n))) {
      return 'Each named player must appear exactly once per game, including those sitting out. Correct the list and generate again.';
    }
  }
  return null;
}
