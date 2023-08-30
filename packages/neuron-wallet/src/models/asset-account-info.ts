import { bytes, molecule } from '@ckb-lumos/codec'
import CellDep, { DepType } from './chain/cell-dep'
import Script, { ScriptHashType } from './chain/script'
import OutPoint from './chain/out-point'
import NetworksService from '../services/networks'
import Transaction from './chain/transaction'
import SystemScriptInfo from './system-script-info'
import { Address } from './address'
import { createFixedHexBytesCodec } from '@ckb-lumos/codec/lib/blockchain'
import { predefinedSporeConfigs, SporeConfig, SporeScript } from '@spore-sdk/core'
import NodeService from '../services/node'

export interface ScriptCellInfo {
  cellDep: CellDep
  codeHash: string
  hashType: ScriptHashType
}

export default class AssetAccountInfo {
  private sudt: ScriptCellInfo
  private sudtInfo: ScriptCellInfo
  private anyoneCanPayInfo: ScriptCellInfo
  private pwAnyoneCanPayInfo: ScriptCellInfo
  private legacyAnyoneCanPayInfo: ScriptCellInfo
  private chequeInfo: ScriptCellInfo
  private nftIssuerInfo: ScriptCellInfo
  private nftClassInfo: ScriptCellInfo
  private nftInfo: ScriptCellInfo

  private sporeInfos: ScriptCellInfo[]
  private sporeClusterInfos: ScriptCellInfo[]

  private static MAINNET_GENESIS_BLOCK_HASH: string =
    '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5'

  public get infos(): { [name: string]: ScriptCellInfo } {
    return {
      sudt: this.sudt,
      sudtInfo: this.sudtInfo,
      anyoneCanPay: this.anyoneCanPayInfo,
    }
  }

