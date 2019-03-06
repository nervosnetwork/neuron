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

test('test setWallet', async t => {
  const storagePath = await run('test/fixture.js')
  t.deepEqual(JSON.parse(fs.readFileSync(storagePath, 'utf8')), {
    wallet2: {
      name: 'wallet2',
      keystore: 'qwerty',
    },
    WalletName: ['wallet2'],
  })
  fs.unlinkSync(storagePath)
})
