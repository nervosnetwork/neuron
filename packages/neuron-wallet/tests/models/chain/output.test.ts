import Output from '../../../src/models/chain/output'
import Script, { ScriptHashType } from '../../../src/models/chain/script'

describe('Output', () => {
  const lockScript = new Script('0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8', '0x36c329ed630d6ce750712a477543672adab57f4c', ScriptHashType.Type)
  const output = new Output('1000', lockScript, undefined, '0x')
  const outputWithType = new Output('1000', lockScript, lockScript, '0x')
  const outputWithData = new Output('1000', lockScript, undefined, '0x1234')

  it('calculateBytesize', () => {
    expect(output.calculateBytesize()).toEqual(61)
    expect(outputWithType.calculateBytesize()).toEqual(114)
    expect(outputWithData.calculateBytesize()).toEqual(63)
  })
})
