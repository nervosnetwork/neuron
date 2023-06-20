import AddressService from './addresses'
import WalletService, { Wallet } from './wallets'
import Keychain from '../models/keys/keychain'
import { ec as EC } from 'elliptic'
import { AddressNotFound } from '../exceptions'
import HardwareWalletService from './hardware'
import AddressParser from '../models/address-parser'
import { hd, utils } from '@ckb-lumos/lumos'

export default class SignMessage {
  static GENERATE_COUNT = 100
  private static ec = new EC('secp256k1')
  private static magicString = 'Nervos Message:'

  public static async sign(walletID: string, address: string, password: string, message: string): Promise<string> {
    const wallet = WalletService.getInstance().get(walletID)
    const addresses = await AddressService.getAddressesByWalletId(walletID)
    let addr = addresses.find(addr => addr.address === address)
    if (!addr) {
      throw new AddressNotFound()
    }

    if (wallet.isHardware()) {
      let device = HardwareWalletService.getInstance().getCurrent()
      if (!device) {
        const deviceInfo = wallet.getDeviceInfo()
        device = await HardwareWalletService.getInstance().initHardware(deviceInfo)
        await device.connect()
      }
      const messagehex = Buffer.from(message, 'utf-8').toString('hex')
      return device.signMessage(addr.path, messagehex)
    }

    // find private key of address
    const privateKey = this.getPrivateKey(wallet, addr.path, password)

    return this.signByPrivateKey(privateKey, message)
  }

  private static signByPrivateKey(privateKey: string, message: string): string {
    const digest = SignMessage.signatureHash(message)
    const signature = hd.key.signRecoverable(digest, privateKey)
    return signature
  }

  public static verifyOldAndNew(
    address: string,
    signature: string,
    message: string
  ): 'old-sign' | 'new-sign' | undefined {
    let digest = SignMessage.signatureHash(message)

    if (SignMessage.verify(address, signature, digest)) {
      return 'new-sign'
    }
    const oldSignature = '0x' + Buffer.from(signature, 'base64').toString('hex')
    const buffer = Buffer.from(message, 'utf-8')
    const digestHash = utils.ckbHash(buffer)
    if (SignMessage.verify(address, oldSignature, digestHash)) {
      return 'old-sign'
    }
  }

  private static verify(address: string, signature: string, digest: string): boolean {
    try {
      const options = {
        r: signature.slice(2, 66),
        s: signature.slice(66, 130),
        recoveryParam: parseInt(signature.slice(-1)),
      }
      const msgBuffer = Buffer.from(digest.slice(2), 'hex')
      const publicKey =
        '0x' + SignMessage.ec.recoverPubKey(msgBuffer, options, options.recoveryParam).encode('hex', true)

      const recoverBlake160 = AddressParser.toBlake160(address)
      return utils.ckbHash(publicKey).slice(0, 42) === recoverBlake160
    } catch (error) {
      return false
    }
  }

  private static signatureHash(message: string) {
    const buffer = Buffer.from(SignMessage.magicString + message, 'utf-8')
    return utils.ckbHash(buffer)
  }

  private static getPrivateKey(wallet: Wallet, path: string, password: string): string {
    const masterPrivateKey = wallet.loadKeystore().extendedPrivateKey(password)
    const masterKeychain = new Keychain(
      Buffer.from(masterPrivateKey.privateKey, 'hex'),
      Buffer.from(masterPrivateKey.chainCode, 'hex')
    )

    return `0x${masterKeychain.derivePath(path).privateKey.toString('hex')}`
  }
}
