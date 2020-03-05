import LockUtils from '../../src/models/lock-utils'
import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import Script, { ScriptHashType } from '../../src/models/chain/script'

describe('LockUtils Test', () => {
  const bob = {
    lockScript: {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      args: '0x36c329ed630d6ce750712a477543672adab57f4c',
      hashType: ScriptHashType.Type,
    },
    lockHash: '0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d',
    address: 'ckt1qyqrdsefa43s6m882pcj53m4gdnj4k440axqswmu83',
    blake160: '0x36c329ed630d6ce750712a477543672adab57f4c',
  }

  const alice = {
    lockScript: {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      args: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
      hashType: ScriptHashType.Type,
    },
    lockHash: '0xa35eda3e71e86e4e22b7924012b6a6e90809dc7a68621d5f7a7c40eea01be45e',
    address: 'ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v',
    blake160: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
  }

  it('addressToLockScript', async () => {
    const lockScript: Script = new LockUtils().addressToLockScript(bob.address)

    expect({ ...lockScript }).toEqual(bob.lockScript)
  })

  it('addressToLockHash', async () => {
    const lockHash: string = new LockUtils().addressToLockHash(bob.address)

    expect(lockHash).toEqual(bob.lockHash)
  })

  it('addressToAllLockHashes', async () => {
    const lockHashes: string[] = new LockUtils().addressToAllLockHashes(bob.address)

    expect(lockHashes).toEqual([bob.lockHash])
  })

  it('addressesToAllLockHashes', async () => {
    const lockHashes: string[] = new LockUtils()
      .addressesToAllLockHashes([bob.address, alice.address])

    const expectedResult = [bob.lockHash, alice.lockHash]

    expect(lockHashes).toEqual(expectedResult)
  })

  it('lockScriptToAddress', async () => {
    const address: string = LockUtils.lockScriptToAddress(
      new Script(bob.lockScript.codeHash, bob.lockScript.args, bob.lockScript.hashType),
      AddressPrefix.Testnet
    )

    expect(address).toEqual(bob.address)
  })

  it('blake160ToAddress', async () => {
    const address: string = LockUtils.blake160ToAddress(bob.blake160, AddressPrefix.Testnet)

    expect(address).toEqual(bob.address)
  })

  it('addressToBlake160', () => {
    const blake160 = LockUtils.addressToBlake160(bob.address)

    expect(blake160).toEqual(bob.blake160)
  })
})
