import CellDep, { DepType } from "./chain/cell-dep"
import Script, { ScriptHashType } from "./chain/script"
import OutPoint from "./chain/out-point"
import NetworksService from "services/networks"
import Transaction from "./chain/transaction"
import HexUtils from "utils/hex"
import SystemScriptInfo from "./system-script-info"
import { Address } from "./address"

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

  private static MAINNET_GENESIS_BLOCK_HASH: string = '0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5'

  public get infos(): {[name: string]: ScriptCellInfo} {
    return {
      sudt: this.sudt,
      sudtInfo: this.sudtInfo,
      anyoneCanPay: this.anyoneCanPayInfo
    }
  }

  constructor(genesisBlockHash: string = NetworksService.getInstance().getCurrent().genesisHash) {
    if (genesisBlockHash === AssetAccountInfo.MAINNET_GENESIS_BLOCK_HASH) {
      this.sudt = {
        cellDep: new CellDep(new OutPoint(process.env.MAINNET_SUDT_DEP_TXHASH!, process.env.MAINNET_SUDT_DEP_INDEX!),
          process.env.MAINNET_SUDT_DEP_TYPE! as DepType),
        codeHash: process.env.MAINNET_SUDT_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_SUDT_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.sudtInfo = {
        cellDep: new CellDep(new OutPoint(process.env.MAINNET_SUDT_INFO_DEP_TXHASH!, process.env.MAINNET_SUDT_INFO_DEP_INDEX!),
          process.env.MAINNET_SUDT_INFO_DEP_TYPE! as DepType),
        codeHash: process.env.MAINNET_SUDT_INFO_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_SUDT_INFO_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.anyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint(process.env.MAINNET_ACP_DEP_TXHASH!, process.env.MAINNET_ACP_DEP_INDEX!),
          process.env.MAINNET_ACP_DEP_TYPE! as DepType),
        codeHash: process.env.MAINNET_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_ACP_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.legacyAnyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint(process.env.LEGACY_MAINNET_ACP_DEP_TXHASH!, process.env.LEGACY_MAINNET_ACP_DEP_INDEX!),
          process.env.LEGACY_MAINNET_ACP_DEP_TYPE! as DepType),
        codeHash: process.env.LEGACY_MAINNET_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.LEGACY_MAINNET_ACP_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.pwAnyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint(process.env.MAINNET_PW_ACP_DEP_TXHASH!, process.env.MAINNET_PW_ACP_DEP_INDEX!),
          process.env.MAINNET_PW_ACP_DEP_TYPE! as DepType),
        codeHash: process.env.MAINNET_PW_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_PW_ACP_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.chequeInfo = {
        cellDep: new CellDep(new OutPoint(process.env.MAINNET_CHEQUE_TX_HASH!, process.env.MAINNET_CHEQUE_DEP_INDEX!),
          process.env.MAINNET_CHEQUE_DEP_TYPE! as DepType),
        codeHash: process.env.MAINNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_CHEQUE_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.nftIssuerInfo = {
        cellDep: new CellDep(new OutPoint(process.env.MAINNET_NFT_ISSUER_DEP_TXHASH!, process.env.MAINNET_NFT_ISSUER_DEP_INDEX!),
        (process.env.MAINNET_NFT_ISSUER_DEP_TYPE as DepType)),
        codeHash: process.env.MAINNET_NFT_ISSUER_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_NFT_ISSUER_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
      this.nftClassInfo = {
        cellDep: new CellDep(new OutPoint(process.env.MAINNET_NFT_CLASS_DEP_TXHASH!, process.env.MAINNET_NFT_CLASS_DEP_INDEX!),
        (process.env.MAINNET_NFT_CLASS_DEP_TYPE as DepType)),
        codeHash: process.env.MAINNET_NFT_CLASS_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_NFT_CLASS_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
      this.nftInfo = {
        cellDep: new CellDep(new OutPoint(process.env.MAINNET_NFT_DEP_TXHASH!, process.env.MAINNET_NFT_DEP_INDEX!),
        (process.env.MAINNET_NFT_DEP_TYPE as DepType)),
        codeHash: process.env.MAINNET_NFT_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_NFT_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
    } else {
      this.sudt = {
        cellDep: new CellDep(new OutPoint(process.env.TESTNET_SUDT_DEP_TXHASH!, process.env.TESTNET_SUDT_DEP_INDEX!),
          process.env.TESTNET_SUDT_DEP_TYPE! as DepType),
        codeHash: process.env.TESTNET_SUDT_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_SUDT_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.sudtInfo = {
        cellDep: new CellDep(new OutPoint(process.env.TESTNET_SUDT_INFO_DEP_TXHASH!, process.env.TESTNET_SUDT_INFO_DEP_INDEX!),
          process.env.TESTNET_SUDT_INFO_DEP_TYPE! as DepType),
        codeHash: process.env.TESTNET_SUDT_INFO_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_SUDT_INFO_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.anyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint(process.env.TESTNET_ACP_DEP_TXHASH!, process.env.TESTNET_ACP_DEP_INDEX!),
          process.env.TESTNET_ACP_DEP_TYPE! as DepType),
        codeHash: process.env.TESTNET_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_ACP_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.legacyAnyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint(process.env.LEGACY_TESTNET_ACP_DEP_TXHASH!, process.env.LEGACY_TESTNET_ACP_DEP_INDEX!),
          process.env.LEGACY_TESTNET_ACP_DEP_TYPE! as DepType),
        codeHash: process.env.LEGACY_TESTNET_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.LEGACY_TESTNET_ACP_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.pwAnyoneCanPayInfo = {
        cellDep: new CellDep(new OutPoint(process.env.TESTNET_PW_ACP_DEP_TXHASH!, process.env.TESTNET_PW_ACP_DEP_INDEX!),
          process.env.TESTNET_PW_ACP_DEP_TYPE! as DepType),
        codeHash: process.env.TESTNET_PW_ACP_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_PW_ACP_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.chequeInfo = {
        cellDep: new CellDep(new OutPoint(process.env.TESTNET_CHEQUE_DEP_TXHASH!, process.env.TESTNET_CHEQUE_DEP_INDEX!),
          process.env.TESTNET_CHEQUE_DEP_TYPE! as DepType),
        codeHash: process.env.TESTNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_CHEQUE_SCRIPT_HASHTYPE! as ScriptHashType
      }
      this.nftIssuerInfo = {
        cellDep: new CellDep(new OutPoint(process.env.TESTNET_NFT_ISSUER_DEP_TXHASH!, process.env.TESTNET_NFT_ISSUER_DEP_INDEX!),
        (process.env.TESTNET_NFT_ISSUER_DEP_TYPE as DepType)),
        codeHash: process.env.TESTNET_NFT_ISSUER_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_NFT_ISSUER_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
      this.nftClassInfo = {
        cellDep: new CellDep(new OutPoint(process.env.TESTNET_NFT_CLASS_DEP_TXHASH!, process.env.TESTNET_NFT_CLASS_DEP_INDEX!),
        (process.env.TESTNET_NFT_CLASS_DEP_TYPE as DepType)),
        codeHash: process.env.TESTNET_NFT_CLASS_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_NFT_CLASS_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
      this.nftInfo = {
        cellDep: new CellDep(new OutPoint(process.env.TESTNET_NFT_DEP_TXHASH!, process.env.TESTNET_NFT_DEP_INDEX!),
        (process.env.TESTNET_NFT_DEP_TYPE as DepType)),
        codeHash: process.env.TESTNET_NFT_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_NFT_SCRIPT_HASH_TYPE! as ScriptHashType,
      }
    }
  }

  public get sudtCellDep(): CellDep {
    return this.sudt.cellDep
  }

  public get sudtInfoCodeHash():string{
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
    const receiverLockHash20 = HexUtils.removePrefix(receiverLockHash).slice(0, 40)
    const senderLockHash20 = HexUtils.removePrefix(senderLockHash).slice(0, 40)
    const args = `0x${receiverLockHash20}${senderLockHash20}`
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
    const acpInfos = [
      this.pwAnyoneCanPayInfo,
    ]
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
    const receiverLockHash = HexUtils.removePrefix(chequeLockArgs).slice(0, 40)
    const senderLockHash = HexUtils.removePrefix(chequeLockArgs).slice(40)

    for (const lockHash20 of [receiverLockHash, senderLockHash]) {
      const foundAddressInfo = addressInfos.find(info => {
        const defaultLockScript = SystemScriptInfo.generateSecpScript(info.blake160)
        const addressLockHash20 = HexUtils.removePrefix(defaultLockScript.computeHash()).slice(0, 40)
        return lockHash20 === addressLockHash20
      })
      if (foundAddressInfo) {
        return foundAddressInfo
      }
    }

    return null
  }
}
