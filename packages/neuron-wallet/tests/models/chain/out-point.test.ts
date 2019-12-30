import { OutPointInterface } from '../../../src/models/chain/out-point'
import OutPoint from '../../../src/models/chain/out-point'

describe('OutPoint', () => {
  const outPointInterface: OutPointInterface = {
    txHash: '0x' + '0'.repeat(64),
    index: '0'
  }

  const outPoint = new OutPoint(outPointInterface)

  it('new', () => {
    expect(outPoint.txHash).toEqual(outPointInterface.txHash)
    expect(outPoint.index).toEqual(outPointInterface.index)
  })

  it('toInterface', () => {
    const i = outPoint.toInterface()
    expect(i).toEqual(outPointInterface)
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
