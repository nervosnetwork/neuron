import electron from 'electron'
import execa from 'execa'
import fs from 'fs'

const run = async (file: string) => {
  const result = await execa.stdout(electron.toString(), [file], {
    env: {
      ELECTRON_ENABLE_LOGGING: '1',
      ELECTRON_ENABLE_STACK_DUMPING: '1',
      ELECTRON_NO_ATTACH_CONSOLE: '1',
    },
  })

  return result.trim()
}

test('test setWallet', async () => {
  const storagePath = await run('tests/wallet_store/save-wallet.js')
  expect(JSON.parse(fs.readFileSync(storagePath, 'utf8'))).toMatchObject({
    wallet1: {
      name: 'wallet1',
      keystore: 'qazwsx',
    },
    WalletName: ['wallet1'],
  })
  fs.unlinkSync(storagePath)
})

test('test getWallet', async () => {
  const storagePath = await run('tests/wallet_store/get-wallet.js')
  expect(JSON.parse(fs.readFileSync(storagePath, 'utf8'))).toMatchObject({
    wallet1: {
      name: 'wallet1',
      keystore: 'qwerty',
    },
    WalletName: ['wallet1', 'wallet2'],
    wallet2: {
      name: 'wallet2',
      keystore: 'qwerty',
    },
  })
  fs.unlinkSync(storagePath)
})

test('test getAllWallets', async () => {
  const storagePath = await run('tests/wallet_store/get-all-wallets.js')
  expect(JSON.parse(fs.readFileSync(storagePath, 'utf8'))).toMatchObject([
    {
      name: 'wallet1',
      keystore: 'qazwsx',
    },
    {
      name: 'wallet2',
      keystore: 'dsf23423',
    },
    {
      name: 'wallet3',
      keystore: 'sadqwe',
    },
  ])
  fs.unlinkSync(storagePath)
})

test('test renameWallet', async () => {
  const storagePath = await run('tests/wallet_store/rename-wallet.js')
  expect(JSON.parse(fs.readFileSync(storagePath, 'utf8'))).toMatchObject({
    wallet2: {
      name: 'wallet2',
      keystore: 'qazwsx',
    },
    WalletName: ['wallet2'],
  })
  fs.unlinkSync(storagePath)
})

test('test delete wallet', async () => {
  const storagePath = await run('tests/wallet_store/delete-wallet.js')
  expect(JSON.parse(fs.readFileSync(storagePath, 'utf8'))).toMatchObject({
    WalletName: ['wallet1', 'wallet3'],
    wallet1: {
      name: 'wallet1',
      keystore: 'qazwsx',
    },
    wallet3: {
      name: 'wallet3',
      keystore: 'sadqwe',
    },
  })
  fs.unlinkSync(storagePath)
})
