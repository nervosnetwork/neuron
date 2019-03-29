import { BIP32 } from 'bip32'
import Address from './address'

enum BIP44Params {
  Purpose = "44'",
  // 360 is tentative value
  CoinTypeTestnet = "360'",
  Account = "0'",
  // external address
  Change = 0,
}

const HD = {
  getPath: (index: number) => {
    return `m/${BIP44Params.Purpose}/${BIP44Params.CoinTypeTestnet}/${BIP44Params.Account}/${
      BIP44Params.Change
    }/${index}`
  },

  getAddressFromHDIndex: (root: BIP32, index: number) => {
    const path = HD.getPath(index)
    const { privateKey } = root.derivePath(path)
    return Address.getAddressFromPrivateKey(privateKey.toString('hex'))
  },
}

export default HD
