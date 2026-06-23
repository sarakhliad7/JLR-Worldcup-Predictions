// Password hashing using Node's built-in crypto.scrypt — no external dependency needed.
// Stored format: "scrypt:<saltHex>:<hashHex>"

import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt:')) return false;
  const [, salt, hashHex] = stored.split(':');
  const hash = scryptSync(password, salt, 64);
  const storedHash = Buffer.from(hashHex, 'hex');
  if (hash.length !== storedHash.length) return false;
  return timingSafeEqual(hash, storedHash);
}

// Generates a short, readable random password for newly-created accounts,
// e.g. "kite-47-hazel". Avoids ambiguous characters and is easy to read aloud
// or type from a screen when an admin hands it to an employee.
const WORDS = [
  'kite', 'hazel', 'cedar', 'amber', 'coral', 'maple', 'plum', 'sable',
  'opal', 'birch', 'ember', 'fern', 'jade', 'lumen', 'pearl', 'reef',
  'sage', 'slate', 'storm', 'tidal', 'vivid', 'willow', 'zephyr', 'quartz',
];

export function generatePassword() {
  const w1 = WORDS[randomBytes(1)[0] % WORDS.length];
  const w2 = WORDS[randomBytes(1)[0] % WORDS.length];
  const num = 10 + (randomBytes(1)[0] % 90); // 10-99
  return `${w1}-${num}-${w2}`;
}
