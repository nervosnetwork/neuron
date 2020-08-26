import { AccountExtendedPublicKey } from '../../src/models/keys/key'
import initConnection from '../../src/database/chain/ormconfig'
import { getConnection } from 'typeorm'
import SystemScriptInfo from '../../src/models/system-script-info'
import { OutputStatus } from '../../src/models/chain/output'
import OutputEntity from '../../src/database/chain/entities/output'
import { AddressType } from '../../src/models/keys/address'
import { Address } from '../../src/database/address/address-dao'
import Transaction from '../../src/database/chain/entities/transaction'
import { TransactionStatus } from '../../src/models/chain/transaction'
import AddressParser from '../../src/models/address-parser'
import { when } from 'jest-when'

const walletId = '1'
const extendedKey = new AccountExtendedPublicKey(
  '03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3',
  '37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
)

const preloadedPublicKeys:any = []

const randomHex = (length: number = 64): string => {
  const str: string = Array.from({ length })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')

  return `0x${str}`
}

const generateCell = (
  capacity: string,
  lockScript: any,
  status: OutputStatus,
) => {
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

describe('integration tests for AddressService', () => {
  const stubbedAddressCreatedSubjectNext = jest.fn()
  const stubbedIsChildProcessFn = jest.fn()

  jest.doMock('models/subjects/address-created-subject', () => {
    return {
      getSubject: () => ({
        next: stubbedAddressCreatedSubjectNext
      })
    }
  })
  jest.doMock('utils/worker', () => {
    return {
      ChildProcess: {
        isChildProcess: stubbedIsChildProcessFn
      }
    }
  })
  const AddressService = require('../../src/services/addresses').default

  beforeAll(() => {
    for (let addressType = 0; addressType <= 1; addressType ++) {
      for (let addressIndex = 0; addressIndex <= 7; addressIndex ++) {
        const address = extendedKey.address(
          addressType,
          addressIndex,
          AddressService.getAddressPrefix()
        )
        preloadedPublicKeys.push({
          address,
          addressType,
          addressIndex,
          publicKeyHash: AddressParser.toBlake160(address.address)
        })
      }
    }

    const stubbedExtendedKeyAddressFn = when(jest.spyOn(extendedKey, 'address'))
    for (const addressToMock of preloadedPublicKeys) {
      stubbedExtendedKeyAddressFn
        .calledWith(
          addressToMock.addressType,
          addressToMock.addressIndex,
          AddressService.getAddressPrefix()
        )
        .mockReturnValue(addressToMock.address)
    }
  })
  beforeEach(() => {
    stubbedAddressCreatedSubjectNext.mockReset()
  });

  describe('Key tests with db', () => {
    const isImporting = undefined

    let generatedAddresses: Address[]

    beforeAll(async () => {
      await initConnection('')
    })

    afterAll(async () => {
      await getConnection().close()
    })

    beforeEach(async () => {
      const connection = getConnection()
      await connection.synchronize(true)
    })

    describe('#checkAndGenerateSave', () => {
      const receivingAddressCount = 4
      const changeAddressCount = 4

      describe('when the newly created public keys have not been used', () => {

        beforeEach(async () => {
          await AddressService.checkAndGenerateSave(
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount
          )
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
        });
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
          expect(stubbedAddressCreatedSubjectNext).toHaveBeenCalledTimes(1)
          expect(stubbedAddressCreatedSubjectNext).toHaveBeenCalledWith(
            generatedAddresses.map((addr: any) => {
              delete addr.description
              addr.isImporting = undefined
              return addr
            })
          )
        })

        describe('when receiving and change addresses are used', () => {
          beforeEach(async () => {
            const receivingAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Receiving)
            const changeAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Change)
            await linkNewCell([receivingAddresses[0].blake160, changeAddresses[0].blake160])

            await AddressService.checkAndGenerateSave(
              walletId,
              extendedKey,
              isImporting,
              receivingAddressCount,
              changeAddressCount
            )
            generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          });
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
          });
        });
        describe('when none of public keys are used', () => {
          beforeEach(async () => {
            await AddressService.checkAndGenerateSave(
              walletId,
              extendedKey,
              isImporting,
              receivingAddressCount,
              changeAddressCount
            )
            generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          });
          it('should not generate new addresses', () => {
            expect(generatedAddresses.length).toEqual(receivingAddressCount + changeAddressCount)
          });
        });

        describe('when receiving public keys are used', () => {
          beforeEach(async () => {
            const receivingAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Receiving)
            await linkNewCell([receivingAddresses[0].blake160])

            await AddressService.checkAndGenerateSave(
              walletId,
              extendedKey,
              isImporting,
              receivingAddressCount,
              changeAddressCount
            )
            generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          });
          it('generates addresses for receiving', () => {
            const receivingAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Receiving)
            expect(receivingAddresses.length).toEqual(receivingAddressCount * 2)
          });
          it('should not generates addresses for change', () => {
            const changeAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Change)
            expect(changeAddresses.length).toEqual(changeAddressCount)
          })
        });

        describe('when change public keys are used', () => {
          beforeEach(async () => {
            const changeAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Change)
            await linkNewCell([changeAddresses[0].blake160])

            await AddressService.checkAndGenerateSave(
              walletId,
              extendedKey,
              isImporting,
              receivingAddressCount,
              changeAddressCount
            )
            generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          });
          it('generates addresses for change', () => {
            const changeAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Change)
            expect(changeAddresses.length).toEqual(changeAddressCount * 2)
          });
          it('should not generates addresses for receiving', () => {
            const receivingAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Receiving)
            expect(receivingAddresses.length).toEqual(receivingAddressCount)
          })
        });
      });
      describe('when newly generated public keys in the first batch are already used', () => {
        beforeEach(async () => {
          await linkNewCell(
            preloadedPublicKeys
              .filter((k: any) => k.addressIndex < 4)
              .map((k: any) => k.publicKeyHash)
          )

          await AddressService.checkAndGenerateSave(
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount
          )
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
        });
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
          expect(stubbedAddressCreatedSubjectNext).toHaveBeenCalledTimes(1)
          expect(stubbedAddressCreatedSubjectNext).toHaveBeenCalledWith(
            generatedAddresses
              .map((addr: any) => {
                delete addr.description
                addr.isImporting = undefined
                return addr
              })
          )
        })
      })
    });

    describe('#allAddresses', () => {
      const receivingAddressCount = 4
      const changeAddressCount = 4
      let allAddresses: Address[] = []
      beforeEach(async () => {
        await AddressService.checkAndGenerateSave(
          '1',
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount
        )
        await AddressService.checkAndGenerateSave(
          '2',
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount
        )
        allAddresses = await AddressService.allAddresses()
      });
      it('returns all addresses', () => {
        const addressCountPerWallet = receivingAddressCount + changeAddressCount
        expect(allAddresses.length).toEqual(addressCountPerWallet * 2)
        expect(allAddresses.filter(addr => addr.walletId === '1').length).toEqual(addressCountPerWallet)
        expect(allAddresses.filter(addr => addr.walletId === '2').length).toEqual(addressCountPerWallet)
      })
    });

    describe('#nextUnusedAddress', () => {
      const receivingAddressCount = 2
      const changeAddressCount = 2
      let publicKeysToUse = []
      describe('when there are unused receiving addresses', () => {
        beforeEach(async () => {
          await AddressService.checkAndGenerateSave(
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount
          )
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          publicKeysToUse = [generatedAddresses[0].blake160]
          await linkNewCell(publicKeysToUse)
        });
        it('returns next unused receiving address', async () => {
          const nextUnusedAddress = await AddressService.nextUnusedAddress(walletId)
          expect(nextUnusedAddress).toEqual(generatedAddresses[publicKeysToUse.length])
          expect(nextUnusedAddress.addressType).toEqual(AddressType.Receiving)
        })
      });
      describe('when there are unused change addresses but no receiving addresses', () => {
        beforeEach(async () => {
          await AddressService.checkAndGenerateSave(
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount
          )
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          publicKeysToUse = generatedAddresses
            .filter((addr: Address) => addr.addressType === AddressType.Receiving)
            .map((addr: Address) => addr.blake160)

          await linkNewCell(publicKeysToUse)
        });
        it('returns next unused change address', async () => {
          const nextUnusedAddress = await AddressService.nextUnusedAddress(walletId)
          expect(nextUnusedAddress).toEqual(generatedAddresses[publicKeysToUse.length])
          expect(nextUnusedAddress.addressType).toEqual(AddressType.Change)
        })
      });
      describe('when there is no receiving or change unused address', () => {
        beforeEach(async () => {
          await AddressService.checkAndGenerateSave(
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount
          )
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          publicKeysToUse = generatedAddresses.map((addr: Address) => addr.blake160)

          await linkNewCell(publicKeysToUse)
        });
        it('returns next unused change address', async () => {
          const nextUnusedAddress = await AddressService.nextUnusedAddress(walletId)
          expect(nextUnusedAddress).toEqual(undefined)
        })
      });
    });

    describe('#allUnusedReceivingAddresses', () => {
      let publicKeysToUse = []
      const receivingAddressCount = 4
      const changeAddressCount = 4
      describe('when there are unused receiving addresses', () => {
        beforeEach(async () => {
          await AddressService.checkAndGenerateSave(
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount
          )
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          publicKeysToUse = [generatedAddresses[0].blake160]
          await linkNewCell(publicKeysToUse)
        });
        it('returns the unused receiving addresses', async () => {
          const allUnusedReceivingAddresses = await AddressService.allUnusedReceivingAddresses(walletId)
          expect(allUnusedReceivingAddresses.length).toEqual(receivingAddressCount - publicKeysToUse.length)
          for (const unusedAddress of allUnusedReceivingAddresses) {
            expect(unusedAddress.addressType).toEqual(AddressType.Receiving)
          }
        })
      });
      describe('when there is no unused receiving address', () => {
        beforeEach(async () => {
          await AddressService.checkAndGenerateSave(
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount
          )
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          publicKeysToUse = generatedAddresses.map((addr: Address) => addr.blake160)
          await linkNewCell(publicKeysToUse)
        });
        it('returns empty array', async () => {
          const allUnusedReceivingAddresses = await AddressService.allUnusedReceivingAddresses(walletId)
          expect(allUnusedReceivingAddresses).toEqual([])
        })
      });
    });

    describe('#nextUnusedChangeAddress', () => {
      let publicKeysToUse = []
      const receivingAddressCount = 4
      const changeAddressCount = 4
      beforeEach(async () => {
        await AddressService.checkAndGenerateSave(
          walletId,
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount
        )
      });
      describe('when there are unused change addresses', () => {
        beforeEach(async () => {
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          publicKeysToUse = [generatedAddresses[changeAddressCount].blake160]
          await linkNewCell(publicKeysToUse)
        });
        it('returns the unused receiving addresses', async () => {
          const nextUnusedChangeAddress = await AddressService.nextUnusedChangeAddress(walletId)
          expect(nextUnusedChangeAddress).toEqual(generatedAddresses[changeAddressCount + 1])
          expect(nextUnusedChangeAddress.addressType).toEqual(AddressType.Change)
        })
      });
      describe('when there is no unused receiving address', () => {
        beforeEach(async () => {
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
          publicKeysToUse = generatedAddresses
            .filter((addr: Address) => addr.addressType === AddressType.Change)
            .map((addr: Address) => addr.blake160)
          await linkNewCell(publicKeysToUse)
        });
        it('returns undefined', async () => {
          const nextUnusedChangeAddress = await AddressService.nextUnusedChangeAddress(walletId)
          expect(nextUnusedChangeAddress).toEqual(undefined)
        })
      });
    });

    describe('#allAddressesWithBalancesByWalletId', () => {
      let publicKeysToUse: string[] = []
      const receivingAddressCount = 1
      const changeAddressCount = 1
      beforeEach(async () => {
        await AddressService.checkAndGenerateSave(
          walletId,
          extendedKey,
          isImporting,
          receivingAddressCount,
          changeAddressCount
        )
        generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
        publicKeysToUse = generatedAddresses.map((addr: Address) => addr.blake160)

        await linkNewCell([publicKeysToUse[0]], '1', OutputStatus.Live)
        await linkNewCell([publicKeysToUse[0]], '2', OutputStatus.Sent)
        await linkNewCell([publicKeysToUse[0]], '3', OutputStatus.Pending)
        await linkNewCell([publicKeysToUse[0]], '4', OutputStatus.Failed)
        await linkNewCell([publicKeysToUse[0]], '5', OutputStatus.Dead)
      });
      it('calculates balances', async () => {
          const allAddresses = await AddressService.allAddressesWithBalancesByWalletId(walletId)
          expect(allAddresses[0].blake160).toEqual(publicKeysToUse[0])
          expect(allAddresses[0].liveBalance).toEqual('1')
          expect(allAddresses[0].sentBalance).toEqual('2')
          expect(allAddresses[0].pendingBalance).toEqual('3')
          expect(allAddresses[0].balance).toEqual((parseInt(allAddresses[0].liveBalance) + parseInt(allAddresses[0].sentBalance)).toString())

          expect(allAddresses[1].liveBalance).toEqual('0')
          expect(allAddresses[1].sentBalance).toEqual('0')
          expect(allAddresses[1].pendingBalance).toEqual('0')
          expect(allAddresses[1].balance).toEqual('0')
      })
    });
  })
});
