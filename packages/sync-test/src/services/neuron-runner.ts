import * as os from 'os'
import { platform, rm } from '../utils/utils'
import * as path from 'path'
import { cpSync } from 'node:fs'
import { ChildProcess, spawn } from 'child_process'
import * as fs from 'fs'
import { CKB_RPC_URL } from './ckb-runner'
import { BI, RPC } from '@ckb-lumos/lumos'

let neuron: ChildProcess | null = null

let syncResult: {
  result: boolean
  syncTipNumTimes: number
  tipNum: number
} = {
  result: false,
  syncTipNumTimes: 0,
  tipNum: 0,
}

export const getNeuronPath = () => {
  switch (platform()) {
    case 'win':
      //C:\Users\linguopeng_112963420\AppData\Roaming\Neuron
      return path.join(os.homedir(), ...['AppData', 'Roaming', 'Neuron'])
    case 'mac':
      //todo check intel
      return path.join(os.homedir(), ...['Library', 'Application Support', 'Neuron'])
    case 'linux':
      return path.join(os.homedir(), ...['.config', 'Neuron'])
    default:
      throw new Error('not support ')
  }
}

export const getNeuronEnvPath = () => {
  switch (platform()) {
    case 'win':
      //C:\Users\linguopeng_112963420\AppData\Roaming\Neuron
      return ['resources', 'app', '.env']
    case 'mac':
      return ['Contents', 'Resources', 'app', '.env']
    case 'linux':
      return ['squashfs-root', 'resources', 'app', '.env']
    default:
      throw new Error('not support ')
  }
}

export const getNeuronStartCmd = () => {
  switch (platform()) {
    case 'win':
      //C:\Users\linguopeng_112963420\AppData\Roaming\Neuron
      return '.\\Neuron.exe'
    case 'mac':
      return './Contents/MacOS/neuron'
    case 'linux':
      return './squashfs-root/AppRun'
    default:
      throw new Error('not support ')
  }
}

export const startNeuronWithConfig = async (option: {
  envPath: string
  network: {
    indexJsonPath: string
    selectNetwork?: string
  }
  wallets: {
    walletsPath: string
    selectWallet?: string
  }
  cleanCells: boolean
  logPath: string
  neuronCodePath: string
}) => {
  let ckbRpc = new RPC(CKB_RPC_URL)
  let tipNumber = await ckbRpc.getTipBlockNumber()
  syncResult = { result: false, syncTipNumTimes: 0, tipNum: BI.from(tipNumber).toNumber() }
  console.log('start neuron')

  if (option.cleanCells) {
    cleanNeuronSyncCells()
  }
  // cp env
  cpSync(option.envPath, path.join(option.neuronCodePath, ...getNeuronEnvPath()))

  // cp network file
  let decPath = path.join(getNeuronPath(), ...['networks', 'index.json'])
  cpSync(option.network.indexJsonPath, decPath)

  if (option.network.selectNetwork !== undefined) {
    //todo
    changeNetworkByName(option.network.selectNetwork)
  }
  // cp wallet file
  cpSync(option.wallets.walletsPath, path.join(getNeuronPath(), ...['wallets']), { recursive: true })

  if (option.wallets.selectWallet !== undefined) {
    changeWalletByName(option.wallets.selectWallet)
  }

  // start
  neuron = spawn(getNeuronStartCmd(), {
    cwd: option.neuronCodePath,
    stdio: ['ignore', 'pipe', 'pipe'],
    // detached: true,
    // shell: true,
  })
  let log = fs.createWriteStream(option.logPath)
  neuron.stderr &&
    neuron.stderr.on('data', data => {
      log.write(data)
    })
  neuron.stdout &&
    neuron.stdout.on('data', data => {
      if (!syncResult.result && data.toString().includes('saved synced block')) {
        let result = checkLogForNumber(data.toString())
        if (result) {
          syncResult.syncTipNumTimes += 1
        }
        if (syncResult.syncTipNumTimes >= 3) {
          syncResult.result = true
        }
      }
      log.write(data)
    })
}

function checkLogForNumber(log: string): boolean {
  const regex = /#(\d+)/
  const match = log.match(regex)
  if (match) {
    const number = parseInt(match[1], 10)
    console.log(
      `neuron sync:${number},neuron tipNum:${syncResult.tipNum},syncTipNumTimes:${syncResult.syncTipNumTimes}`
    )
    if (number > syncResult.tipNum) {
      syncResult.tipNum = number
      return true
    }
  }
  return false
}

export const waitNeuronSyncSuccess = async (retries: number) => {
  for (let i = 0; i < retries; i++) {
    if (syncResult.result) {
      return syncResult.result
    }
    await asyncSleep(1000)
  }
  return Promise.reject('waitNeuronSyncSuccess time out ')
}

export const stopNeuron = async () => {
  console.log('stop neuron')
  return new Promise<void>(resolve => {
    if (neuron) {
      console.info('neuron:\tkilling neuron')
      neuron.once('close', () => resolve())
      neuron.kill()
      console.log('neuron: stop succ')
      neuron = null
      syncResult = {
        syncTipNumTimes: 0,
        result: false,
        tipNum: 0,
      }
    } else {
      resolve()
    }
  })
}

function changeNetworkByName(selectNetwork: string) {
  console.log('change :', selectNetwork)
}

function changeWalletByName(selectWallet: string) {
  console.log('changeWalletByName:', selectWallet)
}

export const cleanNeuronSyncCells = () => {
  rm(path.join(getNeuronPath(), ...['cells']))
}

export const backupNeuronCells = (decPath: string) => {
  cpSync(path.join(getNeuronPath(), ...['cells']), decPath, { recursive: true })
}

export function asyncSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
