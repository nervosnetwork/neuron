import { DefaultLockInfo, MultiSigLockInfo, AnyoneCanPayLockInfoOnLina, AnyoneCanPayLockInfoOnAggron } from './enums'

const scriptTypeMap: Record<
  string,
  {
    CodeHash: string
    HashType: string
  }[]
> = {
  'SECP256K1/blake160': [DefaultLockInfo],
  'SECP256K1/multisig': [MultiSigLockInfo],
  anyone_can_pay: [AnyoneCanPayLockInfoOnLina, AnyoneCanPayLockInfoOnAggron],
}

export function getScriptFormat(script: CKBComponents.Script) {
  const keys = Object.keys(scriptTypeMap)
  for (let i = 0; i < keys.length; i++) {
    if (scriptTypeMap[keys[i]].some(v => v.CodeHash === script.codeHash && v.HashType === script.hashType)) {
      return keys[i]
    }
  }
  return ''
}

export default {
  getScriptFormat,
}
