import crypto from 'crypto'

function getSecret() {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set')
  }
  return secret
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in format: iv:authTag:ciphertext (all base64)
 */
export function encrypt(text) {
  if (!text) throw new Error('Text to encrypt cannot be empty')

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(getSecret(), 'hex'),
    iv
  )

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${Buffer.from(encrypted, 'hex').toString('base64')}`
}

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedText - Encrypted text in format: iv:authTag:ciphertext
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) throw new Error('Encrypted text cannot be empty')

  const [ivBase64, authTagBase64, ciphertextBase64] = encryptedText.split(':')
  if (!ivBase64 || !authTagBase64 || !ciphertextBase64) {
    throw new Error('Invalid encrypted text format')
  }

  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  const ciphertext = Buffer.from(ciphertextBase64, 'base64')

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(getSecret(), 'hex'),
    iv
  )
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString('utf8')
}
