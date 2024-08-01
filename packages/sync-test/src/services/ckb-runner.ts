import { BI, RPC } from '@ckb-lumos/lumos'

import { ChildProcess, StdioNull, StdioPipe, spawn } from 'child_process'
import { mkdirSync, cpSync } from 'node:fs'
import { extractTarGz, platform, retry, rm } from '../utils/utils'
import path from 'path'

export const CKB_HOST = `127.0.0.1`
export const CKB_RPC_PORT = 8114

export const CKB_RPC_URL = `http://${CKB_HOST}:${CKB_RPC_PORT}`

let ckb: ChildProcess | null = null
let ckbMiner: ChildProcess | null = null

const ckbBinary = (binPath: string): string => {
  const binary = `${binPath}/ckb`
  switch (platform()) {
    case 'win':
      return binary + '.exe'
    case 'mac':
      //todo check intel
      return binary
    default:
      return binary
  }
}

export const startCkbNodeWithData = async (option: {
  binPath: string
  configPath: string
  dataPath: string
  decPath: string
}) => {
  if (ckb !== null) {
    console.info(`CKB:\tckb is not closed, close it before start...`)
    await stopCkbNode()
    await cleanCkbNode(option.decPath)
  }
  console.log('start ckb node ')
  mkdirSync(option.decPath, { recursive: true })
  cpSync(option.configPath, option.decPath, { recursive: true })
  await extractTarGz(option.dataPath, path.join(option.decPath, ...['data']))
  console.log('run start ckb cmd')
  const options = ['run', '-C', option.decPath, '--indexer']
  const stdio: (StdioNull | StdioPipe)[] = ['ignore', 'ignore', 'pipe']
  ckb = spawn(ckbBinary(option.binPath), options, { stdio })
  let ckbRpc = new RPC(CKB_RPC_URL)

  const tipBlock = await retry(
    () =>
      ckbRpc.getTipBlockNumber().then(res => {
        if (Number(res) <= 0) return Promise.reject()
        return res
      }),
    {
      timeout: 15_000,
      delay: 100,
      retries: 100,
    }
  )
  console.info('CKB started', BI.from(tipBlock).toNumber())
}

export const startCkbMiner = (option: { decPath: string; binPath: string }) => {
  if (ckb == null) {
    console.error(`CKB:\tckb is not started, please start ckb before starting miner...`)
    return
  }
  if (ckbMiner !== null) {
    console.log('ckb miner already start ')
    return
  }
  const options = ['miner', '-C', option.decPath]
  const stdio: (StdioNull | StdioPipe)[] = ['ignore', 'ignore', 'pipe']
  ckbMiner = spawn(ckbBinary(option.binPath), options, { stdio })
  console.log('start miner  successful')
}

export const stopCkbNode = async () => {
  console.log('stop ckb node ')
  const promises: Promise<void>[] = []
  promises.push(
    new Promise<void>(innerResolve => {
      if (!ckbMiner) {
        innerResolve()
      } else {
        ckbMiner.once('close', () => innerResolve())
        ckbMiner.kill()
        ckbMiner = null
      }
    })
  )
  promises.push(
    new Promise<void>(innerResolve => {
      if (ckb) {
        console.info('CKB:\tkilling node')
        ckb.once('close', () => innerResolve())
        ckb.kill()
        ckb = null
      } else {
        innerResolve()
      }
    })
  )
  return new Promise<void>(resolve => {
    Promise.all(promises).then(() => resolve())
  })
}

export const cleanCkbNode = async (decPath: string) => {
  console.log('clean ckb node env:', decPath)
  rm(decPath)
}
