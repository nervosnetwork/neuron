import parseSUDTTokenInfo from "../../../src/utils/parse_sudt_token_info";

describe('parseSUDTTokenInfo', () => {
  it('parse sudt token info should success', function () {
    const hexData = '0x080a456972632d320a455432'
    const { decimal, name, symbol } = parseSUDTTokenInfo(hexData)
    expect(decimal).toEqual('8')
    expect(name).toEqual('Eirc-2')
    expect(symbol).toEqual('ET2')
  });

  it('parse sudt token info with invalid hex data', function () {
    const hexData = '0x080a456972632d321a455432'
    const { decimal, name, symbol } = parseSUDTTokenInfo(hexData)
    expect(decimal).toEqual('8')
    expect(name).not.toEqual('Eirc-2')
    expect(symbol).toEqual('')
  });

  it('parse sudt token info with field not enough', function () {
    const hexData = '0x080a456972632d32'
    const { decimal, name, symbol } = parseSUDTTokenInfo(hexData)
    expect(decimal).toEqual('8')
    expect(name).toEqual('Eirc-2')
    expect(symbol).toEqual('')
  });
})
