import WalletService from '../../src/services/wallets'
import Keystore from '../../src/models/keys/keystore'
import Keychain from '../../src/models/keys/keychain'
import { mnemonicToSeedSync } from '../../src/models/keys/mnemonic'
import { ExtendedPrivateKey, AccountExtendedPublicKey } from '../../src/models/keys/key'
import Core from '@nervosnetwork/ckb-sdk-core'
import TransactionSender from '../../src/services/transaction-sender'

describe('sign witness', () => {
  const witness = {
    lock: undefined,
    inputType: undefined,
    outputType: undefined,
  }
  const privateKey: string = '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3'
  const txHash = '0x00f5f31941964004d665a8762df8eb4fab53b5ef8437b7d34a38e018b1409054'
  const expectedData = ['0x5500000010000000550000005500000041000000aa6de884b0dd0378383cedddc39790b5cad66e42d5dc7655de728ee7eb3a53be071605d76641ad26766c6ed4864e67dbc2cd1526e006c9be7ccfa9b8cbf9e7c701']

  it('success', () => {
    const core = new Core('')
    const newWitness = core.signWitnesses(privateKey)({
      witnesses: [witness],
      transactionHash: txHash
    })
    expect(newWitness).toEqual(expectedData)
  })
})

describe('get keys with paths', () => {
  const walletService = WalletService.getInstance()
  const mnemonic = 'tank planet champion pottery together intact quick police asset flower sudden question'
  const password = '1234abc~'
  const receivingPath = `m/44'/309'/0'/0/0`
  const changePath = `m/44'/309'/0'/1/0`
  const receivingPrivateKey = '0x848422863825f69e66dc7f48a3302459ec845395370c23578817456ad6b04b14'
  // const receivingPublicKey = '0x034dc074f2663d73aedd36f5fc2d1a1e4ec846a4dffa62d8d8bae8a4d6fffdf2b0'
  const changePriateKey = '0x15ec3e9ba7024557a116f37f08a99ee7769882c2cb4cfabeced1662394279747'
  // const changePublicKey = '03f3600eb8f2bd7675fd7763dbe3fc36a1103e45b46629860a88a374bcf015df03'

  beforeEach(() => {
    walletService.clearAll()
  })

  it('get keys', () => {
    const seed = mnemonicToSeedSync(mnemonic)
    const masterKeychain = Keychain.fromSeed(seed)
    const extendedKey = new ExtendedPrivateKey(
      masterKeychain.privateKey.toString('hex'),
      masterKeychain.chainCode.toString('hex')
    )
    const p = masterKeychain.derivePath(receivingPath).privateKey.toString('hex')
    expect(`0x${p}`).toEqual(receivingPrivateKey)
    const keystore = Keystore.create(extendedKey, password)

    const accountKeychain = masterKeychain.derivePath(AccountExtendedPublicKey.ckbAccountPath)
    const accountExtendedPublicKey = new AccountExtendedPublicKey(
      accountKeychain.publicKey.toString('hex'),
      accountKeychain.chainCode.toString('hex')
    )

    const wallet = walletService.create({
      id: '',
      name: 'Test Wallet',
      extendedKey: accountExtendedPublicKey.serialize(),
      keystore,
    })

    const masterPrivateKey = wallet.loadKeystore().extendedPrivateKey(password)
    expect(masterKeychain.privateKey.toString('hex')).toEqual(masterPrivateKey.privateKey)

    const pathsAndKeys = (new TransactionSender()).getPrivateKeys(wallet, [receivingPath, changePath], password)
    expect(pathsAndKeys[0]).toEqual({
      path: receivingPath,
      privateKey: receivingPrivateKey,
    })
    expect(pathsAndKeys[1]).toEqual({
      path: changePath,
      privateKey: changePriateKey,
    })
  })
})

describe('epoch', () => {
  const epochInfo = {
    epoch: BigInt('1979121332649985'),
    length: BigInt(1800),
    index: BigInt(24),
    number: BigInt(1),
  }

  it('parse epoch', () => {
    // @ts-ignore: Private method
    const result = (new TransactionSender()).parseEpoch(epochInfo.epoch)

    expect(result.length).toEqual(epochInfo.length)
    expect(result.index).toEqual(epochInfo.index)
    expect(result.number).toEqual(epochInfo.number)
  })

  it('epoch since', () => {
    // @ts-ignore: Private method
    const epoch = (new TransactionSender()).epochSince(epochInfo.length, epochInfo.index, epochInfo.number)

    expect(epoch).toEqual(epochInfo.epoch + (BigInt(0x20) << BigInt(56)))
  })
})
