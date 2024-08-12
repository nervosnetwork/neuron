import { randomBytes, createCipheriv, publicEncrypt, privateDecrypt, createDecipheriv } from 'node:crypto'
import logger from '../utils/logger'

export const DEFAULT_ALGORITHM = 'aes-256-cbc'

export default class LogEncryption {
  /**
   * We use CBC mode here to prevent pattern-discerned
   * > a one-bit change in a plaintext or initialization vector (IV) affects all following ciphertext blocks
   * @private
   */
  private readonly algorithm = DEFAULT_ALGORITHM

  /**
   * A PEM-formatted RSA public key
   * @private
   */
  private readonly adminPublicKey: string

  public get isEnabled(): boolean {
    return !!this.adminPublicKey
  }

  /**
   *
   * @param adminPublicKey a PEM-formatted RSA public key
   */
  constructor(adminPublicKey: string) {
    this.adminPublicKey = adminPublicKey.replace(/\\n/g, '\n')
  }

  /**
   * Encrypt a message
   * @param message
   */
  encrypt(message: unknown): string {
    if (message == null) return ''
    if (!this.adminPublicKey) return 'The admin public key does not exist, skip encrypting message'

    const localLogKey = randomBytes(32)
    const iv = randomBytes(16)

    const cipher = createCipheriv(this.algorithm, localLogKey, iv)
    const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message, JSONSerializer)

    const encryptedLogKey = publicEncrypt(this.adminPublicKey, localLogKey).toString('base64')
    const encryptedMsg = Buffer.concat([cipher.update(serializedMessage), cipher.final()]).toString('base64')

    return `[key:${encryptedLogKey}] [iv:${iv.toString('base64')}] ${encryptedMsg}`
  }

  private static instance: LogEncryption

  static getInstance(): LogEncryption {
    if (!LogEncryption.instance) {
      const adminPublicKey = process.env.LOG_ENCRYPTION_PUBLIC_KEY ?? ''
      if (!adminPublicKey) {
        logger.warn('LOG_ENCRYPTION_PUBLIC_KEY is required to create LogEncryption instance')
      }

      LogEncryption.instance = new LogEncryption(adminPublicKey)
    }

    return LogEncryption.instance
  }
}

export class LogDecryption {
  private readonly adminPrivateKey: string

  constructor(adminPrivateKey: string) {
    this.adminPrivateKey = adminPrivateKey
  }

  decrypt(encryptedMessage: string): string {
    const { iv, key, content } = parseMessage(encryptedMessage)

    const decipher = createDecipheriv(
      DEFAULT_ALGORITHM,
      privateDecrypt(this.adminPrivateKey, Buffer.from(key, 'base64')),
      Buffer.from(iv, 'base64')
    )

    return Buffer.concat([decipher.update(content, 'base64'), decipher.final()]).toString('utf-8')
  }
}

/**
 * Parse a message into a JSON
 *
 * Input:
 * ```
 * [key1:value2] [key2:value2] remain content
 * ```
 * Output:
 * ```json
 * {
 *   "key1": "value1",
 *   "key2": "value2",
 *   "content": "remain content"
 *  }
 * ```
 * @param message
 */
function parseMessage(message: string) {
  const result: Record<string, string> = {}
  const regex = /\[([^\]:]+):([^\]]+)]/g
  let match
  let lastIndex = 0

  while ((match = regex.exec(message)) !== null) {
    const [, key, value] = match
    result[key.trim()] = value.trim()
    lastIndex = regex.lastIndex
  }

  // Extract remaining content after the last bracket
  const remainingContent = message.slice(lastIndex).trim()
  if (remainingContent) {
    result.content = remainingContent
  }

  return result
}

const JSONSerializer = (_key: string, value: any) => {
  if (typeof value === 'bigint') {
    return String(value) + 'n'
  }
  return value
}
