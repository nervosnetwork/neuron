import crypto from 'crypto'
import { ec as EC } from 'elliptic'
import BN from 'bn.js'

const ec = new EC('secp256k1')

export const privateToPublic = (privateKey: Buffer) => {
  if (privateKey.length !== 32) {
    throw new Error('Private key must be 32 bytes')
  }

  return Buffer.from(ec.keyFromPrivate(privateKey).getPublic(true, 'hex') as string, 'hex')
}

const EMPTY_BUFFER = Buffer.from('')

// BIP32 Keychain. Not a full implementation.
export default class Keychain {
  privateKey: Buffer = EMPTY_BUFFER
  publicKey: Buffer = EMPTY_BUFFER
  chainCode: Buffer = EMPTY_BUFFER
  index: number = 0
  depth: number = 0
  identifier: Buffer = EMPTY_BUFFER
  fingerprint: number = 0
  parentFingerprint: number = 0

  constructor(privateKey: Buffer, chainCode: Buffer) {
    this.privateKey = privateKey
    this.chainCode = chainCode

    if (!this.isNeutered()) {
      this.publicKey = privateToPublic(this.privateKey)
    }
  }

  calculateFingerprint = () => {
    this.identifier = this.hash160(this.publicKey)
    this.fingerprint = this.identifier.slice(0, 4).readUInt32BE(0)
  }

  public static fromSeed = (seed: Buffer): Keychain => {
    const i = crypto
      .createHmac('sha512', Buffer.from('Bitcoin seed', 'utf8'))
      .update(seed)
      .digest()
    const keychain = new Keychain(i.slice(0, 32), i.slice(32))
    keychain.calculateFingerprint()
    return keychain
  }

  // Create a child keychain with extended public key and path.
  // Children of this keychain should not have any hardened paths.
  public static fromPublicKey = (publicKey: Buffer, chainCode: Buffer, path: String): Keychain => {
    const keychain = new Keychain(EMPTY_BUFFER, chainCode)
    keychain.publicKey = publicKey
    keychain.calculateFingerprint()

    const pathComponents = path.split('/')
    keychain.depth = pathComponents.length - 1
    keychain.index = parseInt(pathComponents[pathComponents.length - 1], 10)

    return keychain
  }

  public deriveChild = (index: number, hardened: boolean): Keychain => {
    let data: Buffer

    const indexBuffer = Buffer.allocUnsafe(4)

    if (hardened) {
      const pk = Buffer.concat([Buffer.alloc(1, 0), this.privateKey])
      indexBuffer.writeUInt32BE(index + 0x80000000, 0)
      data = Buffer.concat([pk, indexBuffer])
    } else {
      indexBuffer.writeUInt32BE(index, 0)
      data = Buffer.concat([this.publicKey, indexBuffer])
    }

    const i = crypto
      .createHmac('sha512', this.chainCode)
      .update(data)
      .digest()
    const il = i.slice(0, 32)
    const ir = i.slice(32)

    let child: Keychain
    if (this.isNeutered()) {
      child = new Keychain(EMPTY_BUFFER, ir)
      child.publicKey = Keychain.publicKeyAdd(this.publicKey, il)
      child.calculateFingerprint()
    } else {
      const privateKey = Keychain.privateKeyAdd(this.privateKey, il)
      child = new Keychain(privateKey, ir)
      child.calculateFingerprint()
    }

    child.index = index
    child.depth = this.depth + 1
    child.parentFingerprint = this.fingerprint

    return child
  }

  public derivePath = (path: string): Keychain => {
    const master = ['m', `/`, '']
    if (master.includes(path)) {
      return this
    }

    let bip32: Keychain = this

    let entries = path.split('/')
    if (entries[0] === 'm') {
      entries = entries.slice(1)
    }
    entries.forEach(c => {
      const childIndex = parseInt(c, 10)
      const hardened = c.length > 1 && c[c.length - 1] === "'"
      bip32 = bip32.deriveChild(childIndex, hardened)
    })

    return bip32
  }

  isNeutered = (): Boolean => {
    return this.privateKey === EMPTY_BUFFER
  }

  hash160 = (data: Buffer): Buffer => {
    const sha256 = crypto
      .createHash('sha256')
      .update(data)
      .digest()
    return crypto
      .createHash('ripemd160')
      .update(sha256)
      .digest()
  }

  private static privateKeyAdd = (privateKey: Buffer, factor: Buffer): Buffer => {
    const result = new BN(factor)
    result.iadd(new BN(privateKey))
    if (result.cmp(ec.curve.n) >= 0) {
      result.isub(ec.curve.n)
    }

    return result.toArrayLike(Buffer, 'be', 32)
  }

  private static publicKeyAdd = (publicKey: Buffer, factor: Buffer): Buffer => {
    const x = new BN(publicKey.slice(1)).toRed(ec.curve.red)
    let y = x
      .redSqr()
      .redIMul(x)
      .redIAdd(ec.curve.b)
      .redSqrt()
    if ((publicKey[0] === 0x03) !== y.isOdd()) {
      y = y.redNeg()
    }
    const point = ec.curve.g.mul(new BN(factor)).add({ x, y })
    return Buffer.from(point.encode(true, true))
  }
}
