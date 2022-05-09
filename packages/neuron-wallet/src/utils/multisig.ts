import { addressToScript, scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import MultisigConfigModel from 'models/multisig-config'
import { Signatures, SignStatus } from 'models/offline-sign'

export const getMultisigStatus = (multisigConfig: MultisigConfigModel, signatures: Signatures) => {
  const multisigLockHash = scriptToHash(addressToScript(multisigConfig.fullPayload))
  const multisigBlake160s = multisigConfig.addresses.map(v => addressToScript(v).args)
  let signed = 0
  signatures?.[multisigLockHash]?.forEach(blake160 => {
    if (multisigBlake160s.includes(blake160)) {
      signed += 1
    }
  })
  if (signed === 0) {
    return SignStatus.Unsigned
  }
  if (signed < multisigConfig.m) {
    return SignStatus.PartiallySigned
  }
  for (let i = 0; i < multisigConfig.r; i++) {
    if (!signatures?.[multisigLockHash]?.includes(multisigBlake160s[i])) {
      return SignStatus.PartiallySigned
    }
  }
  return SignStatus.Signed
}

export default {
  getMultisigStatus
}
