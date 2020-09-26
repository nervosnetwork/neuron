import { ckbCore } from 'services/chain'
import { MultiSigLockInfo, DefaultLockInfo } from './enums'

export const scriptToAddress = (lock: CKBComponents.Script, isMainnet: boolean) => {
  const addressPrefix = isMainnet ? ckbCore.utils.AddressPrefix.Mainnet : ckbCore.utils.AddressPrefix.Testnet

  const foundLock = [MultiSigLockInfo, DefaultLockInfo].find(
    info => lock.codeHash === info.CodeHash && lock.hashType === info.HashType
  )

  if (foundLock) {
    return ckbCore.utils.bech32Address(lock.args, {
      prefix: addressPrefix,
      type: ckbCore.utils.AddressType.HashIdx,
      codeHashOrCodeHashIndex: foundLock.CodeHashIndex,
    })
  }

  return ckbCore.utils.fullPayloadToAddress({
    arg: lock.args,
    prefix: addressPrefix,
    type: lock.hashType === 'data' ? ckbCore.utils.AddressType.DataCodeHash : ckbCore.utils.AddressType.TypeCodeHash,
    codeHash: lock.codeHash,
  })
}

export default scriptToAddress
