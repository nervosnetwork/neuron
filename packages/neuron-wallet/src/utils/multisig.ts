import { computeScriptHash as scriptToHash } from '@ckb-lumos/base/lib/utils'
import Multisig from '../models/multisig'
import MultisigConfigModel from '../models/multisig-config'
import { Signatures, SignStatus } from '../models/offline-sign'
import { OfflineSignJSON } from 'src/models/offline-sign'
import Transaction from '../models/chain/transaction'
import SystemScriptInfo from '../models/system-script-info'
import Input from '../models/chain/input'
import { hump } from './hump'
import { DepType } from '../models/chain/cell-dep'

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
  const { multisig_configs } = tx
  const txObj = hump(tx.transaction)

  if (multisig_configs) {
    const args = Object.keys(multisig_configs)[0]
    const lock = SystemScriptInfo.generateMultiSignScript(args)

    txObj.inputs.forEach((input: Input) => {
      if (!input?.lock) {
        input.lock = lock
      }
    })
  }

  if (!tx.transaction?.signatures && tx?.signatures) {
    tx.transaction.signatures = tx.signatures
    delete tx.signatures
  }

  if (tx.transaction.cellDeps) {
    tx.transaction.cellDeps.forEach(item => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (item.depType === 'dep_group') {
        item.depType = DepType.DepGroup
      }
    })
  }
  return txObj
}

export default {
  getMultisigStatus,
  parseMultisigTxJsonFromCkbCli,
}
