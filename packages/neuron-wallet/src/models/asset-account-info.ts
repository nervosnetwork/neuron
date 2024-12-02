import { bytes, struct, createFixedBytesCodec } from '@ckb-lumos/lumos/codec'
import CellDep, { DepType } from './chain/cell-dep'
import Script, { ScriptHashType } from './chain/script'
import OutPoint from './chain/out-point'
import NetworksService from '../services/networks'
import Transaction from './chain/transaction'
import SystemScriptInfo from './system-script-info'
import { Address } from './address'
import { UDTType } from '../utils/const'
import { predefinedSporeConfigs, SporeConfig, SporeScript } from '@spore-sdk/core'
import { AGGRON4, LINA } from '../utils/systemScripts'

const createFixedHexBytesCodec = (byteLength: number) =>
  createFixedBytesCodec({ byteLength, pack: bytes.bytify, unpack: bytes.hexify })

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
  private xudt: ScriptCellInfo

  private sporeInfos: ScriptCellInfo[]
  private sporeClusterInfos: ScriptCellInfo[]

  private static MAINNET_GENESIS_BLOCK_HASH: string =
    '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5'

  public get infos(): { [name: string]: ScriptCellInfo } {
    return {
      sudt: this.sudt,
      sudtInfo: this.sudtInfo,
      anyoneCanPay: this.anyoneCanPayInfo,
      xudt: this.xudt,
    }
  }

  constructor(genesisBlockHash: string = NetworksService.getInstance().getCurrent().genesisHash) {
    const isMainnet = genesisBlockHash === AssetAccountInfo.MAINNET_GENESIS_BLOCK_HASH
    const { XUDT, SUDT, ANYONE_CAN_PAY } = isMainnet ? LINA.SCRIPTS : AGGRON4.SCRIPTS
    this.xudt = {
      cellDep: new CellDep(new OutPoint(XUDT.TX_HASH, XUDT.INDEX), XUDT.DEP_TYPE as DepType),
      codeHash: XUDT.CODE_HASH,
      hashType: XUDT.HASH_TYPE as ScriptHashType,
    }
    this.sudt = {
      cellDep: new CellDep(new OutPoint(SUDT.TX_HASH, SUDT.INDEX), SUDT.DEP_TYPE as DepType),
      codeHash: SUDT.CODE_HASH,
      hashType: SUDT.HASH_TYPE as ScriptHashType,
    }
    this.anyoneCanPayInfo = {
      cellDep: new CellDep(
        new OutPoint(ANYONE_CAN_PAY.TX_HASH, ANYONE_CAN_PAY.INDEX),
        ANYONE_CAN_PAY.DEP_TYPE as DepType
      ),
      codeHash: ANYONE_CAN_PAY.CODE_HASH,
      hashType: ANYONE_CAN_PAY.HASH_TYPE as ScriptHashType,
    }
    if (isMainnet) {
      this.sudtInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.MAINNET_SUDT_INFO_DEP_TXHASH!, process.env.MAINNET_SUDT_INFO_DEP_INDEX!),
          process.env.MAINNET_SUDT_INFO_DEP_TYPE! as DepType
        ),
        codeHash: process.env.MAINNET_SUDT_INFO_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_SUDT_INFO_SCRIPT_HASHTYPE! as ScriptHashType,
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
      this.sudtInfo = {
        cellDep: new CellDep(
          new OutPoint(process.env.TESTNET_SUDT_INFO_DEP_TXHASH!, process.env.TESTNET_SUDT_INFO_DEP_INDEX!),
          process.env.TESTNET_SUDT_INFO_DEP_TYPE! as DepType
        ),
        codeHash: process.env.TESTNET_SUDT_INFO_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_SUDT_INFO_SCRIPT_HASHTYPE! as ScriptHashType,
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

      this.sporeInfos = ([Spore, ...(Spore.versions || [])] satisfies SporeScript[]).map(toScriptInfo)
      this.sporeClusterInfos = ([Cluster, ...(Cluster.versions || [])] satisfies SporeScript[]).map(toScriptInfo)
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

  public get xudtCellDep(): CellDep {
    return this.xudt.cellDep
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

  public generateXudtScript(args: string): Script {
    return new Script(this.xudt.codeHash, args, this.xudt.hashType)
  }

  public generateUdtScript(args: string, udtType?: UDTType): Script | undefined {
    switch (udtType) {
      case UDTType.SUDT:
        return this.generateSudtScript(args)
      case UDTType.XUDT:
        return this.generateXudtScript(args)
      default:
        return undefined
    }
  }

  public isSudtScript(script: Script): boolean {
    return script.codeHash === this.sudt.codeHash && script.hashType === this.sudt.hashType
  }

  public isXudtScript(script: Script): boolean {
    return script.codeHash === this.xudt.codeHash && script.hashType === this.xudt.hashType
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
    const ChequeLockArgsCodec = struct(
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

  public getSporeConfig(nodeUrl: string): SporeConfig {
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
      ckbIndexerUrl: nodeUrl,
      ckbNodeUrl: nodeUrl,
      extensions: [],
    }
  }

  public getAcpCellDep(codeHash: string) {
    switch (codeHash) {
      case this.anyoneCanPayInfo.codeHash:
        return this.anyoneCanPayCellDep
      case this.legacyAnyoneCanPayInfo.codeHash:
        return this.legacyAnyoneCanPayInfo.cellDep
      case this.pwAnyoneCanPayInfo.codeHash:
        return this.pwAnyoneCanPayInfo.cellDep
      default:
        break
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
