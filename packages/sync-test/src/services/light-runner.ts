import { ChildProcess, spawn } from 'child_process'
import { platform, rm } from '../utils/utils'
import { cpSync, mkdirSync } from 'node:fs'
import * as fs from 'fs'

let ckbLight: ChildProcess | null = null

const ckbLightBinary = (binPath: string): string => {
  const binary = `${binPath}/ckb-light-client`
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
export const startCkbLightNodeWithConfig = async (option: { binPath: string; configPath: string; decPath: string }) => {
  console.log('start ckb node ')
  if (ckbLight !== null) {
    console.info(`CKB:\tLight client is not closed, close it before start...`)
    await stopLightCkbNode()
    await cleanLightCkbNode(option.decPath)
  }
  mkdirSync(option.decPath, { recursive: true })
  cpSync(option.configPath, option.decPath, { recursive: true })
  cpSync(ckbLightBinary(option.binPath), ckbLightBinary(option.decPath))
  const options = ['run', '--config-file', 'config.toml']
  ckbLight = spawn(
    './' + ckbLightBinary(option.binPath).split('/')[ckbLightBinary(option.binPath).split('/').length - 1],
    options,
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: option.decPath,
      env: { RUST_LOG: 'info', ckb_light_client: 'info' },
    }
  )
  // let logPath = path.join(option.decPath, "light.log")
  let logPath = 'tmp/light.log'
  let log = fs.createWriteStream(logPath)
  ckbLight.stderr &&
    ckbLight.stderr.on('data', data => {
      log.write(data)
    })
  ckbLight.stdout &&
    ckbLight.stdout.on('data', data => {
      log.write(data)
    })
}

export const stopLightCkbNode = async () => {
  console.log('stop ckb light node ')
  return new Promise<void>(resolve => {
    if (ckbLight) {
      console.info('CKB light:\tkilling node')
      ckbLight.once('close', () => resolve())
      ckbLight.kill()
      ckbLight = null
    } else {
      resolve()
    }
  })
}

export const cleanLightCkbNode = async (path: string) => {
  console.log('clean ckb light node env:', path)
  rm(path)
}
