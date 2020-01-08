import OutPoint from '../../../src/models/chain/out-point'

describe('OutPoint', () => {
  const txHash = '0x' + '0'.repeat(64)
  const index = '0'

  const outPoint = new OutPoint(txHash, index)

  it('new', () => {
    expect(outPoint.txHash).toEqual(txHash)
    expect(outPoint.index).toEqual(index)
  })

  it('toSDK', () => {
    const s = outPoint.toSDK()
    expect(s.txHash).toEqual(outPoint.txHash)
    expect(s.index).toEqual('0x0')
  })

  it('fromSDK', () => {
    const o = OutPoint.fromSDK({
      txHash: outPoint.txHash,
      index: '0x0'
    })
    expect(o.txHash).toEqual(outPoint.txHash)
    expect(o.index).toEqual(outPoint.index)
  })
})
