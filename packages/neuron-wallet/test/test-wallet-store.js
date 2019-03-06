import fs from 'fs'
import electron from 'electron'
import test from 'ava'
import execa from 'execa'

const run = async file => {
  const result = await execa.stdout(electron, [file], {
    env: {
      ELECTRON_ENABLE_LOGGING: true,
      ELECTRON_ENABLE_STACK_DUMPING: true,
      ELECTRON_NO_ATTACH_CONSOLE: true,
    },
  })

  return result.trim()
}

test.serial('test setWallet', async t => {
  const storagePath = await run('test/wallet-store-tests/save-wallet.js')
  t.deepEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), {
    wallet1: {
      name: 'wallet1',
      keystore: 'qazwsx',
    },
    WalletName: ['wallet1'],
  })
  fs.unlinkSync(storagePath)
})

test.serial('test getWallet', async t => {
  const storagePath = await run('test/wallet-store-tests/get-wallet.js')
  t.deepEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), {
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

test.serial('test getAllWallet', async t => {
  const storagePath = await run('test/wallet-store-tests/get-all-wallets.js')
  t.deepEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), [
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

test.serial('test renameWallet', async t => {
  const storagePath = await run('test/wallet-store-tests/rename-wallet.js')
  t.deepEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), {
    wallet2: {
      name: 'wallet2',
      keystore: 'qazwsx',
    },
    WalletName: ['wallet2'],
  })
  fs.unlinkSync(storagePath)
})

test.serial('test delete wallet', async t => {
  const storagePath = await run('test/wallet-store-tests/delete-wallet.js')
  t.deepEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), {
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
