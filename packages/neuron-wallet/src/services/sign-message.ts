import AddressService from "./addresses"
import WalletService, { Wallet } from "./wallets"
import { AddressVersion } from "database/address/address-dao"
import Keychain from "models/keys/keychain"
import Blake2b from "models/blake2b"
import ECPair from "@nervosnetwork/ckb-sdk-utils/lib/ecpair"
import { ec as EC } from 'elliptic'
import LockUtils from "models/lock-utils"
import { AddressNotFound } from "exceptions"

export default class SignMessage {
  static GENERATE_COUNT = 100
  private static ec = new EC('secp256k1')

  public static sign(walletID: string, address: string, password: string, message: string): string {
    const addressVersion = address.startsWith('ckb') ? AddressVersion.Mainnet : AddressVersion.Testnet
    const wallet = WalletService.getInstance().get(walletID)
    const addresses = AddressService
      .allAddressesByWalletId(walletID, addressVersion)
    let addr = addresses.find(addr => addr.address === address)
    if (!addr) {
      throw new AddressNotFound()
    }

    // find private key of address
    const privateKey = this.getPrivateKey(wallet, addr!.path, password)

    return this.signByPrivateKey(privateKey, message)
  }

  private static signByPrivateKey(privateKey: string, message: string): string {
    const buffer = Buffer.from(message, 'utf-8')
    const blake2b = new Blake2b()
    blake2b.updateBuffer(buffer)
    const digest = blake2b.digest()
    const ecPair = new ECPair(privateKey)
    const signature = ecPair.signRecoverable(digest)
    const encoded = Buffer.from(signature.slice(2), 'hex').toString('base64')
    return encoded
  }

  public static verify(address: string, signature: string, message: string): boolean {
    const decodedSignature = '0x' + Buffer.from(signature, 'base64').toString('hex')

    const buffer = Buffer.from(message, 'utf-8')
    const blake2b = new Blake2b()
    blake2b.updateBuffer(buffer)
    const digest = blake2b.digest()

    const options = {
      r: decodedSignature.slice(2, 66),
      s: decodedSignature.slice(66 ,130),
      recoveryParam: parseInt(decodedSignature.slice(-1))
    }
    const msgBuffer = Buffer.from(digest.slice(2), 'hex')
    const publicKey = '0x' + this.ec.recoverPubKey(msgBuffer, options, options.recoveryParam).encode('hex', true)

    const recoverBlake160 = LockUtils.addressToBlake160(address)

    return Blake2b.digest(publicKey).slice(0, 42) === recoverBlake160
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
