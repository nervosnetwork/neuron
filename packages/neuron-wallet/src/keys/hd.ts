import crypto from 'crypto'
import { ec as EC } from 'elliptic'
import { AddressType } from '../services/addresses'
import { KeysData } from './keystore'

const ec = new EC('secp256k1')

// BIP32 Keychain. Note this is not a full implementation.
class Keychain {
  privateKey: Buffer = Buffer.from('')
  publicKey: Buffer = Buffer.from('')
  chainCode: Buffer = Buffer.from('')
  index: number = 0
  depth: number = 0
  identifier: Buffer = Buffer.from('')
  fingerprint: number = 0
  parentFingerprint: number = 0

  constructor(privateKey: Buffer, chainCode: Buffer) {
    this.privateKey = privateKey
    this.chainCode = chainCode

    this.publicKey = Buffer.from(ec.keyFromPrivate(this.privateKey).getPublic(true, 'hex') as string, 'hex')

    this.identifier = this.hash160(this.publicKey)
    this.fingerprint = this.identifier.slice(0, 4).readUInt32BE(0)
  }

  public static fromSeed = (seed: Buffer): Keychain => {
    const i = crypto
      .createHmac('sha512', Buffer.from('Bitcoin seed', 'utf8'))
      .update(seed)
      .digest()
    return new Keychain(i.slice(0, 32), i.slice(32))
  }

  public deriveChild = (index: number, hardened: boolean): Keychain => {
    let data: Buffer

    const indexBuffer = Buffer.allocUnsafe(4)

    if (hardened) {
      const pk = Buffer.concat([Buffer.alloc(1, 0), this.privateKey])
      data = Buffer.concat([pk, indexBuffer])
      indexBuffer.writeUInt32BE(index + 0x80000000, 0)
    } else {
      data = Buffer.concat([this.publicKey, indexBuffer])
      indexBuffer.writeUInt32BE(index, 0)
    }

    const i = crypto
      .createHmac('sha512', this.chainCode)
      .update(data)
      .digest()
    const privateKey = this.add(this.privateKey, i.slice(0, 32))
    const child = new Keychain(privateKey, i.slice(32))
    child.index = index
    child.depth = this.depth + 1
    child.parentFingerprint = this.fingerprint

    return child
  }

  public derivePath = (path: string): Keychain => {
    const master = ['m', `m'`, 'M', `M'`]
    if (master.includes(path)) {
      return this
    }

    const entries = path.split('/')
    let bip32: Keychain = this
    entries.forEach((c, i) => {
      if (i === 0 && !master.includes(c)) {
        return
      }

      const childIndex = parseInt(c, 10)
      const hardened = c.length > 1 && c[c.length - 1] === "'"

      bip32 = bip32.deriveChild(childIndex, hardened)
    })

    return bip32
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

  add = (privateKey: Buffer, factor: Buffer): Buffer => {
    const curveOrder = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141')
    const result =
      (BigInt(`0x${privateKey.toString('hex')}`) + BigInt(`0x${factor.toString('hex')}`)) % BigInt(curveOrder)
    return Buffer.from(result.toString(16), 'hex')
  }
}

class HD {
  public static pathFromIndex = (type: AddressType, index: number) => {
    return `m/44'/309'/0'/${type}/${index}`
  }

  public static indexFromPath = (path: string) => {
    const array: string[] = path.split('/')
    return array[array.length - 1]
  }

  public static keyFromHDIndex = (keysData: KeysData, index: number, type = AddressType.Receiving) => {
    const root = new Keychain(Buffer.from(keysData.privateKey, 'hex'), Buffer.from(keysData.chainCode, 'hex'))
    const path = HD.pathFromIndex(type, index)
    const { privateKey, publicKey } = root.derivePath(path)
    if (privateKey && publicKey && path) {
      return {
        privateKey: privateKey.toString('hex'),
        publicKey: publicKey.toString('hex'),
        path,
      }
    }
    throw new Error('Empty private key')
  }
}

export { Keychain }
export default HD
