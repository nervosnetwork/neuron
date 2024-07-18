import WalletService from '../../src/services/wallets'
import { bytes } from '@ckb-lumos/lumos/codec'
import { hd } from '@ckb-lumos/lumos'
import TransactionSender from '../../src/services/transaction-sender'
import { signWitnesses } from '../../src/utils/signWitnesses'

describe('sign witness', () => {
  const witness = {
    lock: undefined,
    inputType: undefined,
    outputType: undefined,
  }
  const privateKey: string = '0xe79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3'
  const txHash = '0x00f5f31941964004d665a8762df8eb4fab53b5ef8437b7d34a38e018b1409054'
  const expectedData = [
    '0x5500000010000000550000005500000041000000aa6de884b0dd0378383cedddc39790b5cad66e42d5dc7655de728ee7eb3a53be071605d76641ad26766c6ed4864e67dbc2cd1526e006c9be7ccfa9b8cbf9e7c701',
  ]

  it('success', () => {
    const newWitness = signWitnesses({
      privateKey,
      witnesses: [witness],
      transactionHash: txHash,
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
  const changePriateKey = '0x15ec3e9ba7024557a116f37f08a99ee7769882c2cb4cfabeced1662394279747'

  beforeEach(() => {
    walletService.clearAll()
  })

  it('get keys', () => {
    const seed = hd.mnemonic.mnemonicToSeedSync(mnemonic)
    const masterKeychain = hd.Keychain.fromSeed(seed)
    const extendedKey = new hd.ExtendedPrivateKey(
      bytes.hexify(masterKeychain.privateKey),
      bytes.hexify(masterKeychain.chainCode)
    )
    const privateKey = bytes.hexify(masterKeychain.derivePath(receivingPath).privateKey)
    expect(privateKey).toEqual(receivingPrivateKey)
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

    const masterPrivateKey = wallet.loadKeystore().extendedPrivateKey(password)
    expect(bytes.hexify(masterKeychain.privateKey)).toEqual(masterPrivateKey.privateKey)

    const pathsAndKeys = new TransactionSender().getPrivateKeys(wallet, [receivingPath, changePath], password)
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
    const result = new TransactionSender().parseEpoch(epochInfo.epoch)

    expect(result.length).toEqual(epochInfo.length)
    expect(result.index).toEqual(epochInfo.index)
    expect(result.number).toEqual(epochInfo.number)
  })

  it('epoch since', () => {
    // @ts-ignore: Private method
    const epoch = new TransactionSender().epochSince(epochInfo.length, epochInfo.index, epochInfo.number)

    expect(epoch).toEqual(epochInfo.epoch + (BigInt(0x20) << BigInt(56)))
  })
})
