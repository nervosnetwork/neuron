import { ScriptCellInfo } from './asset-account-info'
import { SporeScript } from '@spore-sdk/core'
import OutPoint from './chain/out-point'
import CellDep, { DepType } from './chain/cell-dep'
import { ScriptHashType } from './chain/script'

export function toScriptInfo(sporeConfig: SporeScript): ScriptCellInfo {
  const cellDep = sporeConfig.cellDep

  const hashType: ScriptHashType = (() => {
    const sporeScriptHashType = sporeConfig.script.hashType
    if (sporeScriptHashType === 'type') return ScriptHashType.Type
    if (sporeScriptHashType === 'data') return ScriptHashType.Data
    if (sporeScriptHashType === 'data1') return ScriptHashType.Data1

    throw new Error(`Invalid hash type: ${sporeScriptHashType}`)
  })()

  return {
    cellDep: new CellDep(
      new OutPoint(cellDep.outPoint.txHash, cellDep.outPoint.index),
      cellDep.depType === 'depGroup' ? DepType.DepGroup : DepType.Code
    ),
    hashType: hashType,
    codeHash: sporeConfig.script.codeHash,
  }
}
