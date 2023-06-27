import { createConnection, getConnectionOptions, getConnection } from 'typeorm'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
import path from 'path'

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
import MultisigOuput from './entities/multisig-output'
import SyncProgress from './entities/sync-progress'
import TxLock from './entities/tx-lock'

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

export const CONNECTION_NOT_FOUND_NAME = 'ConnectionNotFoundError'

const dbPath = (name: string): string => {
  const filename = `cell-${name}.sqlite`
  return path.join(env.fileBasePath, 'cells', filename)
}

const connectOptions = async (genesisBlockHash: string): Promise<SqliteConnectionOptions> => {
  const connectionOptions = await getConnectionOptions()
  const database = env.isTestMode ? ':memory:' : dbPath(genesisBlockHash)

  const logging: boolean | ('query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration')[] = ['warn', 'error']
  // (env.isDevMode) ? ['warn', 'error', 'log', 'info', 'schema', 'migration'] : ['warn', 'error']

  return {
    ...connectionOptions,
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
      MultisigOuput,
      SyncProgress,
      TxLock,
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
    ],
    logger: 'simple-console',
    logging,
    maxQueryExecutionTime: 30,
  }
}

export const initConnection = async (genesisBlockHash: string) => {
  // try to close connection, if not exist, will throw ConnectionNotFoundError when call getConnection()
  try {
    await getConnection().close()
  } catch (err) {
    // do nothing
  }
  const connectionOptions = await connectOptions(genesisBlockHash)

  try {
    await createConnection(connectionOptions)
    await getConnection().manager.query(`PRAGMA busy_timeout = 3000;`)
    await getConnection().manager.query(`PRAGMA temp_store = MEMORY;`)
  } catch (err) {
    logger.error(err.message)
  }
}

export default initConnection
