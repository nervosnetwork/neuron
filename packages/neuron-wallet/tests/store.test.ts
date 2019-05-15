import fs from 'fs'
import path from 'path'
import Store from '../src/utils/store'
import env from '../src/env'

describe(`Store`, () => {
  const moduleName = 'test'
  const filename = 'store.json'
  let store: Store

  beforeAll(() => {
    store = new Store(moduleName, filename, '{}')
  })

  afterAll(() => {
    store.clear()
  })

  beforeEach(() => {
    if (!store) {
      throw new Error('store is not instantiated')
    }
  })

  it('store has init value {}', () => {
    const value = store.readSync()
    expect(value).toEqual({})
  })

  it('writeSync a: 1', () => {
    const value = 1
    store.writeSync('a', value)
    expect(store.readSync('a')).toBe(value)
  })

  it('save the same value', () => {
    const value = 1
    store.writeSync('a', value)
    expect(store.readSync('a')).toBe(value)
  })

  it('readSync a: 1', () => {
    const value = store.readSync('a')
    expect(value).toBe(1)
  })

  it('read a: 1', async () => {
    const value = await store.read('a')
    expect(value).toBe(1)
  })

  it('update to a: 2', () => {
    const newValue = 2
    store.writeSync('a', newValue)
    const value = store.readSync('a')
    expect(value).toBe(newValue)
  })

  it('delete file', async () => {
    store.clear()
    const exist = fs.existsSync(path.resolve(env.fileBasePath, moduleName, filename))
    expect(exist).toBe(false)
  })
})