  constructor(genesisBlockHash: string = NetworksService.getInstance().getCurrent().genesisHash) {
    if (genesisBlockHash === AssetAccountInfo.MAINNET_GENESIS_BLOCK_HASH) {
      this.sudt = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_SUDT_DEP_TXHASH!, process.env.MAINNET_SUDT_DEP_INDEX!),
          process.env.MAINNET_SUDT_DEP_TYPE! as DepType
        ),
        codeHash: process.env.MAINNET_SUDT_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_SUDT_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.sudtInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_SUDT_INFO_DEP_TXHASH!, process.env.MAINNET_SUDT_INFO_DEP_INDEX!),
          process.env.MAINNET_SUDT_INFO_DEP_TYPE! as DepType
        ),
        codeHash: process.env.MAINNET_SUDT_INFO_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_SUDT_INFO_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.anyoneCanPayInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_ACP_DEP_TXHASH!, process.env.MAINNET_ACP_DEP_INDEX!),
          process.env.MAINNET_ACP_DEP_TYPE! as DepType
        ),
        codeHash: process.env.MAINNET_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_ACP_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.legacyAnyoneCanPayInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.LEGACY_MAINNET_ACP_DEP_TXHASH!, process.env.LEGACY_MAINNET_ACP_DEP_INDEX!),
          process.env.LEGACY_MAINNET_ACP_DEP_TYPE! as DepType
        ),
        codeHash: process.env.LEGACY_MAINNET_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.LEGACY_MAINNET_ACP_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.pwAnyoneCanPayInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_PW_ACP_DEP_TXHASH!, process.env.MAINNET_PW_ACP_DEP_INDEX!),
          process.env.MAINNET_PW_ACP_DEP_TYPE! as DepType
        ),
        codeHash: process.env.MAINNET_PW_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_PW_ACP_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.chequeInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_CHEQUE_DEP_TXHASH!, process.env.MAINNET_CHEQUE_DEP_INDEX!),
          process.env.MAINNET_CHEQUE_DEP_TYPE! as DepType
        ),
        codeHash: process.env.MAINNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_CHEQUE_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.nftIssuerInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_NFT_ISSUER_DEP_TXHASH!, process.env.MAINNET_NFT_ISSUER_DEP_INDEX!),
          process.env.MAINNET_NFT_ISSUER_DEP_TYPE as DepType
        ),
        codeHash: process.env.MAINNET_NFT_ISSUER_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_NFT_ISSUER_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
      this.nftClassInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_NFT_CLASS_DEP_TXHASH!, process.env.MAINNET_NFT_CLASS_DEP_INDEX!),
          process.env.MAINNET_NFT_CLASS_DEP_TYPE as DepType
        ),
        codeHash: process.env.MAINNET_NFT_CLASS_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_NFT_CLASS_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
      this.nftInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_NFT_DEP_TXHASH!, process.env.MAINNET_NFT_DEP_INDEX!),
          process.env.MAINNET_NFT_DEP_TYPE as DepType
        ),
        codeHash: process.env.MAINNET_NFT_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_NFT_SCRIPT_HASH_TYPE! as ScriptHashType,
      }

      // TODO infos for mainnet
      this.sporeInfos = []
      this.sporeClusterInfos = []
    } else {
      this.sudt = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_SUDT_DEP_TXHASH!, process.env.TESTNET_SUDT_DEP_INDEX!),
          process.env.TESTNET_SUDT_DEP_TYPE! as DepType
        ),
        codeHash: process.env.TESTNET_SUDT_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_SUDT_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.sudtInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_SUDT_INFO_DEP_TXHASH!, process.env.TESTNET_SUDT_INFO_DEP_INDEX!),
          process.env.TESTNET_SUDT_INFO_DEP_TYPE! as DepType
        ),
        codeHash: process.env.TESTNET_SUDT_INFO_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_SUDT_INFO_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.anyoneCanPayInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_ACP_DEP_TXHASH!, process.env.TESTNET_ACP_DEP_INDEX!),
          process.env.TESTNET_ACP_DEP_TYPE! as DepType
        ),
        codeHash: process.env.TESTNET_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_ACP_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.legacyAnyoneCanPayInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.LEGACY_TESTNET_ACP_DEP_TXHASH!, process.env.LEGACY_TESTNET_ACP_DEP_INDEX!),
          process.env.LEGACY_TESTNET_ACP_DEP_TYPE! as DepType
        ),
        codeHash: process.env.LEGACY_TESTNET_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.LEGACY_TESTNET_ACP_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.pwAnyoneCanPayInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_PW_ACP_DEP_TXHASH!, process.env.TESTNET_PW_ACP_DEP_INDEX!),
          process.env.TESTNET_PW_ACP_DEP_TYPE! as DepType
        ),
        codeHash: process.env.TESTNET_PW_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_PW_ACP_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.chequeInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_CHEQUE_DEP_TXHASH!, process.env.TESTNET_CHEQUE_DEP_INDEX!),
          process.env.TESTNET_CHEQUE_DEP_TYPE! as DepType
        ),
        codeHash: process.env.TESTNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_CHEQUE_SCRIPT_HASHTYPE! as ScriptHashType,
      }
      this.nftIssuerInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_NFT_ISSUER_DEP_TXHASH!, process.env.TESTNET_NFT_ISSUER_DEP_INDEX!),
          process.env.TESTNET_NFT_ISSUER_DEP_TYPE as DepType
        ),
        codeHash: process.env.TESTNET_NFT_ISSUER_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_NFT_ISSUER_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
      this.nftClassInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_NFT_CLASS_DEP_TXHASH!, process.env.TESTNET_NFT_CLASS_DEP_INDEX!),
          process.env.TESTNET_NFT_CLASS_DEP_TYPE as DepType
        ),
        codeHash: process.env.TESTNET_NFT_CLASS_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_NFT_CLASS_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
      this.nftInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_NFT_DEP_TXHASH!, process.env.TESTNET_NFT_DEP_INDEX!),
          process.env.TESTNET_NFT_DEP_TYPE as DepType
        ),
        codeHash: process.env.TESTNET_NFT_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_NFT_SCRIPT_HASH_TYPE! as ScriptHashType,
      }

      const { Spore, Cluster } = predefinedSporeConfigs.Aggron4.scripts

      this.sporeInfos = (
        [
          // TODO remove me, for devnet only
          {
            script: {
              codeHash: '0xbbad126377d45f90a8ee120da988a2d7332c78ba8fd679aab478a19d6c133494',
              hashType: 'data1',
            },
            cellDep: {
              outPoint: {
                txHash: '0xe8d710a05265e9325e4f1f28333167368026fd364a0d82dbf2866c53607fb0c6',
                index: '0x0',
              },
              depType: 'code',
            },
          },
          Spore,
          ...(Spore.versions || []),
        ] satisfies SporeScript[]
      ).map(toScriptInfo)
      this.sporeClusterInfos = (
        [
          // TODO remove me, for dev net only
          {
            script: {
              codeHash: '0x598d793defef36e2eeba54a9b45130e4ca92822e1d193671f490950c3b856080',
              hashType: 'data1',
            },
            cellDep: {
              outPoint: {
                txHash: '0x251ca5eb94f4d14f532e3962cfeb356e02580db31d4d53a09e5aa080f75a2407',
                index: '0x0',
              },
              depType: 'code',
            },
          },
          Cluster,
          ...(Cluster.versions || []),
        ] satisfies SporeScript[]
      ).map(toScriptInfo)
    }
  }

  public get sudtCellDep(): CellDep {
    return this.sudt.cellDep
  }

  public get sudtInfoCodeHash(): string {
    return this.sudtInfo.codeHash
  }

  public get anyoneCanPayCellDep(): CellDep {
    return this.anyoneCanPayInfo.cellDep
  }

  public get anyoneCanPayCodeHash(): string {
    return this.anyoneCanPayInfo.codeHash
  }

  public getLegacyAnyoneCanPayInfo(): ScriptCellInfo {
    return this.legacyAnyoneCanPayInfo
  }

  public getChequeInfo(): ScriptCellInfo {
    return this.chequeInfo
  }

  public getNftIssuerInfo(): ScriptCellInfo {
    return this.nftIssuerInfo
  }

  public getNftClassInfo(): ScriptCellInfo {
    return this.nftClassInfo
  }

  public getNftInfo(): ScriptCellInfo {
    return this.nftInfo
  }

  public getSporeInfos(): ScriptCellInfo[] {
    return this.sporeInfos
  }

  public getSporeClusterInfo(): ScriptCellInfo[] {
    return this.sporeClusterInfos
  }

  public getAcpCodeHash(): string {
    return this.anyoneCanPayInfo.codeHash
  }

  public getSudtCodeHash(): string {
    return this.sudt.codeHash
  }

  public generateSudtScript(args: string): Script {
    return new Script(this.sudt.codeHash, args, this.sudt.hashType)
  }

  public generateAnyoneCanPayScript(args: string): Script {
    const info = this.anyoneCanPayInfo
    return new Script(info.codeHash, args, info.hashType)
  }

  public generateLegacyAnyoneCanPayScript(args: string): Script {
    const info = this.legacyAnyoneCanPayInfo
    return new Script(info.codeHash, args, info.hashType)
  }

  public generateChequeScript(receiverLockHash: string, senderLockHash: string): Script {
    const args = bytes.hexify(bytes.concat(receiverLockHash.slice(0, 42), senderLockHash.slice(0, 42)))
    const info = this.chequeInfo
    return new Script(info.codeHash, args, info.hashType)
  }

  public isSudtScript(script: Script): boolean {
    return script.codeHash === this.sudt.codeHash && script.hashType === this.sudt.hashType
  }

  public isAnyoneCanPayScript(script: Script): boolean {
    const acpScripts = [this.anyoneCanPayInfo, this.pwAnyoneCanPayInfo]
    const exist = acpScripts.find(acpScript => {
      return script.codeHash === acpScript.codeHash && script.hashType === acpScript.hashType
    })
    return !!exist
  }

  public determineAdditionalACPCellDepsByTx(tx: Transaction): CellDep[] {
    const acpInfos = [this.pwAnyoneCanPayInfo]
    const cellDeps = new Set<CellDep>()
    for (const acpInfo of acpInfos) {
      for (const input of tx.inputs) {
        if (input.lock?.codeHash === acpInfo.codeHash && input.lock.hashType === acpInfo.hashType) {
          cellDeps.add(acpInfo.cellDep)
        }
      }
      for (const output of tx.outputs) {
        if (output.lock?.codeHash === acpInfo.codeHash && output.lock.hashType === acpInfo.hashType) {
          cellDeps.add(acpInfo.cellDep)
        }
      }
    }
    return [...cellDeps.values()]
  }

  public isDefaultAnyoneCanPayScript(script: Script): boolean {
    return script.codeHash === this.anyoneCanPayInfo.codeHash && script.hashType === this.anyoneCanPayInfo.hashType
  }

  public static findSignPathForCheque(addressInfos: Address[], chequeLockArgs: string) {
    const Bytes20 = createFixedHexBytesCodec(20)
    const ChequeLockArgsCodec = molecule.struct(
      {
        receiverLockHash: Bytes20,
        senderLockHash: Bytes20,
      },
      ['receiverLockHash', 'senderLockHash']
    )

    const { receiverLockHash, senderLockHash } = ChequeLockArgsCodec.unpack(chequeLockArgs)

    const foundReceiver = addressInfos.find(info => {
      const target = bytes.bytify(SystemScriptInfo.generateSecpScript(info.blake160).computeHash()).slice(0, 20)
      return bytes.equal(target, receiverLockHash)
    })

    if (foundReceiver) {
      return foundReceiver
    }

    const foundSender = addressInfos.find(info => {
      const target = bytes.bytify(SystemScriptInfo.generateSecpScript(info.blake160).computeHash()).slice(0, 20)
      return bytes.equal(target, senderLockHash)
    })

    return foundSender || null
  }

  public getSporeConfig(): SporeConfig {
    const spore = this.sporeInfos
    const cluster = this.sporeClusterInfos

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
}

function toSporeScript(info: ScriptCellInfo): SporeScript {
  return {
    script: { codeHash: info.codeHash, hashType: info.hashType },
    cellDep: info.cellDep,
  }
}

function toScriptInfo(sporeConfig: SporeScript): ScriptCellInfo {
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
