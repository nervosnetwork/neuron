import { ckbCore } from 'services/chain'
import { MultiSigLockInfo, DefaultLockInfo, AnyoneCanPayLockInfoOnAggron, AnyoneCanPayLockInfoOnLina } from './enums'

export const scriptToAddress = (lock: CKBComponents.Script, isMainnet: boolean) => {
  const addressPrefix = isMainnet ? ckbCore.utils.AddressPrefix.Mainnet : ckbCore.utils.AddressPrefix.Testnet

  const foundLock = [MultiSigLockInfo, DefaultLockInfo, AnyoneCanPayLockInfoOnAggron, AnyoneCanPayLockInfoOnLina].find(
    info =>
      lock.codeHash === info.CodeHash &&
      lock.hashType === info.HashType &&
      info.ArgsLen.split(',').includes(`${(lock.args.length - 2) / 2}`)
  )

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
