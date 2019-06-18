import Blake2b from '../../src/utils/blake2b'

describe('Blake2b Test', () => {
  const defaultData = {
    message: '',
    digest: '0x44f4c69744d5f8c55d642062949dcae49bc4e7ef43d388c5a12f42b5633d163e',
  }

  it('success', () => {
    const blake2b = new Blake2b()
    blake2b.update(defaultData.message)
    const digest = blake2b.digest()
    expect(digest).toEqual(defaultData.digest)
  })

  it('static digest', () => {
    const digest = Blake2b.digest(defaultData.message)
    expect(digest).toEqual(defaultData.digest)
  })
})
