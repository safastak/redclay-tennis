import bcrypt from 'bcrypt';

/**
 * Get the number of bcrypt rounds from environment variable
 * Default to 12 rounds if not specified (provides good security/performance balance)
 */
function getBcryptRounds(): number {
  const rounds = process.env.BCRYPT_ROUNDS;
  if (!rounds) {
    return 12;
  }

  const parsed = parseInt(rounds, 10);
  if (isNaN(parsed) || parsed < 4 || parsed > 31) {
    console.warn(
      `Invalid BCRYPT_ROUNDS value "${rounds}". Using default of 12.`
    );
    return 12;
  }

  return parsed;
}

/**
 * Hash a password using bcrypt
 * @param password - The plain text password to hash
 * @returns The hashed password
 * @throws Error if password is empty or hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password cannot be empty');
  }

  if (password.length < 1) {
    throw new Error('Password cannot be empty');
  }

  const rounds = getBcryptRounds();

  try {
    const hash = await bcrypt.hash(password, rounds);
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password - The plain text password to compare
 * @param hash - The hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    // Log error but don't expose details to prevent timing attacks
    console.error('Error comparing passwords:', error);
    return false;
  }
}
