import { cleanCkbNode, startCkbMiner, startCkbNodeWithData, stopCkbNode } from '../services/ckb-runner'
import { cleanLightCkbNode, startCkbLightNodeWithConfig, stopLightCkbNode } from '../services/light-runner'
import { backupNeuronCells, startNeuronWithConfig, stopNeuron, waitNeuronSyncSuccess } from '../services/neuron-runner'
import { scheduler } from 'timers/promises'

import { compareNeuronDatabase } from '../services/neuron-sql-server'

import { fixtures } from './common'

describe('sync test', function () {
  fixtures.forEach((fixture, idx) => {
    beforeEach(async () => {
      console.log('before each')
      await startCkbNodeWithData({
        binPath: fixture.ckbConfig.binPath,
        dataPath: fixture.ckbDataDb,
        configPath: fixture.ckbConfig.ckbConfigPath,
        decPath: `${fixture.tmpPath}/ckb`,
      })
      await startCkbMiner({
        binPath: fixture.ckbConfig.binPath,
        decPath: `${fixture.tmpPath}/ckb`,
      })
      await startCkbLightNodeWithConfig({
        binPath: fixture.ckbConfig.binPath,
        configPath: fixture.ckbConfig.ckbLightClientConfigPath,
        decPath: `${fixture.tmpPath}/ckb-light-client`,
      })
    })

    it('full node sync  wallet 1', async () => {
      console.log('full node sync start ')
      await startNeuronWithConfig({
        cleanCells: true,
        envPath: fixture.neuronConfig.envPath.dbBlock2000,
        network: { indexJsonPath: fixture.neuronConfig.networks.dev },
        wallets: {
          walletsPath: fixture.syncAccount.path,
        },
        neuronCodePath: fixture.neuronConfig.binPath,
        logPath: `${fixture.tmpPath}/neuron-full-node-wallet-${idx}.log`,
      })
      console.log('wait sync ')
      await waitNeuronSyncSuccess(30 * 60)
      await stopNeuron()
      await backupNeuronCells(`${fixture.tmpPath}/fullNode/wallet1`)
      let result = await compareNeuronDatabase(
        fixture.compareFullNodeSqlitePath,
        `${fixture.tmpPath}/fullNode/wallet1/full-${fixture.genesisHash}.sqlite`,
        `${fixture.tmpPath}/fullNode/wallet1`
      )
      expect(result).toEqual(true)
    })

    it('light node sync  wallet 1', async () => {
      await startNeuronWithConfig({
        cleanCells: true,
        envPath: fixture.neuronConfig.envPath.dbBlock2000,
        network: { indexJsonPath: fixture.neuronConfig.networks.light },
        wallets: {
          walletsPath: fixture.syncAccount.path,
        },
        neuronCodePath: fixture.neuronConfig.binPath,
        logPath: `${fixture.tmpPath}/neuron-light-node-wallet-${idx}.log`,
      })
      await waitNeuronSyncSuccess(60 * 60)
      await stopNeuron()
      console.log('backupNeuronCells')
      await backupNeuronCells(`${fixture.tmpPath}/lightNode/wallet1`)
      console.log('compareNeuronDatabase')
      const result = await compareNeuronDatabase(
        fixture.compareLightNodeSqlitePath,
        `${fixture.tmpPath}/lightNode/wallet1/light-${fixture.genesisHash}.sqlite`,
        `${fixture.tmpPath}/lightNode/wallet1`
      )
      expect(result).toEqual(true)
    })

    afterEach(async () => {
      await stopCkbNode()
      await stopLightCkbNode()
      await scheduler.wait(3 * 1000)
      await cleanCkbNode(`${fixture.tmpPath}/ckb`)
      await cleanLightCkbNode(`${fixture.tmpPath}/ckb-light-client`)
      await stopNeuron()
    })
  })
})
