import AssetAccountInfo, { ScriptCellInfo } from './asset-account-info'
import { SporeConfig, SporeScript } from '@spore-sdk/core'
import OutPoint from './chain/out-point'
import CellDep, { DepType } from './chain/cell-dep'
import { ScriptHashType } from './chain/script'
import NetworksService from '../services/networks'
import NodeService from '../services/node'

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

export function toSporeScript(info: ScriptCellInfo): SporeScript {
  return {
    script: { codeHash: info.codeHash, hashType: info.hashType },
    cellDep: info.cellDep,
  }
}

export function getSporeConfig(): SporeConfig {
  const spore = new AssetAccountInfo().getSporeInfos()
  const cluster = new AssetAccountInfo().getSporeClusterInfo()

  return {
    scripts: {
      Spore: {
        ...toSporeScript(spore[0]),
        versions: spore.slice(1).map(toSporeScript),
      },

      Cluster: {
        ...toSporeScript(cluster[0]),
        versions: cluster.slice(1).map(toSporeScript),
      },
    },
    lumos: {
      PREFIX: NetworksService.getInstance().isMainnet() ? 'ckb' : 'ckt',
      SCRIPTS: {},
    },
    ckbIndexerUrl: NodeService.getInstance().nodeUrl,
    ckbNodeUrl: NodeService.getInstance().nodeUrl,
    extensions: [],
  }
}
