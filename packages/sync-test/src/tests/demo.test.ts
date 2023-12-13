import { cleanCkbNode, startCkbMiner, startCkbNodeWithData, stopCkbNode } from '../services/ckb-runner'
import { cleanLightCkbNode, startCkbLightNodeWithConfig, stopLightCkbNode } from '../services/light-runner'
import {
  asyncSleep,
  backupNeuronCells,
  startNeuronWithConfig,
  stopNeuron,
  waitNeuronSyncSuccess,
} from '../services/neuron-runner'

import { compareNeuronDatabase } from '../services/neuron-sql-server'

import { CKB_CHAIN_DATA, CKB_CONFIG, NEURON_CONFIG_DATA, SQLITE_DATA_PATH } from './common'

const TEST_CASE = {
  name: 'Sync account1 with 10000 blocks',
  neuronVersion: '',
  syncAccount: NEURON_CONFIG_DATA.accounts.account1,
  ckbDataDb: CKB_CHAIN_DATA.dbBlock2000,
  compareFullNodeSqlitePath: SQLITE_DATA_PATH.dbBlock2000.fullNode,
  compareLightNodeSqlitePath: SQLITE_DATA_PATH.dbBlock2000.lightNode,
}

describe('demo', function () {
  beforeEach(async () => {
    console.log('before each')
    await startCkbNodeWithData({
      binPath: CKB_CONFIG.binPath,
      dataPath: TEST_CASE.ckbDataDb,
      configPath: CKB_CONFIG.ckbConfigPath,
      decPath: 'tmp/ckb',
    })
    await startCkbMiner({
      binPath: CKB_CONFIG.binPath,
      decPath: 'tmp/ckb',
    })
    await startCkbLightNodeWithConfig({
      binPath: CKB_CONFIG.binPath,
      configPath: CKB_CONFIG.ckbLightClientConfigPath,
      decPath: 'tmp/ckb-light-client',
    })
  })

  it('full node sync  wallet 1', async () => {
    console.log('full node sync start ')
    await startNeuronWithConfig({
      cleanCells: true,
      envPath: NEURON_CONFIG_DATA.envPath,
      network: { indexJsonPath: NEURON_CONFIG_DATA.networks.dev },
      wallets: {
        walletsPath: TEST_CASE.syncAccount.path,
      },
      neuronCodePath: NEURON_CONFIG_DATA.binPath,
      logPath: 'tmp/neuron-full-node-wallet-1.log',
    })
    console.log('wait sync ')
    await waitNeuronSyncSuccess(30 * 60)
    await stopNeuron()
    await backupNeuronCells('tmp/fullNode/wallet1')
    let result = await compareNeuronDatabase(
      TEST_CASE.compareFullNodeSqlitePath,
      'tmp/fullNode/wallet1/cell-0x9c96d0b369b5fd42d7e6b30d6dfdb46e32dac7293bf84de9d1e2d11ca7930717.sqlite',
      'tmp/fullNode/wallet1'
    )
    expect(result).toEqual(true)
  })

  it('light node sync  wallet 1', async () => {
    await startNeuronWithConfig({
      cleanCells: true,
      envPath: NEURON_CONFIG_DATA.envPath,
      network: { indexJsonPath: NEURON_CONFIG_DATA.networks.light },
      wallets: {
        walletsPath: TEST_CASE.syncAccount.path,
      },
      neuronCodePath: NEURON_CONFIG_DATA.binPath,
      logPath: 'tmp/neuron-light-node-wallet-1.log',
    })
    await waitNeuronSyncSuccess(60 * 60)
    await stopNeuron()
    console.log('backupNeuronCells')
    await backupNeuronCells('tmp/lightNode/wallet1')
    console.log('compareNeuronDatabase')
    const result = await compareNeuronDatabase(
      TEST_CASE.compareLightNodeSqlitePath,
      'tmp/lightNode/wallet1/cell-0x9c96d0b369b5fd42d7e6b30d6dfdb46e32dac7293bf84de9d1e2d11ca7930717.sqlite',
      'tmp/lightNode/wallet1'
    )
    expect(result).toEqual(true)
  })

  afterEach(async () => {
    await stopCkbNode()
    await stopLightCkbNode()
    await asyncSleep(3 * 1000)
    await cleanCkbNode('tmp/ckb')
    await cleanLightCkbNode('tmp/ckb-light-client')
    await stopNeuron()
  })
})
