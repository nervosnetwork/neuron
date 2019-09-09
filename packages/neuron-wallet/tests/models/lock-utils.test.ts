import { Script, ScriptHashType } from '../../src/types/cell-types'
import LockUtils from '../../src/models/lock-utils'

const systemScript = {
  outPoint: {
    txHash: '0x74e34a76d68f5ed864c0ad139a82461ee809e981939cd9cfcd92ac0fdbb1114b',
    index: '0',
  },
  codeHash: '0x1892ea40d82b53c678ff88312450bbb17e164d7a3e0a90941aa58839f56f8df2',
  hashType: ScriptHashType.Type,
}

describe('LockUtils Test', () => {
  const bob = {
    lockScript: {
      codeHash: '0x1892ea40d82b53c678ff88312450bbb17e164d7a3e0a90941aa58839f56f8df2',
      args: ['0x36c329ed630d6ce750712a477543672adab57f4c'],
      hashType: ScriptHashType.Type,
    },
    lockHash: '0xecaeea8c8581d08a3b52980272001dbf203bc6fa2afcabe7cc90cc2afff488ba',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
  }

  const alice = {
    lockScript: {
      codeHash: '0x1892ea40d82b53c678ff88312450bbb17e164d7a3e0a90941aa58839f56f8df2',
      args: ['0xe2193df51d78411601796b35b17b4f8f2cd85bd0'],
      hashType: ScriptHashType.Type,
    },
    lockHash: '0x489306d801d54bee2d8562ae20fdc53635b568f8107bddff15bb357f520cc02c',
    address: 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
    blake160: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
  }

  it('lockScriptToHash', async () => {
    const lockHash: string = await LockUtils.lockScriptToHash(bob.lockScript)

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

  it('addressToAllLockHashes', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const lockHashes: string[] = await LockUtils.addressToAllLockHashes(bob.address)

    expect(lockHashes).toEqual([bob.lockHash])
  })

  it('addressesToAllLockHashes', async () => {
    const mockContractInfo = jest.fn()
    mockContractInfo.mockReturnValue(systemScript)
    LockUtils.systemScript = mockContractInfo.bind(LockUtils)

    const lockHashes: string[] = await LockUtils.addressesToAllLockHashes([bob.address, alice.address])

    const expectedResult = [bob.lockHash, alice.lockHash]

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
