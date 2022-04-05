import { ckbCore } from 'services/chain'
import getLockSupportShortAddress from './getLockSupportShortAddress'

export const scriptToAddress = (lock: CKBComponents.Script, isMainnet: boolean) => {
  const addressPrefix = isMainnet ? ckbCore.utils.AddressPrefix.Mainnet : ckbCore.utils.AddressPrefix.Testnet

  const foundLock = getLockSupportShortAddress(lock)

  if (foundLock) {
    return ckbCore.utils.bech32Address(lock.args, {
      prefix: addressPrefix,
      type: ckbCore.utils.AddressType.HashIdx,
      codeHashOrCodeHashIndex: foundLock.CodeHashIndex,
    })
  }

  return ckbCore.utils.scriptToAddress(lock, isMainnet)
}

export default scriptToAddress
