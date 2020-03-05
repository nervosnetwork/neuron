import SystemScriptInfo from "../../src/models/system-script-info"

// for regression tests
describe('SystemScriptInfo', () => {
  const SECP_CODE_HASH = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"
  const DAO_CODE_HASH = "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e"
  const MULTI_SIGN_CODE_HASH = "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8"

  it("secp code hash", () => {
    expect(SystemScriptInfo.SECP_CODE_HASH).toEqual(SECP_CODE_HASH)
  })

  it("dao code hash", () => {
    expect(SystemScriptInfo.DAO_CODE_HASH).toEqual(DAO_CODE_HASH)
  })

  it("multi sign code hash", () => {
    expect(SystemScriptInfo.MULTI_SIGN_CODE_HASH).toEqual(MULTI_SIGN_CODE_HASH)
  })

  it('getInstance()', () => {
    const instance = SystemScriptInfo.getInstance()
    expect(instance).toBeInstanceOf(SystemScriptInfo)
  })
})
