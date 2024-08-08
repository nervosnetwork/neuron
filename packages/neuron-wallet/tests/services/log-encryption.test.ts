import LogEncryption, { LogDecryption } from '../../src/services/log-encryption'
import { generateKeyPairSync } from 'node:crypto'

describe('Test LogEncryption', () => {
  it('encrypted message should be able to decrypt', () => {
    const { publicKey: adminPublicKey, privateKey: adminPrivateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    })

    const encryption = new LogEncryption(adminPublicKey.export({ format: 'pem', type: 'pkcs1' }).toString())
    const decryption = new LogDecryption(adminPrivateKey.export({ format: 'pem', type: 'pkcs1' }).toString())

    const message = 'hello'
    const encryptedMessage = encryption.encrypt(message)
    const decryptedMessage = decryption.decrypt(encryptedMessage)

    expect(decryptedMessage).toBe(message)
  })
})
