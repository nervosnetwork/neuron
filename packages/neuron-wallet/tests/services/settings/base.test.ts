import BaseSettings from '../../../src/services/settings/base'
import FileService from '../../../src/services/file'

describe('BaseSettings', () => {
  let base: BaseSettings | undefined

  beforeEach(() => {
    const fileService = FileService.getInstance()
    // @ts-ignore: Private method
    const { moduleName, fileName } = BaseSettings
    if (fileService.hasFile(moduleName, fileName)) {
      fileService.deleteFileSync(moduleName, fileName)
    }

    base = new BaseSettings()
  })

  const key = 'testKey'
  const value = 'testValue'

  const key2 = 'testKey2'
  const value2 = 'testValue2'

  it('getInstance', () => {
    const baseSettings = BaseSettings.getInstance()
    expect(baseSettings).toBeInstanceOf(BaseSettings)
  })

  it('update', () => {
    expect(() => {
      base!.updateSetting(key, value)
    }).not.toThrowError()
  })

  it('read empty', () => {
    const settings = base!.read()
    expect(settings).toBeUndefined()
  })

  it('update and read', () => {
    base!.updateSetting(key, value)
    const settings = base!.read()
    expect(settings).toEqual({ [key]: value })
  })

  it('update and get', () => {
    base!.updateSetting(key, value)
    const result = base!.getSetting(key)
    expect(result).toEqual(value)
  })

  it('update multi', () => {
    base!.updateSetting(key, value)
    base!.updateSetting(key2, value2)
    const result = base!.read()
    expect(result).toEqual({
      [key]: value,
      [key2]: value2,
    })
  })

  it('update multi and get', () => {
    base!.updateSetting(key, value)
    base!.updateSetting(key2, value2)
    const result = base!.getSetting(key)
    expect(result).toEqual(value)
  })

  it('update key multi times', () => {
    base!.updateSetting(key, value)
    base!.updateSetting(key, value2)

    const result = base!.getSetting(key)
    expect(result).toEqual(value2)
  })

  it('new instance', () => {
    base!.updateSetting(key, value)
    const newInstance = new BaseSettings()
    const result = newInstance.getSetting(key)
    expect(result).toEqual(value)
  })

  it('getSetting empty', () => {
    expect(base!.read()).toBeUndefined()
    const result = base!.getSetting(key)
    expect(result).toBeUndefined()
  })
})
