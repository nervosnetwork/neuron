import { AddressType } from '../services/addresses'
import { KeysData } from './keystore'

// BIP32 Keychain
class Keychain {
  chainCode: Buffer
  index: number
  depth: number
  parentFingerprint: number

  privateKey: Buffer = Buffer.from('')
  publicKey: Buffer = Buffer.from('')

  constructor() {
    this.chainCode = Buffer.from('')
    this.index = 0
    this.depth = 0
    this.parentFingerprint = 0
  }

  public static fromPrivateKey = (_privateKey: Buffer, _chainCode: Buffer): Keychain => {
    // TODO
    return new Keychain()
  }

  public static fromSeed = (_seed: Buffer): Keychain => {
    // TODO
    return new Keychain()
  }

  derivePath = (_path: String): Keychain => {
    // TODO
    return new Keychain()
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
    const root: Keychain = Keychain.fromPrivateKey(
      Buffer.from(keysData.privateKey, 'hex'),
      Buffer.from(keysData.chainCode, 'hex'),
    )
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
