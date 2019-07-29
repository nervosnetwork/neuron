import { Script, ScriptHashType } from '../../src/types/cell-types'
import LockUtils from '../../src/models/lock-utils'

const systemScript = {
  outPoint: {
    blockHash: null,
    cell: {
      txHash: '0xbffab7ee0a050e2cb882de066d3dbf3afdd8932d6a26eda44f06e4b23f0f4b5a',
      index: '1',
    },
  },
  codeHash: '0x54811ce986d5c3e57eaafab22cdd080e32209e39590e204a99b32935f835a13c',
}

describe('LockUtils Test', () => {
  const bob = {
    lockScript: {
      codeHash: '0x54811ce986d5c3e57eaafab22cdd080e32209e39590e204a99b32935f835a13c',
      args: ['0x36c329ed630d6ce750712a477543672adab57f4c'],
      hashType: ScriptHashType.Data,
    },
    lockHash: '0x7f16a8b5e5f00ef85fa7ead69f9392b27e7a6410586e075fbede8d319c4a805e',
    lockHashWhenType: '0x708ad25f321f7740c42afa0d570e4506d8c113f81d721790362c39d0566f32b1',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
  }

  const alice = {
    lockScript: {
      codeHash: '0x54811ce986d5c3e57eaafab22cdd080e32209e39590e204a99b32935f835a13c',
      args: ['0xe2193df51d78411601796b35b17b4f8f2cd85bd0'],
      hashType: ScriptHashType.Data,
    },
    lockHash: '0xa16d544d3e39c4ebeef22c706fecc3d33ba65d644c4d4a4bc9a2fbccad0042d0',
    lockHashWhenType: '0x57c1c4b8bcc96d7829bf1778beda25d65afa9d535902b82c839289ca9cd44724',
    address: 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
    blake160: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
  }

  it('lockScriptToHash', async () => {
    const lockHash: string = LockUtils.lockScriptToHash(bob.lockScript)

    expect(lockHash).toEqual(bob.lockHash)
  })

  // FIXME: test failed, should fix addressToLockScript
  it('addressToLockScript', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const lockScript: Script = await LockUtils.addressToLockScript(bob.address)

    expect(lockScript).toEqual(bob.lockScript)
  })

  it('addressToLockHash', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const lockHash: string = await LockUtils.addressToLockHash(bob.address)

    expect(lockHash).toEqual(bob.lockHash)
  })

  it('addressToLockHash Type', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const lockHash: string = await LockUtils.addressToLockHash(bob.address, ScriptHashType.Type)

    expect(lockHash).toEqual(bob.lockHashWhenType)
  })

  it('addressToAllLockHashes', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const lockHashes: string[] = await LockUtils.addressToAllLockHashes(bob.address)

    expect(lockHashes).toEqual([bob.lockHash, bob.lockHashWhenType])
  })

  it('addressesToAllLockHashes', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const lockHashes: string[] = await LockUtils.addressesToAllLockHashes([bob.address, alice.address])

    const expectedResult = [
      bob.lockHash,
      bob.lockHashWhenType,
      alice.lockHash,
      alice.lockHashWhenType,
    ]

    expect(lockHashes).toEqual(expectedResult)
  })

  it('lockScriptToAddress', async () => {
    const address: string = LockUtils.lockScriptToAddress(bob.lockScript)

    expect(address).toEqual(bob.address)
  })

  it('blake160ToAddress', async () => {
    const address: string = LockUtils.blake160ToAddress(bob.blake160)

    expect(address).toEqual(bob.address)
  })

  it('addressToBlake160', () => {
    const blake160 = LockUtils.addressToBlake160(bob.address)

    expect(blake160).toEqual(bob.blake160)
  })
})
