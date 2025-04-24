import SystemScriptInfo from '../../src/models/system-script-info'

// for regression tests
describe('SystemScriptInfo', () => {
  const SECP_CODE_HASH = '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8'
  const DAO_CODE_HASH = '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e'
  const LEGACY_MULTISIG_CODE_HASH = '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8'
  const MULTISIG_CODE_HASH = '0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29'

  const secpScript = SystemScriptInfo.generateSecpScript('0x' + '0'.repeat(40))
  const legacyMultiSignScript = SystemScriptInfo.generateMultiSignScript(
    '0x' + '0'.repeat(40),
    LEGACY_MULTISIG_CODE_HASH
  )
  const multiSignScript = SystemScriptInfo.generateMultiSignScript('0x' + '0'.repeat(40), MULTISIG_CODE_HASH)
  const daoScript = SystemScriptInfo.generateDaoScript('0x')

  it('secp code hash', () => {
    expect(SystemScriptInfo.SECP_CODE_HASH).toEqual(SECP_CODE_HASH)
  })

  it('dao code hash', () => {
    expect(SystemScriptInfo.DAO_CODE_HASH).toEqual(DAO_CODE_HASH)
  })

  it('legacy multi sign code hash', () => {
    expect(SystemScriptInfo.LEGACY_MULTISIG_CODE_HASH).toEqual(LEGACY_MULTISIG_CODE_HASH)
  })

  it('multi sign code hash', () => {
    expect(SystemScriptInfo.MULTISIG_CODE_HASH).toEqual(MULTISIG_CODE_HASH)
  })

  it('isSecpScript', () => {
    expect(SystemScriptInfo.isSecpScript(secpScript)).toBeTruthy()
    expect(SystemScriptInfo.isSecpScript(legacyMultiSignScript)).toBeFalsy()
    expect(SystemScriptInfo.isSecpScript(multiSignScript)).toBeFalsy()
  })

  it('isMultiSignScript', () => {
    expect(SystemScriptInfo.isMultiSignScript(legacyMultiSignScript)).toBeTruthy()
    expect(SystemScriptInfo.isMultiSignScript(multiSignScript)).toBeTruthy()
    expect(SystemScriptInfo.isMultiSignScript(secpScript)).toBeFalsy()
  })

  it('isDaoScript', () => {
    expect(SystemScriptInfo.isDaoScript(daoScript)).toBeTruthy()
    expect(SystemScriptInfo.isDaoScript(secpScript)).toBeFalsy()
  })

  it('getInstance()', () => {
    const instance = SystemScriptInfo.getInstance()
    expect(instance).toBeInstanceOf(SystemScriptInfo)
  })
})
