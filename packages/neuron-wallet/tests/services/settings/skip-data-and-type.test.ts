import SkipDataAndType from '../../../src/services/settings/skip-data-and-type'
import FileService from '../../../src/services/file'
import BaseSettings from '../../../src/services/settings/base'

describe(`SkipDataAndType`, () => {
  let skipDataAndType: SkipDataAndType | undefined

  beforeEach(() => {
    const fileService = FileService.getInstance()
    // @ts-ignore: Private method
    const { moduleName, fileName } = BaseSettings
    if (fileService.hasFile(moduleName, fileName)) {
      fileService.deleteFileSync(moduleName, fileName)
    }

    skipDataAndType = new SkipDataAndType()
  })

  it('getInstance', () => {
    const skip = SkipDataAndType.getInstance()
    expect(skip).toBeInstanceOf(SkipDataAndType)
  })

  it('update', () => {
    expect(() => {
      skipDataAndType!.update(true)
    }).not.toThrowError()
  })

  describe('with instance cache', () => {
    it('get true', () => {
      skipDataAndType!.update(true)
      const skip = skipDataAndType!.get()
      expect(skip).toBe(true)
    })

    it('get false', () => {
      skipDataAndType!.update(false)
      const skip = skipDataAndType!.get()
      expect(skip).toBe(false)
    })
  })

  describe('without cache', () => {
    it('first time open', () => {
      const skip = skipDataAndType!.get()
      expect(skip).toBe(true)
    })

    it('new instance', () => {
      skipDataAndType!.update(false)
      const newInstance = new SkipDataAndType()
      const skip = newInstance.get()
      expect(skip).toBe(false)
    })
  })
})
