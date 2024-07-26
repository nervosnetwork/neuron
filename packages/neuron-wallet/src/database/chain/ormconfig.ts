import { AbstractLogger, DataSource, LogLevel, LogMessage } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'
import fs from 'fs'

import logger from '../../utils/logger'
import env from '../../env'

import HdPublicKeyInfo from './entities/hd-public-key-info'
import Transaction from './entities/transaction'
import Input from './entities/input'
import Output from './entities/output'
import SyncInfo from './entities/sync-info'
import AssetAccount from './entities/asset-account'
import SudtTokenInfo from './entities/sudt-token-info'
import IndexerTxHashCache from './entities/indexer-tx-hash-cache'
import TxDescription from './entities/tx-description'
import AddressDescription from './entities/address-description'
import MultisigConfig from './entities/multisig-config'
import MultisigOutput from './entities/multisig-output'
import SyncProgress from './entities/sync-progress'
import TxLock from './entities/tx-lock'
import CellLocalInfo from './entities/cell-local-info'
import AmendTransaction from './entities/amend-transaction'

import { InitMigration1566959757554 } from './migrations/1566959757554-InitMigration'
import { AddTypeAndHasData1567144517514 } from './migrations/1567144517514-AddTypeAndHasData'
import { ChangeHasDataDefault1568621556467 } from './migrations/1568621556467-ChangeHasDataDefault'
import { AddLockToInput1570522869590 } from './migrations/1570522869590-AddLockToInput'
import { AddIndices1572006450765 } from './migrations/1572006450765-AddIndices'
import { AddIndexToTxTimestamp1572137226866 } from './migrations/1572137226866-AddIndexToTxTimestamp'
import { AddOutputIndex1572226722928 } from './migrations/1572226722928-AddOutputIndex'
import { AddTypeHashToOutput1572852964749 } from './migrations/1572852964749-AddTypeHashToOutput'
import { AddDepositOutPointToOutput1573305225465 } from './migrations/1573305225465-AddDepositOutPointToOutput'
import { AddInputIndexToInput1573461100330 } from './migrations/1573461100330-AddInputIndexToInput'
import { AddMultiSignBlake1601581405459272 } from './migrations/1581405459272-AddMultiSignBlake160'
import { AddLiveCell1585624516932 } from './migrations/1585624516932-AddLiveCell'
import { CreateAssetAccount1586420715474 } from './migrations/1586420715474-CreateAssetAccount'
import { UpdateAssetAccount1587368167604 } from './migrations/1587368167604-UpdateAssetAccount'
import { AddTypeToInput1587371249814 } from './migrations/1587371249814-AddTypeToInput'
import { FlattenLockAndType1587375230126 } from './migrations/1587375230126-FlattenLockAndType'
import { AddSudtTokenInfo1587523557249 } from './migrations/1587523557249-AddSudtTokenInfo'
import { RemoveAssetAccountWalletID1589273902050 } from './migrations/1589273902050-RemoveAssetAccountWalletID'
import { RemoveLiveCell1592781363749 } from './migrations/1592781363749-RemoveLiveCell'
import { AddIndexerTxHashCache1592727615004 } from './migrations/1592727615004-AddIndexerTxHashCache'
import { HDPublicKeyInfo1598087517643 } from './migrations/1598087517643-HDPublicKeyInfo'
import { TxDescription1599441769473 } from './migrations/1599441769473-TxDescription'
import { RemoveKeyInfoAddress1601447406035 } from './migrations/1601447406035-RemoveKeyInfoAddress'
import { AddAddressDescription1602543179168 } from './migrations/1602543179168-AddAddressDescription'
import { AddMultisigConfig1646817547204 } from './migrations/1646817547204-AddMultisigConfig'
import { AddMultisigOutput1649729996969 } from './migrations/1649729996969-AddMultisigOutput'
import { UpdateAddressDescription1650984779265 } from './migrations/1650984779265-UpdateAddressDescription'
import { RemoveDuplicateBlake160s1656930265386 } from './migrations/1656930265386-RemoveDuplicateBlake160s'
import { UpdateOutputChequeLockHash1652945662504 } from './migrations/1652945662504-UpdateOutputChequeLockHash'
import { RemoveAddressesMultisigConfig1651820157100 } from './migrations/1651820157100-RemoveAddressesMultisigConfig'
import { AddSyncProgress1676441837373 } from './migrations/1676441837373-AddSyncProgress'
import { AddTypeSyncProgress1681360188494 } from './migrations/1681360188494-AddTypeSyncProgress'
import { TxLock1684488676083 } from './migrations/1684488676083-TxLock'
import { ResetSyncProgressPrimaryKey1690361215400 } from './migrations/1690361215400-ResetSyncProgressPrimaryKey'
import { TxLockAddArgs1694746034975 } from './migrations/1694746034975-TxLockAddArgs'
import { IndexerTxHashCacheRemoveField1701234043431 } from './migrations/1701234043431-IndexerTxHashCacheRemoveField'
import { CreateCellLocalInfo1701234043432 } from './migrations/1701234043432-CreateCellLocalInfo'
import { RenameSyncProgress1702781527414 } from './migrations/1702781527414-RenameSyncProgress'
import { RemoveAddressInIndexerCache1704357651876 } from './migrations/1704357651876-RemoveAddressInIndexerCache'
import { AmendTransaction1709008125088 } from './migrations/1709008125088-AmendTransaction'
import AddressSubscribe from './subscriber/address-subscriber'
import MultisigConfigSubscribe from './subscriber/multisig-config-subscriber'
import TxDescriptionSubscribe from './subscriber/tx-description-subscriber'
import SudtTokenInfoSubscribe from './subscriber/sudt-token-info-subscriber'
import AssetAccountSubscribe from './subscriber/asset-account-subscriber'
import { AddStartBlockNumber1716539079505 } from './migrations/1716539079505-AddStartBlockNumber'
import { AddUdtType1720089814860 } from './migrations/1720089814860-AddUdtType'

