// import AddressService from '../../src/services/addresses'
import { AccountExtendedPublicKey } from '../../src/models/keys/key'
import initConnection from '../../src/database/chain/ormconfig'
import { getConnection } from 'typeorm'
import SystemScriptInfo from '../../src/models/system-script-info'
import { OutputStatus } from '../../src/models/chain/output'
import OutputEntity from '../../src/database/chain/entities/output'
import { AddressType } from '../../src/models/keys/address'
import { Address } from '../../src/database/address/address-dao'

const walletId = '1'
const extendedKey = new AccountExtendedPublicKey(
  '03e5b310636a0f6e7dcdfffa98f28d7ed70df858bb47acf13db830bfde3510b3f3',
  '37e85a19f54f0a242a35599abac64a71aacc21e3a5860dd024377ffc7e6827d8'
)

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
  await getConnection().manager.save(cells)
}

describe('integration tests for AddressService', () => {
  const stubbedAddressCreatedSubjectNext = jest.fn()
  jest.doMock('models/subjects/address-created-subject', () => {
    return {
      getSubject: () => ({
        next: stubbedAddressCreatedSubjectNext
      })
    }
  })
  const AddressService = require('../../src/services/addresses').default

  beforeEach(() => {
    stubbedAddressCreatedSubjectNext.mockReset()
  });

  describe('Key tests with db', () => {
    const receivingStartIndex = 0
    const changeStartIndex = 0
    const isImporting = undefined

    let generatedAddresses: any

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

    describe('#allAddresses', () => {
      const receivingAddressCount = 2
      const changeAddressCount = 1
      let allAddresses: Address[] = []
      beforeEach(async () => {
        await AddressService.generateAndSave(
          '1',
          extendedKey,
          isImporting,
          receivingStartIndex,
          changeStartIndex,
          receivingAddressCount,
          changeAddressCount
        )
        await AddressService.generateAndSave(
          '2',
          extendedKey,
          isImporting,
          receivingStartIndex,
          changeStartIndex,
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

    describe('#generateAndSave', () => {
      const receivingAddressCount = 2
      const changeAddressCount = 1
      beforeEach(async () => {
        await AddressService.generateAndSave(
          walletId,
          extendedKey,
          isImporting,
          receivingStartIndex,
          changeStartIndex,
          receivingAddressCount,
          changeAddressCount
          )
        generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
      });
      it('generate new addresses for a wallet id', async () => {
        expect(generatedAddresses.length).toEqual(2 + 1)
      })
      it('notifies newly generated addresses', () => {
        expect(stubbedAddressCreatedSubjectNext).toHaveBeenCalledWith(
          generatedAddresses.map((addr: any) => {
            delete addr.description
            addr.isImporting = undefined
            return addr
          })
        )
      })
    });

    describe('#checkAndGenerateSave', () => {
      let allGeneratedAddresses: Address[]
      const receivingAddressCount = 4
      const changeAddressCount = 4
      describe('when there are existing addresses', () => {

        beforeEach(async () => {
          await AddressService.generateAndSave(
            walletId,
            extendedKey,
            isImporting,
            receivingStartIndex,
            changeStartIndex,
            receivingAddressCount,
            changeAddressCount
          )
          generatedAddresses = await AddressService.allAddressesByWalletId(walletId)
        });

        describe('both receiving and change addresses', () => {
          describe('when the unused counts are not greater than #minUnusedAddressCount', () => {
            beforeEach(async () => {
              const receivingAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Receiving)
              const changeAddresses = generatedAddresses.filter((addr: Address) => addr.addressType === AddressType.Change)
              await linkNewCell([receivingAddresses[0].blake160])
              await linkNewCell([changeAddresses[0].blake160])

              await AddressService.checkAndGenerateSave(
                walletId,
                extendedKey,
                isImporting,
                receivingAddressCount,
                changeAddressCount
              )
              allGeneratedAddresses = await AddressService.allAddressesByWalletId(walletId)
            });
            it('generates new addresses for both receiving and change', () => {
              expect(allGeneratedAddresses.length).toEqual((receivingAddressCount + changeAddressCount) * 2)
              const receivingAddresses = allGeneratedAddresses.filter(addr => addr.addressType === AddressType.Receiving)
              const changeAddresses = allGeneratedAddresses.filter(addr => addr.addressType === AddressType.Change)
              for (let i = 0; i < receivingAddresses.length; i++) {
                expect(receivingAddresses[i].addressIndex).toEqual(i)
              }
              for (let i = 0; i < changeAddresses.length; i++) {
                expect(changeAddresses[i].addressIndex).toEqual(i)
              }
            });
          });
          describe('when the unused counts are greater than #minUnusedAddressCount', () => {
            beforeEach(async () => {
              await AddressService.checkAndGenerateSave(
                walletId,
                extendedKey,
                isImporting,
                receivingAddressCount,
                changeAddressCount
              )
              allGeneratedAddresses = await AddressService.allAddressesByWalletId(walletId)
            });
            it('should not generate new addresses', () => {
              expect(allGeneratedAddresses.length).toEqual(receivingAddressCount + changeAddressCount)
            });
          });
        });

        describe('receiving addresses', () => {
          describe('when the unused count is not greater than #minUnusedAddressCount', () => {
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
              allGeneratedAddresses = await AddressService.allAddressesByWalletId(walletId)
            });
            it('generates addresses for receiving', () => {
              const receivingAddresses = allGeneratedAddresses.filter((addr: Address) => addr.addressType === AddressType.Receiving)
              expect(receivingAddresses.length).toEqual(receivingAddressCount * 2)
            });
            it('should not generates addresses for change', () => {
              const changeAddresses = allGeneratedAddresses.filter((addr: Address) => addr.addressType === AddressType.Change)
              expect(changeAddresses.length).toEqual(changeAddressCount)
            })
          });
        });

        describe('change addresses', () => {
          describe('when the unused count is not greater than #minUnusedAddressCount', () => {
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
              allGeneratedAddresses = await AddressService.allAddressesByWalletId(walletId)
            });
            it('generates addresses for change', () => {
              const changeAddresses = allGeneratedAddresses.filter((addr: Address) => addr.addressType === AddressType.Change)
              expect(changeAddresses.length).toEqual(changeAddressCount * 2)
            });
            it('should not generates addresses for receiving', () => {
              const receivingAddresses = allGeneratedAddresses.filter((addr: Address) => addr.addressType === AddressType.Receiving)
              expect(receivingAddresses.length).toEqual(receivingAddressCount)
            })
          });
        })
      });

      describe('when there are no existing addresses', () => {
        beforeEach(async () => {
          await AddressService.checkAndGenerateSave(
            walletId,
            extendedKey,
            isImporting,
            receivingAddressCount,
            changeAddressCount
          )
          allGeneratedAddresses = await AddressService.allAddressesByWalletId(walletId)
        });
        it('generate both receiving and change addresses based from address index 0', () => {
          expect(allGeneratedAddresses.length).toEqual(receivingAddressCount + changeAddressCount)

          const receivingAddresses = allGeneratedAddresses.filter(addr => addr.addressType === AddressType.Receiving)
          const changeAddresses = allGeneratedAddresses.filter(addr => addr.addressType === AddressType.Change)
          for (let i = 0; i < receivingAddresses.length; i++) {
            expect(receivingAddresses[i].addressIndex).toEqual(i)
          }
          for (let i = 0; i < changeAddresses.length; i++) {
            expect(changeAddresses[i].addressIndex).toEqual(i)
          }
        })
      });
    });

    describe('#nextUnusedAddress', () => {
      const receivingAddressCount = 2
      const changeAddressCount = 2
      let publicKeysToUse = []
      describe('when there are unused receiving addresses', () => {
        beforeEach(async () => {
          await AddressService.generateAndSave(
            walletId,
            extendedKey,
            isImporting,
            receivingStartIndex,
            changeStartIndex,
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
          await AddressService.generateAndSave(
            walletId,
            extendedKey,
            isImporting,
            receivingStartIndex,
            changeStartIndex,
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
          await AddressService.generateAndSave(
            walletId,
            extendedKey,
            isImporting,
            receivingStartIndex,
            changeStartIndex,
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
      const receivingAddressCount = 2
      const changeAddressCount = 2
      describe('when there are unused receiving addresses', () => {
        beforeEach(async () => {
          await AddressService.generateAndSave(
            walletId,
            extendedKey,
            isImporting,
            receivingStartIndex,
            changeStartIndex,
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
          await AddressService.generateAndSave(
            walletId,
            extendedKey,
            isImporting,
            receivingStartIndex,
            changeStartIndex,
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
      const receivingAddressCount = 2
      const changeAddressCount = 2
      beforeEach(async () => {
        await AddressService.generateAndSave(
          walletId,
          extendedKey,
          isImporting,
          receivingStartIndex,
          changeStartIndex,
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
        await AddressService.generateAndSave(
          walletId,
          extendedKey,
          isImporting,
          receivingStartIndex,
          changeStartIndex,
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
