import { computeScriptHash as scriptToHash } from '@ckb-lumos/lumos/utils'
import Multisig from '../models/multisig'
import MultisigConfigModel from '../models/multisig-config'
import { Signatures, SignStatus } from '../models/offline-sign'
import { OfflineSignJSON } from 'src/models/offline-sign'
import Transaction from '../models/chain/transaction'
import SystemScriptInfo from '../models/system-script-info'
import Input from '../models/chain/input'
import { deepCamelizeKeys } from './deep-camelize-keys'

export const getMultisigStatus = (multisigConfig: MultisigConfigModel, signatures: Signatures) => {
  const multisigLockHash = scriptToHash(
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

export const parseMultisigTxJsonFromCkbCli = (tx: OfflineSignJSON): Transaction => {
  const { multisig_configs, transaction } = tx
  const txObj = Transaction.fromObject(deepCamelizeKeys(transaction) as any)
  if (multisig_configs && Object.keys(multisig_configs).length) {
    const args = Object.keys(multisig_configs)[0]
    const lock = SystemScriptInfo.generateMultiSignScript(args)

    txObj.inputs.forEach((input: Input) => {
      if (!input?.lock) {
        input.lock = lock
      }
    })
  }
  if (!txObj?.signatures && tx?.signatures) {
    txObj.signatures = tx.signatures
  }
  return txObj
}

export default {
  getMultisigStatus,
  parseMultisigTxJsonFromCkbCli,
}
