import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import {
  AnyoneCanPayLockInfoOnAggron,
  AnyoneCanPayLockInfoOnLina,
  DefaultLockInfo,
  LegacyMultiSigLockInfo,
  MultiSigLockInfo,
} from './enums'

const getLockSupportShortAddress = (lock: CKBComponents.Script) => {
  return [
    LegacyMultiSigLockInfo,
    MultiSigLockInfo,
    DefaultLockInfo,
    AnyoneCanPayLockInfoOnAggron,
    AnyoneCanPayLockInfoOnLina,
  ].find(
    info =>
      lock.codeHash === info.CodeHash &&
      lock.hashType === info.HashType &&
      info.ArgsLen.split(',').includes(`${(lock.args.length - 2) / 2}`)
  )
}

export default getLockSupportShortAddress
