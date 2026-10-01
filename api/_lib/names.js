// The repo is public and every save is a commit, so a full name typed in once stays in the
// history for good. Only a first name, optionally with an initial, is ever stored.
//
// A name counts as full when any word after the first has two letters in a row. That still
// allows "Alex P.", "Emma B", "Will (10)" and the sign-up clash form "John S.2", and turns
// away "John Smith". A double first name has to be hyphenated ("Mary-Ann").
const HAS_WORD = /\p{L}{2}/u;

export function isFullName(raw) {
  const words = String(raw ?? '').trim().split(/\s+/).slice(1);
  return words.some(w => HAS_WORD.test(w));
}

export const FULL_NAME_ERROR = 'Please use a first name and initial only, for example John S. rather than a full name.';
