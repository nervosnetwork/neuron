import WitnessArgs from "../../../src/models/chain/witness-args"
import { serializeWitnessArgs } from "@nervosnetwork/ckb-sdk-utils"

describe('WitnessArgs', () => {
  describe('deserialize', () => {
    it('only lock', () => {
      const wit = new WitnessArgs('0x' + '1'.repeat(64))

      const s = serializeWitnessArgs(wit.toSDK())

      const dWit = WitnessArgs.deserialize(s)
      expect(dWit.lock).toEqual(wit.lock)
      expect(dWit.inputType).toEqual(wit.inputType)
      expect(dWit.outputType).toEqual(wit.outputType)
    })

    it('with inputType and outputType', () => {
      const wit = new WitnessArgs('0x' + '1'.repeat(64), '0x1234', '0x5678')

      const s = serializeWitnessArgs(wit.toSDK())

      const dWit = WitnessArgs.deserialize(s)
      expect(dWit.lock).toEqual(wit.lock)
      expect(dWit.inputType).toEqual(wit.inputType)
      expect(dWit.outputType).toEqual(wit.outputType)
    })
  })
})
