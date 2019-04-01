import Key from '../src/keys/key'
import HD from '../src/keys/hd'
import { KeysData } from '../src/keys/keystore'

describe('Key tests', () => {
  const mnemonic = 'mechanic oppose oyster normal bunker trim step nasty birth naive panel soldier'
  const privateKey = '4e91f531d3351fd561506538ec0a68ba05d3d3444197e81d615ab76bbd200488'
  const keystoreJson =
    '{"version":0,"id":"4f487d55-3eb0-415f-ac5a-718a658eb902","crypto":{"ciphertext":"742a369f241363e277dc26f6ff246000a33439c06998e199d1bb128af44c50cc25916b7dcd3cac88481c385b92e8a441e9fed90e58f446a82121cd17d7feb470c76aa98a6d4ec23dbf5498f877db4ac464778bd31db276739db61d58ff965d7eed05db4e245d3df7fd9ab1e16f81d995ea57e86ccc9becf2dd1ce9982ab8a23fcd3f95ba7e760236cbbf595096d3e8951c6a9e8098ebe2e775b6343dd02ebfee","cipherparams":{"iv":"9fa1f0e981befc9b9f5d060c6ce217cd"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"7bb0010ccb6909c3eeba64d7767c98fa6734e2c1ac14e90521148dbd107b7426","n":8192,"r":8,"p":1},"mac":"4166fa6fe5a3300d2d6b7d8239efe156f603d1da5470e1fbaaf484f09fd7f705"}}'

  it('import key from mnemonic', async () => {
    const { keystore } = Key.fromMnemonic(mnemonic, '1qaz.2wsx')
    const keyStr = Key.fromKeystore(keystore, '1qaz.2wsx')
    const key = JSON.parse(keyStr)
    expect(privateKey).toBe(key.privateKey)
  })

  it('import key from keystore', async () => {
    const keyStr = Key.fromKeystore(JSON.parse(keystoreJson), '1qaz.2wsx')
    const key = JSON.parse(keyStr)
    expect(privateKey).toBe(key.privateKey)
  })

  it('generate receive and change addresses', async () => {
    const keyStr = Key.fromKeystore(JSON.parse(keystoreJson), '1qaz.2wsx')
    const keysData: KeysData = JSON.parse(keyStr)
    const addresses = HD.generateReceiveAndChangeAddresses(keysData, 17, 3)
    expect(addresses.receive.length).toEqual(17)
    expect(addresses.change.length).toEqual(3)
    expect(addresses.receive[0]).not.toBe(undefined)
  })
})
