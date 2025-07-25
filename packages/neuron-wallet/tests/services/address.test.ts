import SystemScriptInfo from '../../src/models/system-script-info'
import { OutputStatus } from '../../src/models/chain/output'
import OutputEntity from '../../src/database/chain/entities/output'
import { bytes } from '@ckb-lumos/lumos/codec'
import { hd } from '@ckb-lumos/lumos'
import { Address } from '../../src/models/address'
import Transaction from '../../src/database/chain/entities/transaction'
import { TransactionStatus } from '../../src/models/chain/transaction'
import { when } from 'jest-when'
import HdPublicKeyInfo from '../../src/database/chain/entities/hd-public-key-info'
import { closeConnection, getConnection, initConnection } from '../setupAndTeardown'
import { NetworkType } from '../../src/models/network'
import WalletService from '../../src/services/wallets'

const { AddressType, AccountExtendedPublicKey } = hd

const walletId = '1'
const extendedKey = new AccountExtendedPublicKey(
  '0x03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3',
  '0x37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
)

const preloadedPublicKeys: any = []

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

const generateCell = (capacity: string, lockScript: any, status: OutputStatus) => {
  const output = new OutputEntity()
  output.outPointTxHash = randomHex()
  output.outPointIndex = '0'
  output.capacity = capacity
  output.lockCodeHash = lockScript.codeHash
  output.lockArgs = lockScript.args
  output.lockHashType = lockScript.hashType
  output.lockHash = lockScript.computeHash()
  output.status = status
  output.hasData = false

  return output
}

const linkNewCell = async (
  publicKeysInBlake160: string[],
  capacity: string = '100',
  status: OutputStatus = OutputStatus.Live
) => {
  const cells: OutputEntity[] = publicKeysInBlake160.map(key => {
    const lockScript = SystemScriptInfo.generateSecpScript(key)
    return generateCell(capacity, lockScript, status)
  })

  const txs = cells.map((cell, index) => {
    const transaction = new Transaction()
    transaction.hash = 'h' + index
    transaction.blockHash = 'b' + index
    transaction.version = ''
    transaction.witnesses = []
    transaction.outputs = [cell]
    transaction.status = TransactionStatus.Success
    return transaction
  })
  await getConnection().manager.save(cells)
  await getConnection().manager.save(txs)
}

jest.mock('services/networks', () => ({
  getInstance() {
    return {
      isMainnet: () => true,
      getCurrent: () => ({
        type: NetworkType.Normal,
      }),
    }
  },
}))

const stubbedAddressDbChangedSubjectNext = jest.fn()
jest.mock('models/subjects/address-db-changed-subject', () => ({
  getSubject() {
    return {
      next: stubbedAddressDbChangedSubjectNext,
    }
  },
}))

