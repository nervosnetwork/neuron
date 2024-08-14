// Add import env to load env
import env from '../../src/env'
import { AGGRON4, LINA } from '../../src/utils/systemScripts'

describe('Test env is loaded', () => {
  it('test xudt', () => {
    console.info(env.fileBasePath)
    expect(LINA.SCRIPTS.XUDT.CODE_HASH).toBe('0x0000000000000000000000000000000000000000000000000000000000000001')
    expect(AGGRON4.SCRIPTS.XUDT.CODE_HASH).toBe('0x0000000000000000000000000000000000000000000000000000000000000011')
  })
  it('test sudt', () => {
    expect(LINA.SCRIPTS.SUDT.CODE_HASH).toBe('0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212')
    expect(AGGRON4.SCRIPTS.SUDT.CODE_HASH).toBe('0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212')
  })
})
