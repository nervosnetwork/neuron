import { utils } from '@ckb-lumos/lumos'
import Multisig from '../models/multisig'
import MultisigConfigModel from '../models/multisig-config'
import { Signatures, SignStatus } from '../models/offline-sign'

export const getMultisigStatus = (multisigConfig: MultisigConfigModel, signatures: Signatures) => {
  const multisigLockHash = utils.computeScriptHash(
    Multisig.getMultisigScript(multisigConfig.blake160s, multisigConfig.r, multisigConfig.m, multisigConfig.n)
  )
  let signed = 0
  signatures?.[multisigLockHash]?.forEach(blake160 => {
    if (multisigConfig.blake160s.includes(blake160)) {
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
    if (!signatures?.[multisigLockHash]?.includes(multisigConfig.blake160s[i])) {
      return SignStatus.PartiallySigned
    }
  }
  return SignStatus.Signed
}

export default {
  getMultisigStatus,
}