describe('integration tests for AddressService', () => {
  const AddressService = require('../../src/services/addresses').default
  const notifyAddressCreatedStub = jest.spyOn(AddressService, 'notifyAddressCreated')
  notifyAddressCreatedStub.mockImplementation(() => {})

  beforeAll(() => {
    for (let addressType = 0; addressType <= 1; addressType++) {
      for (let addressIndex = 0; addressIndex <= 7; addressIndex++) {
        const publicKeyInfo = extendedKey.publicKeyInfo(addressType, addressIndex)
        preloadedPublicKeys.push({
          addressType,
          addressIndex,
          publicKeyInfo,
          publicKeyHash: publicKeyInfo.blake160,
        })
      }
    }

    const stubbedExtendedPublicKeyInfoFn = when(jest.spyOn(extendedKey, 'publicKeyInfo'))
    for (const addressToMock of preloadedPublicKeys) {
      stubbedExtendedPublicKeyInfoFn
        .calledWith(addressToMock.addressType, addressToMock.addressIndex)
        .mockReturnValue(addressToMock.publicKeyInfo)
    }
  })

  beforeEach(() => {
    notifyAddressCreatedStub.mockReset()
  })

  describe('Key tests with db', () => {
    const isImporting = undefined

    let generatedAddresses: Address[]

    beforeAll(async () => {
      await initConnection()
    })

    afterAll(async () => {
      await closeConnection()
    })

    beforeEach(async () => {
      const connection = getConnection()
      await connection.synchronize(true)
    })

    afterEach(async () => {
      stubbedAddressDbChangedSubjectNext.mockReset()
    })

    describe('#generateAndSaveForExtendedKey', () => {
      const receivingAddressCount = 4
      const changeAddressCount = 4

      describe('when the newly created public keys have not been used', () => {
        beforeEach(async () => {
          await AddressService.generateAndSaveForExtendedKey({
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
        })

        it('generates both receiving and change addresses', () => {
          expect(generatedAddresses.length).toEqual(receivingAddressCount + changeAddressCount)

          const receivingAddresses = generatedAddresses.filter(addr => addr.addressType === AddressType.Receiving)
          const changeAddresses = generatedAddresses.filter(addr => addr.addressType === AddressType.Change)
          for (let i = 0; i < receivingAddresses.length; i++) {
            expect(receivingAddresses[i].addressIndex).toEqual(i)
          }
          for (let i = 0; i < changeAddresses.length; i++) {
            expect(changeAddresses[i].addressIndex).toEqual(i)
          }
        })
        it('notifies newly generated addresses', () => {
          expect(notifyAddressCreatedStub).toHaveBeenCalledTimes(1)
          expect(notifyAddressCreatedStub).toHaveBeenCalledWith(generatedAddresses, undefined)
        })

        describe('when receiving and change addresses are used', () => {
          beforeEach(async () => {
            const receivingAddresses = generatedAddresses.filter(
              (addr: Address) => addr.addressType === AddressType.Receiving
            )
            const changeAddresses = generatedAddresses.filter(
              (addr: Address) => addr.addressType === AddressType.Change
            )
            await linkNewCell([receivingAddresses[0].blake160, changeAddresses[0].blake160])

            await AddressService.generateAndSaveForExtendedKey({
              walletId,
              extendedKey,
              isImporting,
              receivingAddressCount,
              changeAddressCount,
            })
            generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          })
          it('generates new addresses for both receiving and change', () => {
            expect(generatedAddresses.length).toEqual((receivingAddressCount + changeAddressCount) * 2)
            const receivingAddresses = generatedAddresses.filter(addr => addr.addressType === AddressType.Receiving)
            const changeAddresses = generatedAddresses.filter(addr => addr.addressType === AddressType.Change)
            for (let i = 0; i < receivingAddresses.length; i++) {
              expect(receivingAddresses[i].addressIndex).toEqual(i)
            }
            for (let i = 0; i < changeAddresses.length; i++) {
              expect(changeAddresses[i].addressIndex).toEqual(i)
            }
          })
        })
        describe('when none of public keys are used', () => {
          beforeEach(async () => {
            await AddressService.generateAndSaveForExtendedKey({
              walletId,
              extendedKey,
              isImporting,
              receivingAddressCount,
              changeAddressCount,
            })
            generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          })
          it('should not generate new addresses', () => {
            expect(generatedAddresses.length).toEqual(receivingAddressCount + changeAddressCount)
          })
        })

        describe('when receiving public keys are used', () => {
          beforeEach(async () => {
            const receivingAddresses = generatedAddresses.filter(
              (addr: Address) => addr.addressType === AddressType.Receiving
            )
            await linkNewCell([receivingAddresses[0].blake160])

            await AddressService.generateAndSaveForExtendedKey({
              walletId,
              extendedKey,
              isImporting,
              receivingAddressCount,
              changeAddressCount,
            })
            generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          })
          it('generates addresses for receiving', () => {
            const receivingAddresses = generatedAddresses.filter(
              (addr: Address) => addr.addressType === AddressType.Receiving
            )
            expect(receivingAddresses.length).toEqual(receivingAddressCount * 2)
          })
          it('should not generates addresses for change', () => {
            const changeAddresses = generatedAddresses.filter(
              (addr: Address) => addr.addressType === AddressType.Change
            )
            expect(changeAddresses.length).toEqual(changeAddressCount)
          })
        })

        describe('when change public keys are used', () => {
          beforeEach(async () => {
            const changeAddresses = generatedAddresses.filter(
              (addr: Address) => addr.addressType === AddressType.Change
            )
            await linkNewCell([changeAddresses[0].blake160])

            await AddressService.generateAndSaveForExtendedKey({
              walletId,
              extendedKey,
              isImporting,
              receivingAddressCount,
              changeAddressCount,
            })
            generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          })
          it('generates addresses for change', () => {
            const changeAddresses = generatedAddresses.filter(
              (addr: Address) => addr.addressType === AddressType.Change
            )
            expect(changeAddresses.length).toEqual(changeAddressCount * 2)
          })
          it('should not generates addresses for receiving', () => {
            const receivingAddresses = generatedAddresses.filter(
              (addr: Address) => addr.addressType === AddressType.Receiving
            )
            expect(receivingAddresses.length).toEqual(receivingAddressCount)
          })
        })
      })
      describe('when newly generated public keys in the first batch are already used', () => {
        beforeEach(async () => {
          await linkNewCell(preloadedPublicKeys.filter((k: any) => k.addressIndex < 4).map((k: any) => k.publicKeyHash))

          await AddressService.generateAndSaveForExtendedKey({
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
        })
        it('recursively generates both receiving and change addresses', () => {
          expect(generatedAddresses.length).toEqual((receivingAddressCount + changeAddressCount) * 2)

          const receivingAddresses = generatedAddresses.filter(addr => addr.addressType === AddressType.Receiving)
          const changeAddresses = generatedAddresses.filter(addr => addr.addressType === AddressType.Change)
          for (let i = 0; i < receivingAddresses.length; i++) {
            expect(receivingAddresses[i].addressIndex).toEqual(i)
          }
          for (let i = 0; i < changeAddresses.length; i++) {
            expect(changeAddresses[i].addressIndex).toEqual(i)
          }
        })
        it('notifies newly generated addresses', () => {
          expect(notifyAddressCreatedStub).toHaveBeenCalledTimes(1)
          expect(notifyAddressCreatedStub).toHaveBeenCalledWith(generatedAddresses, undefined)
        })
      })
    })
    describe('#generateAndSaveForPublicKey', () => {
      describe('with public key info exist for the public key', () => {
        // public key is a valid 33 byte hex string
        const publicKey = '0x' + '00'.repeat(33)
        const addressType = AddressType.Receiving
        const addressIndex = 0
        beforeEach(async () => {
          await AddressService.generateAndSaveForPublicKey({
            walletId,
            publicKey,
            addressType,
            addressIndex,
          })
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
        })
        it('generates one address', () => {
          expect(generatedAddresses.length).toEqual(1)
        })
        it('notifies newly generated addresses', () => {
          expect(notifyAddressCreatedStub).toHaveBeenCalledTimes(1)
          expect(notifyAddressCreatedStub).toHaveBeenCalledWith(generatedAddresses, undefined)
        })
        describe('when trying to generate for the same public key', () => {
          beforeEach(async () => {
            notifyAddressCreatedStub.mockReset()
            // @ts-ignore private-method
            await AddressService.generateAndSaveForPublicKey({
              walletId,
              publicKey,
              addressType,
              addressIndex,
            })
            generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          })
          it('should not generate new address', () => {
            expect(generatedAddresses.length).toEqual(1)
          })

          it('should not notifies for new generated addresses', () => {
            expect(notifyAddressCreatedStub).toHaveBeenCalledTimes(0)
          })
        })
      })
    })

    describe('#getAddressesByAllWallets', () => {
      const receivingAddressCount = 4
      const changeAddressCount = 4
      let allAddresses: Address[] = []
      beforeEach(async () => {
        await AddressService.generateAndSaveForExtendedKey({
          walletId: '1',
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount,
        })
        await AddressService.generateAndSaveForExtendedKey({
          walletId: '2',
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount,
        })
        allAddresses = await AddressService.getAddressesByAllWallets()
      })
      it('returns all addresses', () => {
        const addressCountPerWallet = receivingAddressCount + changeAddressCount
        expect(allAddresses.length).toEqual(addressCountPerWallet * 2)
        expect(allAddresses.filter(addr => addr.walletId === '1').length).toEqual(addressCountPerWallet)
        expect(allAddresses.filter(addr => addr.walletId === '2').length).toEqual(addressCountPerWallet)
      })
    })

    describe('#getFirstAddressByAllWalletId', () => {
      const receivingAddressCount = 4
      const changeAddressCount = 4
      let address: Address
      const walletId = '1'
      beforeEach(async () => {
        await AddressService.generateAndSaveForExtendedKey({
          walletId,
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount,
        })
        address = await AddressService.getFirstAddressByWalletId(walletId)
      })
      it('returns the first addresses by by wallet id', () => {
        expect(address).toEqual(
          expect.objectContaining({
            walletId,
            addressIndex: 0,
            addressType: 0,
          })
        )
      })
    })

    describe('#nextUnusedAddress', () => {
      const receivingAddressCount = 2
      const changeAddressCount = 2
      let publicKeysToUse: string[] = []
      describe('when there are unused receiving addresses', () => {
        beforeEach(async () => {
          await AddressService.generateAndSaveForExtendedKey({
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          publicKeysToUse = [generatedAddresses[0].blake160]
          await linkNewCell(publicKeysToUse)
        })
        it('returns next unused receiving address', async () => {
          const nextUnusedAddress = await AddressService.getNextUnusedAddressByWalletId(walletId)
          expect(nextUnusedAddress).toEqual(generatedAddresses[publicKeysToUse.length])
          expect(nextUnusedAddress.addressType).toEqual(AddressType.Receiving)
        })
      })
      describe('when there are unused change addresses but no receiving addresses', () => {
        beforeEach(async () => {
          await AddressService.generateAndSaveForExtendedKey({
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          publicKeysToUse = generatedAddresses
            .filter((addr: Address) => addr.addressType === AddressType.Receiving)
            .map((addr: Address) => addr.blake160)

          await linkNewCell(publicKeysToUse)
        })
        it('returns next unused change address', async () => {
          const nextUnusedAddress = await AddressService.getNextUnusedAddressByWalletId(walletId)
          expect(nextUnusedAddress).toEqual(generatedAddresses[publicKeysToUse.length])
          expect(nextUnusedAddress.addressType).toEqual(AddressType.Change)
        })
      })
      describe('when there is no receiving or change unused address', () => {
        beforeEach(async () => {
          await AddressService.generateAndSaveForExtendedKey({
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          publicKeysToUse = generatedAddresses.map((addr: Address) => addr.blake160)

          await linkNewCell(publicKeysToUse)
        })
        it('returns next unused change address', async () => {
          const nextUnusedAddress = await AddressService.getNextUnusedAddressByWalletId(walletId)
          expect(nextUnusedAddress).toEqual(undefined)
        })
      })
    })

    describe('#allUnusedReceivingAddresses', () => {
      let publicKeysToUse: string[] = []
      const receivingAddressCount = 4
      const changeAddressCount = 4
      describe('when there are unused receiving addresses', () => {
        beforeEach(async () => {
          await AddressService.generateAndSaveForExtendedKey({
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          publicKeysToUse = [generatedAddresses[0].blake160]
          await linkNewCell(publicKeysToUse)
        })
        it('returns the unused receiving addresses', async () => {
          const allUnusedReceivingAddresses = await AddressService.getUnusedReceivingAddressesByWalletId(walletId)
          expect(allUnusedReceivingAddresses.length).toEqual(receivingAddressCount - publicKeysToUse.length)
          for (const unusedAddress of allUnusedReceivingAddresses) {
            expect(unusedAddress.addressType).toEqual(AddressType.Receiving)
          }
        })
      })
      describe('when there is no unused receiving address', () => {
        beforeEach(async () => {
          await AddressService.generateAndSaveForExtendedKey({
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          publicKeysToUse = generatedAddresses.map((addr: Address) => addr.blake160)
          await linkNewCell(publicKeysToUse)
        })
        it('returns empty array', async () => {
          const allUnusedReceivingAddresses = await AddressService.getUnusedReceivingAddressesByWalletId(walletId)
          expect(allUnusedReceivingAddresses).toEqual([])
        })
      })
    })

    describe('#nextUnusedChangeAddress', () => {
      let publicKeysToUse: string[] = []
      const receivingAddressCount = 4
      const changeAddressCount = 4
      beforeEach(async () => {
        await AddressService.generateAndSaveForExtendedKey({
          walletId,
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount,
        })
      })
      describe('when there are unused change addresses', () => {
        beforeEach(async () => {
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          publicKeysToUse = [generatedAddresses[changeAddressCount].blake160]
          await linkNewCell(publicKeysToUse)
        })
        it('returns the unused receiving addresses', async () => {
          const nextUnusedChangeAddress = await AddressService.getNextUnusedChangeAddressByWalletId(walletId)
          expect(nextUnusedChangeAddress).toEqual(generatedAddresses[changeAddressCount + 1])
          expect(nextUnusedChangeAddress.addressType).toEqual(AddressType.Change)
        })
      })
      describe('when there is no unused receiving address', () => {
        beforeEach(async () => {
          generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
          publicKeysToUse = generatedAddresses
            .filter((addr: Address) => addr.addressType === AddressType.Change)
            .map((addr: Address) => addr.blake160)
          await linkNewCell(publicKeysToUse)
        })
        it('returns undefined', async () => {
          const nextUnusedChangeAddress = await AddressService.getNextUnusedChangeAddressByWalletId(walletId)
          expect(nextUnusedChangeAddress).toEqual(undefined)
        })
      })
    })

    describe('#getAddressesWithBalancesByWalletId', () => {
      let publicKeysToUse: string[] = []
      const receivingAddressCount = 1
      const changeAddressCount = 1
      beforeEach(async () => {
        await AddressService.generateAndSaveForExtendedKey({
          walletId,
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount,
        })
        generatedAddresses = await AddressService.getAddressesByWalletId(walletId)
        publicKeysToUse = generatedAddresses.map((addr: Address) => addr.blake160)

        await linkNewCell([publicKeysToUse[0]], '1', OutputStatus.Live)
        await linkNewCell([publicKeysToUse[0]], '2', OutputStatus.Sent)
        await linkNewCell([publicKeysToUse[0]], '3', OutputStatus.Pending)
        await linkNewCell([publicKeysToUse[0]], '4', OutputStatus.Failed)
        await linkNewCell([publicKeysToUse[0]], '5', OutputStatus.Dead)
      })
      it('calculates balances', async () => {
        const allAddresses = await AddressService.getAddressesWithBalancesByWalletId(walletId)
        expect(allAddresses[0].blake160).toEqual(publicKeysToUse[0])
        expect(allAddresses[0].liveBalance).toEqual('1')
        expect(allAddresses[0].sentBalance).toEqual('2')
        expect(allAddresses[0].pendingBalance).toEqual('3')
        expect(allAddresses[0].balance).toEqual(
          (parseInt(allAddresses[0].liveBalance) + parseInt(allAddresses[0].sentBalance)).toString()
        )

        expect(allAddresses[1].liveBalance).toEqual('0')
        expect(allAddresses[1].sentBalance).toEqual('0')
        expect(allAddresses[1].pendingBalance).toEqual('0')
        expect(allAddresses[1].balance).toEqual('0')
      })
    })

    describe('#updateDescription', () => {
      let addressToUpdate: any
      const description = 'desc'
      const receivingAddressCount = 4
      const changeAddressCount = 4

      const walletId1 = '1'
      const walletId2 = '2'

      describe('when saved description', () => {
        beforeEach(async () => {
          await AddressService.generateAndSaveForExtendedKey({
            walletId: walletId1,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })
          await AddressService.generateAndSaveForExtendedKey({
            walletId: walletId2,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount,
          })

          const generatedAddresses1 = await AddressService.getAddressesByWalletId(walletId1)
          addressToUpdate = generatedAddresses1[0]
          await AddressService.updateDescription(walletId1, addressToUpdate.address, description)
        })
        it('returns description for an address', async () => {
          const generatedAddresses1 = await AddressService.getAddressesByWalletId(walletId1)

          const wallet1Addr = generatedAddresses1.filter(
            (addr: any) => addr.walletId === walletId1 && addr.description === description
          )

          expect(wallet1Addr.length).toEqual(1)
          expect(wallet1Addr[0].address).toEqual(addressToUpdate.address)
        })
        it('should not return description for an address under other wallets even if the address is the same', async () => {
          const generatedAddresses2 = await AddressService.getAddressesByWalletId(walletId2)

          const wallet1Addr = generatedAddresses2.find(
            (addr: any) => addr.walletId === walletId2 && addr.address === addressToUpdate.address
          )
          expect(wallet1Addr!.description).toEqual(undefined)
        })
        describe('when updated an existing description', () => {
          const newDescription = 'new desc'
          beforeEach(async () => {
            await AddressService.updateDescription(walletId1, addressToUpdate.address, newDescription)
          })
          it('overrides description for an address', async () => {
            const generatedAddresses1 = await AddressService.getAddressesByWalletId(walletId1)

            const originals = generatedAddresses1.filter(
              (addr: any) => addr.walletId === walletId1 && addr.description === description
            )
            expect(originals.length).toEqual(0)

            const overrides = generatedAddresses1.filter(
              (addr: any) => addr.walletId === walletId1 && addr.description === newDescription
            )
            expect(overrides.length).toEqual(1)
            expect(overrides[0].address).toEqual(addressToUpdate.address)
          })
        })
      })
    })

    describe('create', () => {
      it('create with exist', async () => {
        const { receiving } = await AddressService.generateAddresses(walletId, extendedKey, 0, 0, 5, 5)
        await getConnection().manager.save(
          receiving.map((addr: any) => {
            return HdPublicKeyInfo.fromObject({
              ...addr,
              publicKeyInBlake160: addr.blake160,
            })
          })
        )
        await AddressService.create({ addresses: receiving })
        expect(stubbedAddressDbChangedSubjectNext).toHaveBeenCalledTimes(0)
      })
      it('create with more than one wallet', async () => {
        await expect(
          AddressService.create({
            addresses: [{ walletId: '1' }, { walletId: '2' }],
          })
        ).rejects.toThrow(new Error('Addresses can only be created for one wallet at a time'))
      })
      it('create with some exist', async () => {
        const { receiving, change } = await AddressService.generateAddresses(walletId, extendedKey, 0, 0, 5, 5)
        await getConnection().manager.save(
          receiving.map((addr: any) => {
            return HdPublicKeyInfo.fromObject({
              ...addr,
              publicKeyInBlake160: addr.blake160,
            })
          })
        )
        await AddressService.create({
          addresses: [...receiving, ...change],
        })
        expect(stubbedAddressDbChangedSubjectNext).toHaveBeenCalledTimes(1)
      })
    })

    describe('getPrivateKeyByAddress', () => {
      const walletService = WalletService.getInstance()
      const mnemonic = 'tank planet champion pottery together intact quick police asset flower sudden question'
      const password = '1234abc~'

      const addressObj = {
        walletId: '5af2473e-78f5-4799-a193-d2b1c2989838',
        address: 'ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvfewjgc69nj783sh03nuckxjacwr55vwgngf9dr',
        path: "m/44'/309'/0'/0/0",
        addressType: 0,
        addressIndex: 0,
        blake160: '0x89cba48c68b3978f185df19f31634bb870e94639',
      }

      const privateKey = '0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14'

      const AddressService = require('../../src/services/addresses').default
      const getAddressesByWalletIdMock = jest.spyOn(AddressService, 'getAddressesByWalletId')

      let walletID = ''

      beforeAll(() => {
        walletService.clearAll()

        const seed = hd.mnemonic.mnemonicToSeedSync(mnemonic)
        const masterKeychain = hd.Keychain.fromSeed(seed)
        const extendedKey = new hd.ExtendedPrivateKey(
          bytes.hexify(masterKeychain.privateKey),
          bytes.hexify(masterKeychain.chainCode)
        )

        const keystore = hd.Keystore.create(extendedKey, password)

        const accountKeychain = masterKeychain.derivePath(hd.AccountExtendedPublicKey.ckbAccountPath)
        const accountExtendedPublicKey = new hd.AccountExtendedPublicKey(
          bytes.hexify(accountKeychain.publicKey),
          bytes.hexify(accountKeychain.chainCode)
        )

        const wallet = walletService.create({
          id: '',
          name: 'Test Wallet',
          extendedKey: accountExtendedPublicKey.serialize(),
          keystore,
        })
        walletID = wallet.id
      })

      it('getPrivateKeyByAddress', async () => {
        getAddressesByWalletIdMock.mockReturnValueOnce([addressObj])

        const pk = await AddressService.getPrivateKeyByAddress({
          walletID,
          password,
          address: addressObj.address,
        })

        expect(pk).toEqual(privateKey)
      })
    })
  })
})
