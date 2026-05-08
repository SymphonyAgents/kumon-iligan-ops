// Particles in Filipino / Spanish / Dutch / German names that stay lowercase
// unless they're the very first word.
const LOWERCASE_PARTICLES = new Set([
  'de', 'del', 'dela', 'della', 'des', 'di', 'da', 'do', 'dos', 'das',
  'la', 'le', 'lo', 'las', 'los', 'el', 'al',
  'van', 'von', 'der', 'den',
  'y', 'e',
  'st',
]);

// Suffixes / Roman numerals that stay UPPER (case-insensitive match).
const UPPER_TOKENS = new Set([
  'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
  'jr', 'sr',
]);

function capFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function titleizeWord(word: string, isFirst: boolean): string {
  if (!word) return word;
  const lower = word.toLowerCase();

  // Roman numerals / Jr / Sr → upper. Strip trailing punctuation when comparing.
  const stripped = lower.replace(/[.,]/g, '');
  if (UPPER_TOKENS.has(stripped)) {
    return word.toUpperCase();
  }

  // Particles stay lowercase unless they're the leading token of the phrase.
  if (!isFirst && LOWERCASE_PARTICLES.has(stripped)) {
    return lower;
  }

  // Apostrophes: O'brien → O'Brien, d'angelo → D'Angelo
  if (lower.includes("'")) {
    return lower.split("'").map(capFirst).join("'");
  }

  // Hyphens: mary-jane → Mary-Jane
  if (lower.includes('-')) {
    return lower.split('-').map(capFirst).join('-');
  }

  // Mc / Mac prefixes (mcdonald → McDonald, macarthur → MacArthur)
  if (/^mc[a-z]/.test(lower)) {
    return 'Mc' + capFirst(lower.slice(2));
  }
  if (/^mac[a-z]{2,}/.test(lower) && !LOWERCASE_PARTICLES.has(lower)) {
    return 'Mac' + capFirst(lower.slice(3));
  }

  return capFirst(lower);
}

/**
 * Title Case for display values — names, addresses, places.
 *
 * Handles:
 *   - particles (de, dela, van, von, …) — lowercase mid-string
 *   - suffixes (Jr, Sr, II, III, …) — UPPER
 *   - apostrophes (O'Brien, D'Angelo)
 *   - hyphens (Mary-Jane)
 *   - Mc / Mac prefixes (McDonald, MacArthur)
 *   - comma / slash boundaries reset "first word" so each segment titles cleanly
 *
 * Use for: guardian names, student names, addresses, branch names.
 * NOT for: emails, phone numbers, IDs, reference codes, brand names (GCash, BPI).
 */
export function toTitleCase(value: string | null | undefined): string {
  if (!value) return '';
  // Split on whitespace + comma/slash boundaries while keeping the separators
  // so we can rejoin them faithfully.
  const tokens = value.trim().split(/(\s+|,\s*|\/\s*)/);
  let wordIndex = 0;
  return tokens
    .map((token) => {
      if (/^\s+$/.test(token) || /^,\s*$/.test(token) || /^\/\s*$/.test(token)) {
        // Separator passes through; reset wordIndex on comma/slash so each
        // segment ("Bo. Buhanginan, Iligan City") gets a capitalised first word.
        if (token.startsWith(',') || token.startsWith('/')) wordIndex = 0;
        return token;
      }
      const out = titleizeWord(token, wordIndex === 0);
      wordIndex += 1;
      return out;
    })
    .join('');
}

/** Combine first + last and Title-Case the result. */
export function fullName(first?: string | null, last?: string | null): string {
  const joined = [first, last].filter(Boolean).join(' ').trim();
  return toTitleCase(joined);
}
