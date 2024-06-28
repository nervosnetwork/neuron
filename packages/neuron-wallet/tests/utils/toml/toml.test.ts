import path from 'path'
import fs from 'fs'
import updateToml from '../../../src/utils/toml'

const existsSyncMock = jest.fn()
const writeFileSyncMock = jest.fn()
const mkdirSyncMock = jest.fn()

function resetMock() {
  existsSyncMock.mockReset()
  writeFileSyncMock.mockReset()
  mkdirSyncMock.mockReset()
}

jest.mock('fs', () => {
  const fs = jest.requireActual('fs')
  return {
    readFileSync: fs.readFileSync,
    existsSync: () => existsSyncMock(),
    writeFileSync: (...args: unknown[]) => writeFileSyncMock(...args),
    mkdirSync: (...args: unknown[]) => mkdirSyncMock(...args),
  }
})

describe('test toml', () => {
  beforeEach(() => {
    resetMock()
  })
  describe('test update toml', () => {
    it('update skip non exist key', () => {
      const tomlPath = path.resolve(__dirname, './test.toml')
      updateToml(tomlPath, {
        network: {
          network1: '127',
        },
      })
      expect(writeFileSyncMock).toBeCalledWith(tomlPath, fs.readFileSync(tomlPath).toString())
    })
    it('update multi values with new file and dir exist', () => {
      const tomlPath = path.resolve(__dirname, './test.toml')
      existsSyncMock.mockReturnValue(true)
      updateToml(
        tomlPath,
        { network: { network: '126', listen_addresses: 'test' }, rpc: { listen_address: 'listen_address' } },
        path.resolve(__dirname, './new.toml')
      )
      expect(writeFileSyncMock).toBeCalledWith(
        path.resolve(__dirname, './new.toml'),
        fs
          .readFileSync(tomlPath)
          .toString()
          .replace('network = 127', 'network = 126')
          .replace('listen_addresses = ["/ip4/0.0.0.0/tcp/8115"]', 'listen_addresses = test')
          .replace('listen_address = "127.0.0.1:8114"', 'listen_address = listen_address')
      )
    })
    it('update multi values with new file and dir not exist', () => {
      const tomlPath = path.resolve(__dirname, './test.toml')
      existsSyncMock.mockReturnValue(false)
      updateToml(
        tomlPath,
        { network: { network: '126', listen_addresses: 'test' }, rpc: { listen_address: 'listen_address' } },
        path.resolve(__dirname, './new.toml')
      )
      expect(mkdirSyncMock).toBeCalledWith(__dirname, { recursive: true })
      expect(writeFileSyncMock).toBeCalledWith(
        path.resolve(__dirname, './new.toml'),
        fs
          .readFileSync(tomlPath)
          .toString()
          .replace('network = 127', 'network = 126')
          .replace('listen_addresses = ["/ip4/0.0.0.0/tcp/8115"]', 'listen_addresses = test')
          .replace('listen_address = "127.0.0.1:8114"', 'listen_address = listen_address')
      )
    })
  })
})