export const CONNECTION_NOT_FOUND_NAME = 'ConnectionNotFoundError'
export type ConnectionName = 'light' | 'full'

const dbPath = (name: string, connectionName: string): string => {
  const filename = `${connectionName}-${name}.sqlite`
  return path.join(env.fileBasePath, 'cells', filename)
}

class TypeormLogger extends AbstractLogger {
  /**
   * Write log to specific output.
   */
  protected writeLog(level: LogLevel, logMessage: LogMessage | LogMessage[]) {
    const messages = this.prepareLogMessages(logMessage, {
      highlightSql: false,
    })

    for (let message of messages) {
      switch (message.type ?? level) {
        case 'log':
        case 'schema-build':
        case 'migration':
        case 'info':
        case 'query':
        case 'warn':
        case 'query-slow':
          if (message.prefix) {
            console.info(message.prefix, message.message)
          } else {
            console.info(message.message)
          }
          break

        case 'error':
        case 'query-error':
          if (message.prefix) {
            console.error(message.prefix, message.message)
          } else {
            console.error(message.message)
          }
          break
      }
    }
  }
}

const getConnectionOptions = (genesisBlockHash: string, connectionName: ConnectionName): SqliteConnectionOptions => {
  const database = env.isTestMode ? ':memory:' : dbPath(genesisBlockHash, connectionName)

  const logging: boolean | ('query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration')[] = ['warn', 'error']
  // (env.isDevMode) ? ['warn', 'error', 'log', 'info', 'schema', 'migration'] : ['warn', 'error']

  return {
    name: connectionName,
    type: 'sqlite',
    database,
    entities: [
      HdPublicKeyInfo,
      Transaction,
      TxDescription,
      Input,
      Output,
      SyncInfo,
      AssetAccount,
      SudtTokenInfo,
      IndexerTxHashCache,
      AddressDescription,
      MultisigConfig,
      MultisigOutput,
      SyncProgress,
      TxLock,
      CellLocalInfo,
      AmendTransaction,
    ],
    migrations: [
      InitMigration1566959757554,
      AddTypeAndHasData1567144517514,
      ChangeHasDataDefault1568621556467,
      AddLockToInput1570522869590,
      AddIndices1572006450765,
      AddIndexToTxTimestamp1572137226866,
      AddOutputIndex1572226722928,
      AddTypeHashToOutput1572852964749,
      AddDepositOutPointToOutput1573305225465,
      AddInputIndexToInput1573461100330,
      AddMultiSignBlake1601581405459272,
      CreateAssetAccount1586420715474,
      AddLiveCell1585624516932,
      UpdateAssetAccount1587368167604,
      AddTypeToInput1587371249814,
      FlattenLockAndType1587375230126,
      AddSudtTokenInfo1587523557249,
      RemoveAssetAccountWalletID1589273902050,
      RemoveLiveCell1592781363749,
      AddIndexerTxHashCache1592727615004,
      HDPublicKeyInfo1598087517643,
      TxDescription1599441769473,
      RemoveKeyInfoAddress1601447406035,
      AddAddressDescription1602543179168,
      AddMultisigConfig1646817547204,
      AddMultisigOutput1649729996969,
      UpdateAddressDescription1650984779265,
      RemoveDuplicateBlake160s1656930265386,
      UpdateOutputChequeLockHash1652945662504,
      RemoveAddressesMultisigConfig1651820157100,
      AddSyncProgress1676441837373,
      AddTypeSyncProgress1681360188494,
      TxLock1684488676083,
      ResetSyncProgressPrimaryKey1690361215400,
      TxLockAddArgs1694746034975,
      IndexerTxHashCacheRemoveField1701234043431,
      CreateCellLocalInfo1701234043432,
      RenameSyncProgress1702781527414,
      RemoveAddressInIndexerCache1704357651876,
      AmendTransaction1709008125088,
      AddStartBlockNumber1716539079505,
      AddUdtType1720089814860,
    ],
    subscribers: [
      AddressSubscribe,
      AssetAccountSubscribe,
      MultisigConfigSubscribe,
      SudtTokenInfoSubscribe,
      TxDescriptionSubscribe,
    ],
    logger: new TypeormLogger(),
    logging,
    migrationsRun: true,
    maxQueryExecutionTime: 30,
  }
}

