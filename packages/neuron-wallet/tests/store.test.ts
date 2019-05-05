import fs from 'fs'
import Store from '../src/utils/store'

describe(`Store`, () => {
  let store: Store
  beforeAll(() => {
    store = new Store('.', 'test.log')
  })
  afterAll(() => {
    const exist = fs.existsSync(store.location)
    if (exist) {
      fs.unlink(store.location, () => {})
    }
  })

  beforeEach(() => {
    if (!store) {
      throw new Error('store is not instantiated')
    }
  })

  it('store has init value {}', async () => {
    const value = await store.read()
    expect(value).toEqual({})
  })

  it('save a: 1', async () => {
    const success = await store.write('a', 1)
    expect(success).toBe(true)
  })

  it('save the same value', async () => {
    const success = await store.write('a', 1)
    expect(success).toBe('Same value')
  })

  it('read a: 1', async () => {
    const value = await store.read('a')
    expect(value).toBe(1)
  })

  it('update to a: 2', async () => {
    const newValue = 2
    const success = await store.write('a', newValue)
    if (!success) throw new Error('Failed save')
    const value = await store.read('a')
    expect(value).toBe(newValue)
  })

  it('save b: 1 synchronously', async () => {
    store.writeSync('b', 1)
    const value = await store.read('b')
    expect(value).toBe(1)
  })

  it('read b: 1 synchronously', () => {
    const value = store.readSync('b')
    expect(value).toBe(1)
  })

  it('delete file', async () => {
    const success = await store.clear()
    expect(success).toBe(true)
    const exist = fs.existsSync(store.location)
    expect(exist).toBe(false)
  })
})
