import { randomBytes, createCipheriv, createHash, publicEncrypt, createPublicKey } from 'node:crypto'
import { machineIdSync } from '../utils/machineid'
import logger from '../utils/logger'

export default class LogEncryption {
  private static instance: LogEncryption
  private static algorithm = 'aes-256-cbc'

  /**
   * A determinable AES key for encrypting log message
   * @private
   */
  private static localLogKey: Uint8Array

  /**
   * The RSA encrypted {@link localLogKey} in base64 format
   * @private
   */
  private static encryptedLogKey: string

  private constructor() {}

  static getInstance(): LogEncryption {
    if (!LogEncryption.instance) {
      const adminPublicKey = process.env.LOG_ENCRYPTION_PUBLIC_KEY
      if (!adminPublicKey) {
        throw new Error('LOG_ENCRYPTION_PUBLIC_KEY is required to create LogEncryption instance')
      }

      const localLogKey = Buffer.from(createHash('sha256').update(machineIdSync(false)).digest())
      LogEncryption.localLogKey = localLogKey
      LogEncryption.encryptedLogKey = publicEncrypt(createPublicKey(adminPublicKey!), localLogKey).toString('base64')

      LogEncryption.instance = new LogEncryption()
      logger.info('LogEncryption key', LogEncryption.encryptedLogKey)
    }

    return LogEncryption.instance
  }

  /**
   * Encrypt a message
   * @param message
   * @param iv
   */
  encrypt(message: unknown, iv?: Uint8Array): string {
    if (message == null) return ''
    let prependIV = false
    if (!iv) {
      prependIV = true
      iv = randomBytes(16)
    }

    const cipher = createCipheriv(LogEncryption.algorithm, LogEncryption.localLogKey, iv)
    const serializedMessage = typeof message === 'string' ? message : JSON.stringify(message, JSONSerializer)
    const encryptedMsg = Buffer.concat([cipher.update(serializedMessage), cipher.final()]).toString('base64')

    if (prependIV) {
      return `[iv:${Buffer.from(iv).toString('base64')}] ${encryptedMsg}`
    }

    return encryptedMsg
  }
}

const JSONSerializer = (_key: string, value: any) => {
  if (typeof value === 'bigint') {
    return String(value) + 'n'
  }
  return value
}

logger.info(LogEncryption.getInstance().encrypt('hello world'))