export const dataSource: Record<ConnectionName, DataSource | null> = {
  light: null,
  full: null,
}

const initConnectionWithType = async (genesisBlockHash: string, connectionName: ConnectionName) => {
  // try to close connection, if not exist, will throw ConnectionNotFoundError when call getConnection()
  try {
    await dataSource[connectionName]?.destroy()
  } catch (err) {
    dataSource[connectionName] = null
    // do nothing
  }
  const connectionOptions = getConnectionOptions(genesisBlockHash, connectionName)
  dataSource[connectionName] = new DataSource(connectionOptions)

  try {
    await dataSource[connectionName]?.initialize()
    await dataSource[connectionName]?.manager.query(`PRAGMA busy_timeout = 3000;`)
    await dataSource[connectionName]?.manager.query(`PRAGMA temp_store = MEMORY;`)
  } catch (err) {
    logger.error(err.message)
  }
}

export function migrateDBFile(genesisBlockHash: string) {
  const originDBFile = dbPath(genesisBlockHash, 'cell')
  const currentFullDBFile = dbPath(genesisBlockHash, 'full')
  const currentLightDBFile = dbPath(genesisBlockHash, 'light')
  if (fs.existsSync(originDBFile) && (!fs.existsSync(currentLightDBFile) || !fs.existsSync(currentFullDBFile))) {
    if (!fs.existsSync(currentFullDBFile)) {
      fs.copyFileSync(originDBFile, currentFullDBFile)
    }
    if (!fs.existsSync(currentLightDBFile)) {
      fs.copyFileSync(originDBFile, currentLightDBFile)
    }
    fs.rmSync(originDBFile)
  }
}

export default async function initConnection(genesisBlockHash: string) {
  await initConnectionWithType(genesisBlockHash, 'full')
  await initConnectionWithType(genesisBlockHash, 'light')
}
