// Utility for encrypting and decrypting tokens using AES-256-GCM
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  console.warn('[tokenCrypto] ENCRYPTION_KEY not set in environment, using random key (tokens will not be decryptable across restarts)');
  ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
}
if (ENCRYPTION_KEY.length !== 64) {
  throw new Error('[tokenCrypto] ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
}
const IV_LENGTH = 12; // GCM recommended

/**
 * Encrypt a token string or Buffer using AES-256-GCM.
 * @param {string|Buffer} token - The token to encrypt.
 * @returns {string} The encrypted token in iv:authTag:encrypted format.
 */
export function encryptToken(token) {
  if ((!Buffer.isBuffer(token) && typeof token !== 'string') || !token || (typeof token === 'string' && !token.trim())) {
    throw new Error('Token to encrypt must be a non-empty string or Buffer');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(token, Buffer.isBuffer(token) ? undefined : 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}



/**
 * Decrypt a token string using AES-256-GCM.
 * @param {string} encrypted - The encrypted token in iv:authTag:encrypted format.
 * @returns {string} The decrypted token.
 */
export function decryptToken(encrypted) {
  if (typeof encrypted !== 'string' || !encrypted) {
    throw new Error('Encrypted token must be a non-empty string');
  }
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  const [ivHex, authTagHex, encryptedToken] = parts;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('Failed to decrypt token: ' + err.message);
  }
}

/**
 * Utility for testing: generate a random encryption key (hex string, 32 bytes).
 */
export function generateRandomKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Utility for testing: set the encryption key at runtime (for tests only).
 */
export function setEncryptionKey(hexKey) {
  if (typeof hexKey !== 'string' || hexKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
  }
  ENCRYPTION_KEY = hexKey;
}
