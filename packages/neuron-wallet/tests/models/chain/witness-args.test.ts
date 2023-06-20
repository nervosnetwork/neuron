import { blockchain } from '@ckb-lumos/base'
import { bytes } from '@ckb-lumos/codec'
import WitnessArgs from '../../../src/models/chain/witness-args'

describe('WitnessArgs', () => {
  describe('deserialize', () => {
    it('only lock', () => {
      const wit = new WitnessArgs('0x' + '1'.repeat(64))

      const s = bytes.hexify(blockchain.WitnessArgs.pack(wit.toSDK()))

      const dWit = WitnessArgs.deserialize(s)
      expect(dWit.lock).toEqual(wit.lock)
      expect(dWit.inputType).toEqual(wit.inputType)
      expect(dWit.outputType).toEqual(wit.outputType)
    })

    it('with inputType and outputType', () => {
      const wit = new WitnessArgs('0x' + '1'.repeat(64), '0x1234', '0x5678')

      const s = bytes.hexify(blockchain.WitnessArgs.pack(wit.toSDK()))

      const dWit = WitnessArgs.deserialize(s)
      expect(dWit.lock).toEqual(wit.lock)
      expect(dWit.inputType).toEqual(wit.inputType)
      expect(dWit.outputType).toEqual(wit.outputType)
    })
  })
})
